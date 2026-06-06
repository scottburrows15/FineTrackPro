import session from "express-session";
import crypto from "crypto";
import type { Express, RequestHandler, Request } from "express";
import passport from "passport";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./email";
import type { User } from "@shared/schema";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const CANONICAL_HOST = "foulpay.co.uk";

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppBaseUrl(req: Request): string {
  if (process.env.NODE_ENV === "production") {
    return `https://${CANONICAL_HOST}`;
  }
  return `${req.protocol}://${req.get("host")}`;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set in production. Refusing to start with an insecure fallback session secret.",
    );
  }
  return "dev-only-session-secret-change-me";
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: getSessionSecret(),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

type SessionUser = {
  claims: {
    sub: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  };
  expires_at: number;
};

function toSessionUser(user: User): SessionUser {
  return {
    claims: {
      sub: user.id,
      email: user.email ?? null,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      profile_image_url: user.profileImageUrl ?? null,
    },
    expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "Name is required").max(50),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.post("/api/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.errors[0]?.message || "Invalid details" });
      }

      const { email, password, firstName } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res
          .status(400)
          .json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.createMobileUser({ email, passwordHash, firstName });

      req.login(toSessionUser(user), (err) => {
        if (err) return res.status(500).json({ message: "Could not start session" });
        res.status(201).json({ id: user.id, email: user.email });
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Please enter a valid email and password" });
      }

      const { email, password } = parsed.data;

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.login(toSessionUser(user), (err) => {
        if (err) return res.status(500).json({ message: "Could not start session" });
        res.json({ id: user.id, email: user.email });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    // Always respond with the same generic success to avoid revealing whether
    // an email is registered (prevents account enumeration).
    const genericResponse = {
      message:
        "If an account exists for that email, we've sent a link to reset your password.",
    };

    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.json(genericResponse);
      }

      const email = parsed.data.email.toLowerCase().trim();
      const user = await storage.getUserByEmail(email);

      if (user && user.email) {
        // Invalidate any outstanding tokens, then issue a fresh single-use one.
        await storage.invalidatePasswordResetTokensForUser(user.id);

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashResetToken(token);
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

        const resetUrl = `${getAppBaseUrl(req)}/reset-password?token=${token}`;
        await sendPasswordResetEmail(user.email, resetUrl);
      }

      return res.json(genericResponse);
    } catch (error) {
      console.error("Forgot password error:", error);
      // Still return generic success so we don't leak internal state.
      return res.json(genericResponse);
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.errors[0]?.message || "Invalid details" });
      }

      const { token, password } = parsed.data;
      const tokenHash = hashResetToken(token);
      const resetToken = await storage.getValidPasswordResetToken(tokenHash);

      if (!resetToken) {
        return res.status(400).json({
          message: "This reset link is invalid or has expired. Please request a new one.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await storage.updateUserPasswordHash(resetToken.userId, passwordHash);
      await storage.markPasswordResetTokenUsed(resetToken.id);

      return res.json({ message: "Your password has been reset. You can now sign in." });
    } catch (error) {
      console.error("Reset password error:", error);
      return res
        .status(500)
        .json({ message: "Could not reset password. Please try again." });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const user = req.user as any;
  if (req.isAuthenticated() && user?.claims?.sub) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
