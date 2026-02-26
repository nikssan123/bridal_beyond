import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as adminDisputesController from './adminDisputesController';

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get('/', adminDisputesController.listDisputes);
router.get('/:id', adminDisputesController.getDispute);
router.post('/:id/resolve', adminDisputesController.resolveDispute);

export default router;

