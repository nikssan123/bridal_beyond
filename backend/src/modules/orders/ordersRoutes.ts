import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../../middleware/optionalAuthMiddleware';
import rateLimit from 'express-rate-limit';
import * as ordersController from './ordersController';
import * as disputesController from '../disputes/disputesController';

const router = Router();

const createOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many order attempts. Please try again later.' },
  standardHeaders: true,
});

router.post('/', createOrderLimiter, optionalAuthMiddleware, ordersController.createOrder);

router.get('/buyer', authMiddleware, ordersController.listBuyerOrders);
router.get('/seller', authMiddleware, ordersController.listSellerOrders);
router.post('/:id/mark-shipped', authMiddleware, ordersController.markShipped);
router.post('/:id/disputes', authMiddleware, disputesController.createForOrder);
router.get('/:id/disputes', authMiddleware, disputesController.listForOrder);

router.get('/:id', optionalAuthMiddleware, ordersController.getOrder);
router.post('/:id/confirm-received', optionalAuthMiddleware, ordersController.confirmReceived);

export default router;

