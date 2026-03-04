import { Request, Response, NextFunction } from 'express';
import * as listingsRepo from './listingsRepository';
import * as authRepository from '../auth/authRepository';
import { notFound, unauthorized, badRequest, forbidden } from '../../middleware/errorHandler';
import { ListingCreateInput } from './listingsTypes';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = (req.query.category as string) || undefined;
    const size = (req.query.size as string) || undefined;
    const condition = (req.query.condition as string) || undefined;
    const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : undefined;
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as 'newest' | 'price-asc' | 'price-desc') || 'newest';
    const sellerId = (req.query.sellerId as string) || undefined;
    let status = (req.query.status as string) || undefined;
    // By default, hide non-active (e.g. sold) listings from public browse endpoints.
    // Seller profile views explicitly pass a status filter and are not affected.
    if (!status && !sellerId) {
      status = 'active';
    }
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 24), 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const result = await listingsRepo.list({
      category,
      size,
      condition,
      minPrice,
      maxPrice,
      search,
      sortBy,
      sellerId,
      status,
      limit,
      offset,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const listing = await listingsRepo.findById(id);
    if (!listing) {
      next(notFound('Listing not found'));
      return;
    }
    res.json(listing);
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const userId = req.user.id;
     const user = await authRepository.findById(userId);
     if (!user) {
       next(unauthorized());
       return;
     }
     if (!user.stripe_account_id) {
       next(badRequest('Stripe payouts are not connected. Please connect Stripe before creating a listing.'));
       return;
     }
    const body = req.body as ListingCreateInput;
    const listing = await listingsRepo.create(userId, {
      title: body.title,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      category: body.category,
      size: body.size,
      condition: body.condition,
      color: body.color ?? '',
      brand: body.brand ?? '',
      bust: body.measurements.bust,
      waist: body.measurements.waist,
      hips: body.measurements.hips,
      length: body.measurements.length,
      images: Array.isArray(body.images) ? body.images : [],
    });
    res.status(201).json(listing);
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const { id } = req.params;
    const existing = await listingsRepo.findById(id);
    if (!existing) {
      next(notFound('Listing not found'));
      return;
    }
    if (existing.seller.id !== req.user.id) {
      next(forbidden('You can only edit your own listings.'));
      return;
    }
    const body = req.body as ListingCreateInput;
    const updated = await listingsRepo.update(id, {
      title: body.title,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      category: body.category,
      size: body.size,
      condition: body.condition,
      color: body.color ?? '',
      brand: body.brand ?? '',
      bust: body.measurements.bust,
      waist: body.measurements.waist,
      hips: body.measurements.hips,
      length: body.measurements.length,
      images: Array.isArray(body.images) ? body.images : [],
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const { id } = req.params;
    const existing = await listingsRepo.findById(id);
    if (!existing) {
      next(notFound('Listing not found'));
      return;
    }
    if (existing.seller.id !== req.user.id) {
      next(forbidden('You can only delete your own listings.'));
      return;
    }
    await listingsRepo.remove(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!req.file) {
      next(badRequest('No file uploaded or invalid file type. Use JPEG, PNG or WebP (max 10MB).'));
      return;
    }
    const url = `/uploads/listings/${req.file.filename}`;
    res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
}
