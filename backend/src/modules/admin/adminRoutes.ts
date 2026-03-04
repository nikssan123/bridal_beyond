import { Router } from 'express';
import * as adminController from './adminController';

const router = Router();

router.post('/login', adminController.login);
router.get('/tables', adminController.listTables);
router.get('/tables/:name', adminController.getTable);
router.delete('/listings/:id', adminController.deleteListing);

export default router;

