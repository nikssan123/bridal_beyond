import type { User } from '@prisma/client';
import { prisma } from '../../prisma';

export type UserRow = User;

export async function findByEmail(email: string): Promise<UserRow | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function findById(id: string): Promise<UserRow | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function create(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  emailVerificationCode?: string;
  emailVerificationExpiresAt?: Date;
}): Promise<UserRow> {
  return prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password_hash: data.passwordHash,
      role: data.role ?? 'user',
      member_since: new Date(),
      email_verified_at: null,
      email_verification_code: data.emailVerificationCode ?? null,
      email_verification_expires_at: data.emailVerificationExpiresAt ?? null,
    },
  });
}

export async function setEmailVerified(userId: string): Promise<UserRow> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      email_verified_at: new Date(),
      email_verification_code: null,
      email_verification_expires_at: null,
    },
  });
}

export async function setPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<UserRow> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      reset_password_token_hash: tokenHash,
      reset_password_expires_at: expiresAt,
    },
  });
}

export async function findByResetTokenHash(tokenHash: string): Promise<UserRow | null> {
  return prisma.user.findFirst({
    where: {
      reset_password_token_hash: tokenHash,
      reset_password_expires_at: { gt: new Date() },
    },
  });
}

export async function clearPasswordResetAndSetPassword(
  userId: string,
  passwordHash: string
): Promise<UserRow> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      reset_password_token_hash: null,
      reset_password_expires_at: null,
      password_hash: passwordHash,
      email_verified_at: new Date(), // treat successful reset as implicit verification
    },
  });
}

export async function updateProfile(
  userId: string,
  data: { name?: string; location?: string | null; avatar_url?: string | null }
): Promise<UserRow> {
  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.location !== undefined) updateData.location = data.location?.trim() ?? null;
  if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url?.trim() || null;
  return prisma.user.update({
    where: { id: userId },
    data: updateData as any,
  });
}

export async function setStripeAccountId(userId: string, stripeAccountId: string): Promise<UserRow> {
  return prisma.user.update({
    where: { id: userId },
    data: { stripe_account_id: stripeAccountId, updated_at: new Date() },
  });
}

export async function anonymizeUser(userId: string): Promise<UserRow> {
  const now = new Date();
  // Keep the row for referential integrity but scrub personal data and credentials.
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Deleted user',
      email: `deleted+${userId}@example.com`,
      password_hash: '',
      avatar_url: null,
      location: null,
      stripe_account_id: null,
      email_verified_at: null,
      email_verification_code: null,
      email_verification_expires_at: null,
      reset_password_token_hash: null,
      reset_password_expires_at: null,
      updated_at: now,
    },
  });
}

