import { Request, Response, NextFunction } from 'express';
import * as shopsRepo from './shopsRepository';
import * as shopReviewsRepo from './shopReviewsRepository';
import { notFound, badRequest, forbidden } from '../../middleware/errorHandler';
import { ShopCreateInput } from './shopTypes';

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
    const shops = await shopsRepo.listActive(limit);
    res.json({ shops });
  } catch (e) {
    next(e);
  }
}

export async function getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idOrSlug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const shop = isUuid
      ? await shopsRepo.findById(idOrSlug)
      : await shopsRepo.findBySlug(idOrSlug);
    if (!shop) {
      next(notFound('Shop not found'));
      return;
    }
    if (shop.status !== 'approved') {
      next(notFound('Shop not found'));
      return;
    }
    res.json(shop);
  } catch (e) {
    next(e);
  }
}

export async function getShopReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idOrSlug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const shop = isUuid
      ? await shopsRepo.findById(idOrSlug)
      : await shopsRepo.findBySlug(idOrSlug);
    if (!shop || shop.status !== 'approved') {
      next(notFound('Shop not found'));
      return;
    }
    const reviews = await shopReviewsRepo.listByShopId(shop.id);
    res.json({ shopId: shop.id, reviews });
  } catch (e) {
    next(e);
  }
}

export async function createShopReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(forbidden('Not authenticated'));
      return;
    }
    const { idOrSlug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const shop = isUuid
      ? await shopsRepo.findById(idOrSlug)
      : await shopsRepo.findBySlug(idOrSlug);
    if (!shop || shop.status !== 'approved') {
      next(notFound('Shop not found'));
      return;
    }
    if (shop.ownerId === req.user.id) {
      res.status(403).json({ message: 'You cannot review your own shop.' });
      return;
    }
    const { rating, comment } = req.body;
    const authorName =
      (req.user as { name?: string }).name || (req.user as { email?: string }).email || 'Anonymous';
    const review = await shopReviewsRepo.create({
      shopId: shop.id,
      authorName,
      rating,
      comment: comment ?? '',
      authorUserId: req.user.id,
    });
    res.status(201).json({ shopId: shop.id, review });
  } catch (e) {
    next(e);
  }
}

export async function getMyShop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(forbidden('Not authenticated'));
      return;
    }
    const shop = await shopsRepo.findByOwnerId(req.user.id);
    if (!shop) {
      res.status(200).json(null);
      return;
    }
    res.json(shop);
  } catch (e) {
    next(e);
  }
}

export async function uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(forbidden('Not authenticated'));
      return;
    }
    if (!req.file) {
      next(badRequest('No file uploaded or invalid file type. Use JPEG, PNG or WebP (max 2MB).'));
      return;
    }
    const logoUrl = `/uploads/shops/${req.file.filename}`;
    res.json({ logoUrl });
  } catch (e) {
    next(e);
  }
}

export async function enlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(forbidden('Not authenticated'));
      return;
    }
    const existing = await shopsRepo.findByOwnerId(req.user.id);
    if (existing) {
      next(badRequest('You already have a shop. Only one shop per account.'));
      return;
    }
    const body = req.body as ShopCreateInput & { slug?: string };
    const name = (body.name || '').trim();
    if (!name) {
      next(badRequest('Shop name is required'));
      return;
    }
    const slug = (body.slug || slugFromName(name)).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      next(badRequest('Slug could not be derived from name. Provide a slug.'));
      return;
    }
    const createInput: ShopCreateInput = {
      name,
      slug,
      description: body.description?.trim() || undefined,
      address: body.address?.trim() || undefined,
      logoUrl: body.logoUrl?.trim() || undefined,
    };
    const shop = await shopsRepo.create(req.user.id, createInput);
    res.status(201).json(shop);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      next(badRequest('A shop with this name or slug already exists.'));
      return;
    }
    next(e);
  }
}
