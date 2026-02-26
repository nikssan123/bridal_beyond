import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as authRepo from './authRepository';
import { signToken } from './jwt';
import { badRequest, unauthorized } from '../../middleware/errorHandler';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../services/mailService';
import { env } from '../../config/env';

const SALT_ROUNDS = 10;

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

const RESET_TOKEN_EXPIRY_HOURS = 1;

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const existing = await authRepo.findByEmail(email);
    if (existing) {
      next(badRequest('Email already registered', 'EMAIL_EXISTS'));
      return;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
    const user = await authRepo.create({
      name,
      email,
      passwordHash,
      emailVerificationCode: code,
      emailVerificationExpiresAt: expiresAt,
    });
    await sendVerificationEmail({ to: user.email, name: user.name, code });
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: !!user.email_verified_at,
        hasStripeAccount: !!user.stripe_account_id,
      },
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: !!user.email_verified_at,
        hasStripeAccount: !!user.stripe_account_id,
      },
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
        role: user.role ?? 'user',
        isVerified: !!user.email_verified_at,
        location: user.location ?? undefined,
        memberSince: user.member_since ? String(user.member_since.getFullYear()) : undefined,
        avatarUrl: user.avatar_url ?? undefined,
        hasStripeAccount: !!user.stripe_account_id,
      },
    });
  } catch (e) {
    next(e);
  }
}

function toMeResponse(user: {
  id: string;
  name: string;
  email: string;
  email_verified_at: Date | null;
  location: string | null;
  member_since: Date;
  avatar_url: string | null;
  stripe_account_id: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isVerified: !!user.email_verified_at,
    location: user.location ?? undefined,
    memberSince: user.member_since ? String(user.member_since.getFullYear()) : undefined,
    avatarUrl: user.avatar_url ?? undefined,
    hasStripeAccount: !!user.stripe_account_id,
  };
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const { name, location, avatarUrl } = req.body;
    const updated = await authRepo.updateProfile(req.user.id, {
      name,
      location: location ?? null,
      avatar_url: avatarUrl ?? null,
    });
    res.json({ user: toMeResponse(updated) });
  } catch (e) {
    next(e);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!req.file) {
      next(badRequest('No file uploaded or invalid file type. Use JPEG, PNG or WebP (max 2MB).'));
      return;
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updated = await authRepo.updateProfile(req.user.id, {
      avatar_url: avatarUrl,
    });
    res.json({ user: toMeResponse(updated) });
  } catch (e) {
    next(e);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code } = req.body;
    const user = await authRepo.findByEmail(email);
    if (
      !user ||
      !user.email_verification_code ||
      !user.email_verification_expires_at ||
      user.email_verification_code !== code ||
      user.email_verification_expires_at < new Date()
    ) {
      next(badRequest('Invalid or expired verification code'));
      return;
    }
    const updated = await authRepo.setEmailVerified(user.id);
    const token = signToken({
      sub: updated.id,
      email: updated.email,
      role: updated.role,
    });
    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        isVerified: !!updated.email_verified_at,
        hasStripeAccount: !!updated.stripe_account_id,
      },
      token,
    });
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    const user = await authRepo.findByEmail(email);
    // Always respond 202 even if user not found (avoid user enumeration)
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
      await authRepo.setPasswordResetToken(user.id, tokenHash, expiresAt);
      const resetLink = `${env.corsOrigin}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetLink });
    }
    res.status(202).json({
      message: 'If an account exists with this email, you will receive instructions to reset your password.',
    });
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await authRepo.findByResetTokenHash(tokenHash);
    if (!user) {
      next(badRequest('Invalid or expired reset token'));
      return;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const updated = await authRepo.clearPasswordResetAndSetPassword(user.id, passwordHash);
    const jwt = signToken({ sub: updated.id, email: updated.email, role: updated.role });
    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        isVerified: !!updated.email_verified_at,
        hasStripeAccount: !!updated.stripe_account_id,
      },
      token: jwt,
    });
  } catch (e) {
    next(e);
  }
}
