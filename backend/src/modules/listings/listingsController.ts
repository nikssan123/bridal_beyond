import { Request, Response, NextFunction } from 'express';
import * as listingsRepo from './listingsRepository';
import { notFound, unauthorized } from '../../middleware/errorHandler';
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
    const listings = await listingsRepo.list({
      category,
      size,
      condition,
      minPrice,
      maxPrice,
      search,
      sortBy,
    });
    res.json(listings);
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
    const body = req.body as ListingCreateInput;
    const listing = await listingsRepo.create(userId, {
      title: body.title,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      category: body.category,
      size: body.size,
      condition: body.condition,
      color: body.color,
      brand: body.brand,
      bust: body.measurements.bust,
      waist: body.measurements.waist,
      hips: body.measurements.hips,
      length: body.measurements.length,
      images: Array.isArray(body.images) ? body.images : body.images ? [body.images] : [],
    });
    res.status(201).json(listing);
  } catch (e) {
    next(e);
  }
}
