import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadShopLogo } from '../../middleware/uploadShopLogo';
import * as shopsController from './shopsController';

const listQuerySchema = {
  query: z.object({
    limit: z.coerce.number().min(1).max(50).optional(),
  }),
};

const idOrSlugParam = {
  params: z.object({ idOrSlug: z.string().min(1) }),
};

const createShopSchema = {
  body: z.object({
    name: z.string().min(1).max(255),
    slug: z.string().max(255).optional(),
    description: z.string().max(2000).optional(),
    address: z.string().max(500).optional(),
    logoUrl: z.string().max(2000).optional().refine(
      (val) => !val || val.startsWith('/') || /^https?:\/\//i.test(val),
      { message: 'logoUrl must be a path (e.g. /uploads/...) or an absolute URL' }
    ),
  }),
};

const createShopReviewSchema = {
  params: z.object({ idOrSlug: z.string().min(1) }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
};

const router = Router();

router.get('/', validateRequest(listQuerySchema), shopsController.list);
router.get('/me', authMiddleware, shopsController.getMyShop);
router.post('/logo', authMiddleware, uploadShopLogo, shopsController.uploadLogo);
router.get('/:idOrSlug/reviews', validateRequest(idOrSlugParam), shopsController.getShopReviews);
router.post(
  '/:idOrSlug/reviews',
  authMiddleware,
  validateRequest(createShopReviewSchema),
  shopsController.createShopReview
);
router.get('/:idOrSlug', validateRequest(idOrSlugParam), shopsController.getByIdOrSlug);
router.post('/', authMiddleware, validateRequest(createShopSchema), shopsController.enlist);

export default router;
