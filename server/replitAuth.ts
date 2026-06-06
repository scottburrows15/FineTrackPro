import session from "express-session";
import type { Express, RequestHandler } from "express";
import passport from "passport";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import type { User } from "@shared/schema";

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
