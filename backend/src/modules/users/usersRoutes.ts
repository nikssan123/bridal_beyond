import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import * as usersController from './usersController';

const sellerIdParam = {
  params: z.object({ sellerId: z.string().min(1) }),
};

const router = Router();

router.get('/:sellerId', validateRequest(sellerIdParam), usersController.getSeller);

export default router;
