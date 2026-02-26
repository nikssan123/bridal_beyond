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
      rating: row.rating,
      listings: row.listings_count,
      location: row.location ?? '',
      memberSince: row.member_since ? String(row.member_since.getFullYear()) : '',
      isVerified: row.is_verified,
    });
  } catch (e) {
    next(e);
  }
}
