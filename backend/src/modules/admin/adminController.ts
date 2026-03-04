import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../prisma';
import * as listingsRepo from '../listings/listingsRepository';

const loginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const TABLES: Record<string, (limit: number) => Promise<unknown[]>> = {
  users: (limit) => prisma.user.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  listings: (limit) => prisma.listing.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  listing_images: (limit) =>
    prisma.listingImage.findMany({ take: limit, orderBy: { position: 'asc' } }),
  reviews: (limit) => prisma.review.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  favorites: (limit) => prisma.favorite.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  conversations: (limit) =>
    prisma.conversation.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  conversation_participants: (limit) =>
    prisma.conversationParticipant.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  messages: (limit) =>
    prisma.message.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  payments: (limit) =>
    prisma.payment.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  orders: (limit) => prisma.order.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
  disputes: (limit) =>
    // @ts-ignore: Dispute model exists in Prisma schema
    prisma.dispute.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
};

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  // For now, the admin token is simply the configured username; can be made stronger later.
  return token === env.adminUsername;
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
    return;
  }
  const { username, password } = parsed.data;
  if (username !== env.adminUsername || password !== env.adminPassword) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  // Return a very simple admin token for now; the frontend will send it via X-Admin-Token header.
  res.status(200).json({ token: env.adminUsername });
}

export async function listTables(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  res.json({ tables: Object.keys(TABLES) });
}

export async function getTable(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const name = req.params.name;
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const fetcher = TABLES[name];
  if (!fetcher) {
    res.status(404).json({ message: 'Unknown table' });
    return;
  }
  const rows = await fetcher(limit);
  res.json({ rows });
}

const deleteListingParams = z.object({ id: z.string().uuid() });

export async function deleteListing(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const parsed = deleteListingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid listing ID' });
    return;
  }
  const { id } = parsed.data;
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Listing not found' });
    return;
  }
  await listingsRepo.remove(id);
  res.status(204).send();
}

