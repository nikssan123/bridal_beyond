import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { uploadMessageImage } from '../../middleware/uploadMessageImage';
import * as conversationsRepo from '../conversations/conversationsRepository';

const router = Router();

router.use(authMiddleware);

router.post(
  '/upload-image',
  uploadMessageImage,
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { conversationId } = (req.body || {}) as { conversationId?: string };
    if (!conversationId || typeof conversationId !== 'string') {
      res.status(400).json({ message: 'conversationId is required' });
      return;
    }

    const isPart = await conversationsRepo.isParticipant(conversationId, userId);
    if (!isPart) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ message: 'Image file is required' });
      return;
    }

    const url = `/uploads/messages/${file.filename}`;
    res.status(201).json({ url });
  }
);

export default router;

