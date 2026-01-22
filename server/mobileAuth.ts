import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { z } from 'zod';

const router = Router();

// JWT configuration - require secret in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}

// Use a development-only secret for local testing
const jwtSecret = JWT_SECRET || 'dev-only-jwt-secret-do-not-use-in-production';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(2).max(50),
});

function generateToken(userId: string): string {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function mobileAuthMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - no token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized - invalid token' });
  }

  const user = await storage.getUser(decoded.userId);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized - user not found' });
  }

  (req as any).mobileUser = user;
  next();
}

router.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid email or password format' });
    }

    const { email, password } = parsed.data;

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ 
        message: 'This account uses Replit login. Please use the web app to sign in.' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    const membership = await storage.getActiveTeamMembership(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.firstName || user.email?.split('@')[0],
        role: membership?.role || user.role || 'player',
        teamId: membership?.teamId || user.teamId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

router.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        message: parsed.error.errors[0]?.message || 'Invalid registration data' 
      });
    }

    const { email, password, username } = parsed.data;

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await storage.createMobileUser({
      email,
      passwordHash,
      firstName: username,
    });

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.firstName,
        role: 'player',
        teamId: null,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

router.post('/api/auth/logout', mobileAuthMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/api/auth/me', mobileAuthMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).mobileUser;
  const membership = await storage.getActiveTeamMembership(user.id);

  res.json({
    id: user.id,
    email: user.email,
    username: user.firstName || user.email?.split('@')[0],
    role: membership?.role || user.role || 'player',
    teamId: membership?.teamId || user.teamId,
  });
});

// Schema for setting mobile password
const setMobilePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Endpoint for web users to set a mobile password (requires web session auth)
router.post('/api/auth/set-mobile-password', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated via web session
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Please sign in to the web app first' });
    }

    const parsed = setMobilePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        message: parsed.error.errors[0]?.message || 'Invalid password format' 
      });
    }

    const { password } = parsed.data;
    const userId = (req.user as any).claims?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.email) {
      return res.status(400).json({ 
        message: 'Your account needs an email address to enable mobile login. Please update your profile first.' 
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await storage.updateUserPasswordHash(userId, passwordHash);

    res.json({ 
      message: 'Mobile password set successfully! You can now log in to the mobile app using your email and this password.',
      email: user.email
    });
  } catch (error) {
    console.error('Set mobile password error:', error);
    res.status(500).json({ message: 'Failed to set mobile password. Please try again.' });
  }
});

// Check if current user has mobile access set up
router.get('/api/auth/mobile-status', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = (req.user as any).claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      hasMobileAccess: !!user.passwordHash,
      email: user.email || null,
    });
  } catch (error) {
    console.error('Mobile status check error:', error);
    res.status(500).json({ message: 'Failed to check mobile status' });
  }
});

export default router;
