import { Request, Response, NextFunction } from 'express';
import * as usersRepo from './usersRepository';
import { notFound } from '../../middleware/errorHandler';

export async function getSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sellerId } = req.params;
    const row = await usersRepo.getSellerSummary(sellerId);
    if (!row) {
      next(notFound('Seller not found'));
      return;
    }
    res.json({
      id: row.id,
      name: row.name,
      avatar: row.avatar_url ?? '',
      rating: row.rating != null ? parseFloat(row.rating) : 0,
      listings: parseInt(row.listings_count, 10),
      location: row.location ?? '',
      memberSince: row.member_since ? String(row.member_since.getFullYear()) : '',
    });
  } catch (e) {
    next(e);
  }
}
