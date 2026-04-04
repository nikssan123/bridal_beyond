import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../prisma';
import * as listingsRepo from '../listings/listingsRepository';
import * as shopsRepo from '../shops/shopsRepository';
import * as ordersRepository from '../orders/ordersRepository';
import * as stripeService from '../../services/stripe.service';
import { sendAdminCustomEmail } from '../../services/mailService';

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
  shops: (limit) =>
    prisma.shop.findMany({ take: limit, orderBy: { created_at: 'desc' } }),
};

const TABLE_COUNTS: Record<string, () => Promise<number>> = {
  users: () => prisma.user.count(),
  listings: () => prisma.listing.count(),
  listing_images: () => prisma.listingImage.count(),
  reviews: () => prisma.review.count(),
  favorites: () => prisma.favorite.count(),
  conversations: () => prisma.conversation.count(),
  conversation_participants: () => prisma.conversationParticipant.count(),
  messages: () => prisma.message.count(),
  payments: () => prisma.payment.count(),
  orders: () => prisma.order.count(),
  disputes: async () =>
    // @ts-ignore: Dispute model exists in Prisma schema
    prisma.dispute.count(),
  shops: () => prisma.shop.count(),
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

export async function getDiscounts(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const limit = env.stripeFreeSellerCommissionOrderLimit;
  const totalOrders = await ordersRepository.countAll();
  const used = Math.min(totalOrders, limit);
  const discountsLeft = Math.max(0, limit - totalOrders);
  res.json({
    limit,
    used,
    discountsLeft,
    totalOrders,
  });
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

export async function getTableCount(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const name = req.params.name;
  const counter = TABLE_COUNTS[name];
  if (!counter) {
    res.status(404).json({ message: 'Unknown table' });
    return;
  }
  const count = await counter();
  res.json({ name, count });
}

export async function listConversations(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const conversations = await prisma.conversation.findMany({
    take: limit,
    orderBy: { updated_at: 'desc' },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      listing: { select: { id: true, title: true } },
    },
  });
  res.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      listing_id: c.listing_id,
      created_at: c.created_at,
      updated_at: c.updated_at,
      participants: c.participants.map((p) => p.user),
      listing: c.listing,
    })),
  });
}

export async function getConversationMessages(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const conversationId = req.params.id;
  if (!conversationId) {
    res.status(400).json({ message: 'Conversation ID required' });
    return;
  }
  const messages = await prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: 'asc' },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      body: m.body,
      image_url: m.image_url,
      created_at: m.created_at,
      sender: m.sender,
    })),
  });
}

export async function captureOrderPayment(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsed = captureOrderParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid order ID' });
    return;
  }
  const { id } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (!order.payment_intent_id) {
    res.status(400).json({ message: 'Order has no payment intent' });
    return;
  }

  if (order.status !== 'shipped') {
    res.status(400).json({ message: 'Order must be shipped before manual capture' });
    return;
  }

  try {
    await stripeService.capturePaymentIntent(order.payment_intent_id);
  } catch (err: any) {
    console.error('Admin capture payment error:', err);
    const code = err?.code ?? err?.statusCode;
    if (code === 'payment_intent_unexpected_state' || err?.message?.includes('capture')) {
      res.status(400).json({ message: err?.message ?? 'Cannot capture this payment' });
      return;
    }
    res.status(502).json({ message: 'Failed to capture payment' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'completed', payout_released_at: new Date() },
  });

  res.json(updated);
}

export async function refundOrder(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid order ID' });
    return;
  }
  const { id } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  if (!order.payment_intent_id) {
    res.status(400).json({ message: 'Order has no payment intent' });
    return;
  }

  if (order.status === 'cancelled') {
    res.status(400).json({ message: 'Order is already cancelled' });
    return;
  }

  try {
    if (order.status === 'completed') {
      await stripeService.refundPaymentIntent({ paymentIntentId: order.payment_intent_id });
    } else {
      await stripeService.cancelPaymentIntent(order.payment_intent_id);
    }
  } catch (err: any) {
    console.error('Admin refund order error:', err);
    res.status(502).json({ message: err?.message ?? 'Failed to refund order' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'cancelled', cancellation_reason: 'admin_refund' },
  });

  res.json(updated);
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

const captureOrderParams = z.object({ id: z.string().uuid() });

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

export async function listShops(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const status = (req.query.status as string) || undefined;
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 100));
  const shops = await shopsRepo.listForAdmin(status, limit);
  res.json({ shops });
}

const shopStatusBody = z.object({
  status: z.enum(['approved', 'rejected']),
});

const sendEmailBody = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().trim().min(1, 'Message is required').max(10000, 'Message too long'),
});

export async function sendEmail(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsed = sendEmailBody.safeParse(req.body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first =
      flat.formErrors[0] ??
      Object.values(flat.fieldErrors).flat()[0] ??
      'Invalid input';
    res.status(400).json({ message: first });
    return;
  }

  const { emails, subject, message } = parsed.data;

  const results: { email: string; ok: boolean; error?: string }[] = [];
  for (const email of emails) {
    try {
      await sendAdminCustomEmail({ to: email, subject, message });
      results.push({ email, ok: true });
    } catch (err: any) {
      console.error('Admin send email error for', email, err);
      results.push({ email, ok: false, error: err?.message ?? 'Failed to send' });
    }
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length === emails.length) {
    res.status(502).json({ message: 'All emails failed to send', results });
    return;
  }

  res.json({ results });
}

export async function updateShopStatus(req: Request, res: Response): Promise<void> {
  const token = req.header('x-admin-token');
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const shopId = req.params.id;
  const parsed = shopStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
    return;
  }
  const updated = await shopsRepo.updateStatus(shopId, parsed.data.status);
  if (!updated) {
    res.status(400).json({
      message: 'Shop not found or not pending. Only pending shops can be approved or rejected.',
    });
    return;
  }
  res.json(updated);
}

