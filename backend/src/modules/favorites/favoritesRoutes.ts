import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as favoritesController from './favoritesController';

const listingIdParamSchema = {
  params: z.object({ listingId: z.string().uuid() }),
};

const router = Router();

router.get('/', favoritesController.list);
router.post('/:listingId', validateRequest(listingIdParamSchema), favoritesController.add);
router.delete('/:listingId', validateRequest(listingIdParamSchema), favoritesController.remove);

export default router;
