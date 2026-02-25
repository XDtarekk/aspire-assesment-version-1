import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@aspire/db';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function signToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export interface JwtPayload {
  sub: string;
  role?: Role;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
