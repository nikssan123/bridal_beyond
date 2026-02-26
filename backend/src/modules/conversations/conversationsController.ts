import { Request, Response, NextFunction } from 'express';
import * as conversationsRepo from './conversationsRepository';
import { unauthorized, notFound } from '../../middleware/errorHandler';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const { otherUserId, listingId } = req.body as { otherUserId: string; listingId?: string };
    const conversation = await conversationsRepo.findOrCreate(
      req.user.id,
      otherUserId,
      listingId ?? null
    );
    if (!conversation) {
      res.status(400).json({ message: 'Cannot create conversation with yourself or invalid user.' });
      return;
    }
    res.status(201).json(conversation);
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const conversations = await conversationsRepo.listForUser(req.user.id);
    res.json(conversations);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    const { id } = req.params;
    const conversation = await conversationsRepo.getById(id, req.user.id);
    if (!conversation) {
      next(notFound('Conversation not found'));
      return;
    }
    res.json(conversation);
  } catch (e) {
    next(e);
  }
}
