import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import * as reviewsController from './reviewsController';

const sellerIdParam = {
  params: z.object({ sellerId: z.string().min(1) }),
};

const createReviewSchema = {
  params: z.object({ sellerId: z.string().min(1) }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1),
    userName: z.string().min(1).optional(),
  }),
};

const router = Router();

router.get('/:sellerId/reviews', validateRequest(sellerIdParam), reviewsController.listBySeller);
router.post('/:sellerId/reviews', validateRequest(createReviewSchema), reviewsController.create);
