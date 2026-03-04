import { Router } from 'express';
import * as stripeController from './stripeController';

const router = Router();

router.post('/connect', stripeController.connect);
router.post('/account-link', stripeController.createAccountUpdateLink);
router.get('/account-status', stripeController.getAccountStatus);

export default router;
