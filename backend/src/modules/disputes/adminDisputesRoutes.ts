import { Router } from 'express';
import { adminOrRequireAdmin } from '../../middleware/adminOrRequireAdmin';
import * as adminDisputesController from './adminDisputesController';

const router = Router();

router.use(adminOrRequireAdmin);

router.get('/', adminDisputesController.listDisputes);
router.get('/:id', adminDisputesController.getDispute);
router.post('/:id/resolve', adminDisputesController.resolveDispute);

export default router;

