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

const listingImagesOrderParams = z.object({ id: z.string().uuid() });

const listingImagesOrderBody = z.object({
  imageIds: z.array(z.string().uuid()).min(1),
});

const listingFeaturedParams = z.object({ id: z.string().uuid() });

const listingFeaturedBody = z.object({
  isFeatured: z.boolean(),
});

const listingTextParams = z.object({ id: z.string().uuid() });

const listingTextBody = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title is too long')
    .transform((v) => v.trim())
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description is too long')
    .transform((v) => v.trim())
    .optional(),
}).refine(
  (data) => data.title !== undefined || data.description !== undefined,
  { message: 'At least one of title or description must be provided' },
);

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

export async function updateListingImagesOrder(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsedParams = listingImagesOrderParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ message: 'Invalid listing ID' });
    return;
  }

  const parsedBody = listingImagesOrderBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: 'Invalid body', errors: parsedBody.error.flatten() });
    return;
  }

  const { id: listingId } = parsedParams.data;
  const { imageIds } = parsedBody.data;

  const images = await prisma.listingImage.findMany({
    where: { listing_id: listingId },
    orderBy: { position: 'asc' },
  });

  if (images.length === 0) {
    res.status(404).json({ message: 'No images found for this listing' });
    return;
  }

  const imageIdSet = new Set(images.map((img) => img.id));
  const bodyIdSet = new Set(imageIds);

  const allBelongToListing = imageIds.every((imgId) => imageIdSet.has(imgId));
  const coversAllExisting = images.every((img) => bodyIdSet.has(img.id));

  if (!allBelongToListing || !coversAllExisting) {
    res.status(400).json({ message: 'Image IDs must match exactly the images for this listing' });
    return;
  }

  const updates = imageIds.map((imgId, index) =>
    prisma.listingImage.update({
      where: { id: imgId },
      data: { position: index },
    }),
  );

  const updated = await prisma.$transaction(updates);

  const ordered = updated
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => ({
      id: img.id,
      url: img.url,
      position: img.position,
    }));

  res.json({ images: ordered });
}

export async function getListingImagesOrder(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsedParams = listingImagesOrderParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ message: 'Invalid listing ID' });
    return;
  }

  const { id: listingId } = parsedParams.data;

  const images = await prisma.listingImage.findMany({
    where: { listing_id: listingId },
    orderBy: { position: 'asc' },
  });

  if (images.length === 0) {
    res.status(404).json({ message: 'No images found for this listing' });
    return;
  }

  const ordered = images.map((img) => ({
    id: img.id,
    url: img.url,
    position: img.position,
  }));

  res.json({ images: ordered });
}

export async function updateListingFeatured(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsedParams = listingFeaturedParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ message: 'Invalid listing ID' });
    return;
  }

  const parsedBody = listingFeaturedBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: 'Invalid body', errors: parsedBody.error.flatten() });
    return;
  }

  const { id } = parsedParams.data;
  const { isFeatured } = parsedBody.data;

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Listing not found' });
    return;
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { is_featured: isFeatured },
    select: { id: true, is_featured: true },
  });

  res.json({ id: updated.id, isFeatured: updated.is_featured });
}

export async function updateListingText(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsedParams = listingTextParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ message: 'Invalid listing ID' });
    return;
  }

  const parsedBody = listingTextBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: 'Invalid body', errors: parsedBody.error.flatten() });
    return;
  }

  const { id } = parsedParams.data;
  const { title, description } = parsedBody.data;

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Listing not found' });
    return;
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    select: { id: true, title: true, description: true },
  });

  res.json({ id: updated.id, title: updated.title, description: updated.description });
}

