import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

export function signToken(payload: Omit<JwtPayload, 'role'> & { role?: string }): string {
  const expiresIn = env.jwtExpiresIn === '7d' ? 7 * 24 * 60 * 60 : 86400;
  return jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role ?? 'user' },
    env.jwtSecret,
    { expiresIn }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
