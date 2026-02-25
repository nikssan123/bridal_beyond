import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized } from './errorHandler';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = _req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(unauthorized('Missing or invalid Authorization header'));
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    _req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}
