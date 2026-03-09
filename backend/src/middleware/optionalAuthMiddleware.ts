import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload, AuthUser } from './authMiddleware';

/**
 * Like authMiddleware but does not return 401 when token is missing or invalid.
 * Sets req.user when a valid JWT is present; otherwise leaves req.user undefined.
 * Use for routes that support both authenticated and unauthenticated (e.g. guest) flows.
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    (req as Request & { user?: AuthUser }).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: (payload as any).name,
    };
  } catch {
    // Invalid or expired token – leave req.user undefined
  }
  next();
}
