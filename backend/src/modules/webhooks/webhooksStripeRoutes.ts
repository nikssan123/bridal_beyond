import { Router } from 'express';
import * as webhooksStripeController from './webhooksStripeController';

const router = Router();

router.post('/stripe', webhooksStripeController.handleStripeWebhook);

export default router;
