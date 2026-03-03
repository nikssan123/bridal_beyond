import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ordersController from './ordersController';
import * as disputesController from '../disputes/disputesController';

const router = Router();

router.use(authMiddleware);

router.post('/', ordersController.createOrder);
router.get('/buyer', ordersController.listBuyerOrders);
router.get('/seller', ordersController.listSellerOrders);
router.get('/:id', ordersController.getOrder);
router.post('/:id/mark-shipped', ordersController.markShipped);
router.post('/:id/confirm-received', ordersController.confirmReceived);

router.post('/:id/disputes', disputesController.createForOrder);
router.get('/:id/disputes', disputesController.listForOrder);

export default router;

