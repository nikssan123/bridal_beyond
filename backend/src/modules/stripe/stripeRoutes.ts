import { Router } from 'express';
import * as stripeController from './stripeController';

const router = Router();

router.post('/connect', stripeController.connect);

export default router;
