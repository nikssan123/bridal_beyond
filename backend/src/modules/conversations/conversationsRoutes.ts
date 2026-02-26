import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as conversationsController from './conversationsController';

const createConversationSchema = {
  body: z.object({
    otherUserId: z.string().uuid(),
    listingId: z.string().uuid().optional(),
  }),
};

const conversationIdParam = {
  params: z.object({ id: z.string().uuid() }),
};

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createConversationSchema), conversationsController.create);
router.get('/', conversationsController.list);
router.get('/:id', validateRequest(conversationIdParam), conversationsController.getOne);

export default router;
