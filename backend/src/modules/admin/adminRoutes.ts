import { Router } from 'express';
import * as adminController from './adminController';

const router = Router();

router.post('/login', adminController.login);
router.get('/discounts', adminController.getDiscounts);
router.get('/tables', adminController.listTables);
router.get('/tables/:name/count', adminController.getTableCount);
router.get('/tables/:name', adminController.getTable);
router.get('/conversations', adminController.listConversations);
router.get('/conversations/:id/messages', adminController.getConversationMessages);
router.post('/orders/:id/capture', adminController.captureOrderPayment);
router.delete('/listings/:id', adminController.deleteListing);
router.get('/listings/:id/images/order', adminController.getListingImagesOrder);
router.patch('/listings/:id/images/order', adminController.updateListingImagesOrder);
router.patch('/listings/:id/featured', adminController.updateListingFeatured);
router.patch('/listings/:id/text', adminController.updateListingText);
router.get('/shops', adminController.listShops);
router.patch('/shops/:id/status', adminController.updateShopStatus);

export default router;

