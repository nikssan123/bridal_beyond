import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import * as authRepo from './authRepository';
import { signToken } from './jwt';
import { badRequest, unauthorized } from '../../middleware/errorHandler';

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const existing = await authRepo.findByEmail(email);
    if (existing) {
      next(badRequest('Email already registered', 'EMAIL_EXISTS'));
      return;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await authRepo.create({ name, email, passwordHash });
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await authRepo.findByEmail(email);
    if (!user) {
      next(unauthorized('Invalid email or password'));
      return;
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      next(unauthorized('Invalid email or password'));
      return;
    }
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const user = await authRepo.findById(req.user.id);
    if (!user) {
      next(unauthorized('User not found'));
      return;
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        location: user.location ?? undefined,
        memberSince: user.member_since ? String(user.member_since.getFullYear()) : undefined,
        avatarUrl: user.avatar_url ?? undefined,
      },
    });
  } catch (e) {
    next(e);
  }
}
