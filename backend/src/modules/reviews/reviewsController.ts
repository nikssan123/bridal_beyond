import { Request, Response, NextFunction } from 'express';
import * as reviewsRepo from './reviewsRepository';
import { notFound } from '../../middleware/errorHandler';

export async function listBySeller(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sellerId } = req.params;
    const reviews = await reviewsRepo.listBySellerId(sellerId);
    res.json(reviews);
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sellerId } = req.params;
    const { rating, comment, userName } = req.body;
    const authorName = (userName && String(userName).trim()) ? String(userName).trim() : (req.user ? req.user.email : 'Anonymous');
    const review = await reviewsRepo.create({
      sellerId,
      authorName,
      rating,
      comment,
      authorUserId: req.user?.id,
    });
    res.status(201).json(review);
  } catch (e) {
    next(e);
  }
}
