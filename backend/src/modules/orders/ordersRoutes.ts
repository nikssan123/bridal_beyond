import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ordersController from './ordersController';

const router = Router();

router.use(authMiddleware);

router.post('/', ordersController.createOrder);
router.get('/seller', ordersController.listSellerOrders);
router.get('/:id', ordersController.getOrder);
router.post('/:id/mark-shipped', ordersController.markShipped);
router.post('/:id/confirm-received', ordersController.confirmReceived);

export default router;

