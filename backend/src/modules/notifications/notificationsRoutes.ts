import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notificationsController';

const router = Router();

router.use(authMiddleware);

router.get('/me', listMyNotifications);
router.post('/me/mark-all-read', markAllNotificationsRead);
router.post('/:id/read', markNotificationRead);

export default router;

