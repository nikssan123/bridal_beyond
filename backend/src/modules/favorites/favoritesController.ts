import { Request, Response, NextFunction } from 'express';
import * as favoritesRepo from './favoritesRepository';
import { unauthorized, notFound } from '../../middleware/errorHandler';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const listings = await favoritesRepo.findByUserId(req.user.id);
    res.json(listings);
  } catch (e) {
    next(e);
  }
}

export async function add(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const { listingId } = req.params;
    const added = await favoritesRepo.add(req.user.id, listingId);
    if (!added) {
      next(notFound('Listing not found'));
      return;
    }
    res.status(201).json({ listingId });
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
    const { listingId } = req.params;
    await favoritesRepo.remove(req.user.id, listingId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
