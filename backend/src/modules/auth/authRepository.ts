import type { User } from '@prisma/client';
import { prisma } from '../../prisma';
import * as disputesRepository from '../disputes/disputesRepository';
import * as listingsRepository from '../listings/listingsRepository';

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

export async function findByGoogleId(googleId: string): Promise<UserRow | null> {
  return prisma.user.findUnique({
    where: { google_id: googleId },
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

export async function setGoogleId(userId: string, googleId: string): Promise<UserRow> {
  return prisma.user.update({
    where: { id: userId },
    data: { google_id: googleId, updated_at: new Date() },
  });
}

export async function createFromGoogle(data: {
  email: string;
  googleId: string;
  name: string;
  avatarUrl?: string | null;
}): Promise<UserRow> {
  return prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      google_id: data.googleId,
      avatar_url: data.avatarUrl ?? null,
      password_hash: null,
      role: 'user',
      member_since: new Date(),
      email_verified_at: new Date(),
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

const ACTIVE_ORDER_STATUSES = ['payment_pending', 'payment_secured', 'shipped', 'completed'] as const;

/**
 * Deletes all listings owned by the user that are not in an active order or open dispute.
 * Used when the user deletes their account.
 */
export async function deleteUserListingsExceptActive(userId: string): Promise<void> {
  const listingIds = await prisma.listing.findMany({
    where: { seller_id: userId },
    select: { id: true },
  }).then((rows) => rows.map((r) => r.id));
  if (listingIds.length === 0) return;

  const orders = await prisma.order.findMany({
    where: { listing_id: { in: listingIds } },
    select: { id: true, listing_id: true, status: true },
  });
  const orderIds = orders.map((o) => o.id);
  const orderIdsWithOpenDispute =
    orderIds.length > 0 ? await disputesRepository.findOrderIdsWithOpenDispute(orderIds) : [];
  const protectedListingIds = new Set<string>();
  for (const o of orders) {
    const isActive = ACTIVE_ORDER_STATUSES.includes(o.status as (typeof ACTIVE_ORDER_STATUSES)[number]);
    const hasOpenDispute = orderIdsWithOpenDispute.includes(o.id);
    if (isActive || hasOpenDispute) protectedListingIds.add(o.listing_id);
  }
  const toDelete = listingIds.filter((id) => !protectedListingIds.has(id));
  for (const listingId of toDelete) {
    await listingsRepository.remove(listingId);
  }
}

export async function anonymizeUser(userId: string): Promise<UserRow> {
  const now = new Date();
  // Keep the row for referential integrity but scrub personal data and credentials.
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Deleted user',
      email: `deleted+${userId}@example.com`,
      password_hash: null,
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

