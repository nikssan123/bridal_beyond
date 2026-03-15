import { Router } from 'express';
import authRoutes from '../modules/auth/authRoutes';
import listingsRoutes from '../modules/listings/listingsRoutes';
import sellersRoutes from '../modules/sellers/sellersRoutes';
import shopsRoutes from '../modules/shops/shopsRoutes';
import favoritesRoutes from '../modules/favorites/favoritesRoutes';
import conversationsRoutes from '../modules/conversations/conversationsRoutes';
import stripeRoutes from '../modules/stripe/stripeRoutes';
import paymentsRoutes from '../modules/payments/paymentsRoutes';
import ordersRoutes from '../modules/orders/ordersRoutes';
import adminDisputesRoutes from '../modules/disputes/adminDisputesRoutes';
import adminRoutes from '../modules/admin/adminRoutes';
import messagesRoutes from '../modules/messages/messagesRoutes';
import notificationsRoutes from '../modules/notifications/notificationsRoutes';
import { authMiddleware } from '../middleware/authMiddleware';
import sitemapRoutes from '../modules/sitemap/sitemapRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingsRoutes);
router.use('/sellers', sellersRoutes);
router.use('/shops', shopsRoutes);
router.use('/favorites', authMiddleware, favoritesRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/messages', messagesRoutes);
router.use('/stripe', authMiddleware, stripeRoutes);
router.use('/payments', paymentsRoutes);
router.use('/orders', ordersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin/disputes', adminDisputesRoutes);
router.use('/admin', adminRoutes);
router.use('/sitemap.xml', sitemapRoutes);

export default router;
