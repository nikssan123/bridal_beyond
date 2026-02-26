import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as paymentsController from './paymentsController';

const router = Router();

router.post('/create-intent', authMiddleware, paymentsController.createIntent);
router.post('/capture/:paymentIntentId', authMiddleware, requireAdmin, paymentsController.capture);

export default router;
