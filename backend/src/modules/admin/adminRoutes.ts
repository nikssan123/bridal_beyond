import { Router } from 'express';
import * as adminController from './adminController';

const router = Router();

router.post('/login', adminController.login);
router.get('/tables', adminController.listTables);
router.get('/tables/:name', adminController.getTable);
router.post('/orders/:id/capture', adminController.captureOrderPayment);
router.delete('/listings/:id', adminController.deleteListing);
router.get('/listings/:id/images/order', adminController.getListingImagesOrder);
router.patch('/listings/:id/images/order', adminController.updateListingImagesOrder);
router.patch('/listings/:id/featured', adminController.updateListingFeatured);
router.patch('/listings/:id/text', adminController.updateListingText);

export default router;

