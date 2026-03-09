import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma';
import * as disputesRepository from './disputesRepository';

const createDisputeBody = z.object({
  reason: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
});

export async function createForOrder(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsed = createDisputeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.buyer_id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (order.status !== 'shipped' && order.status !== 'completed') {
      res.status(400).json({ message: 'Disputes can only be opened for shipped or completed orders' });
      return;
    }

    if (order.payout_released_at) {
      const payoutReleasedAt = new Date(order.payout_released_at);
      const deadline = new Date(payoutReleasedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      const now = new Date();
      if (now > deadline) {
        res.status(400).json({
          message: 'Disputes can only be opened within 3 days after the payment is released to the seller',
        });
        return;
      }
    }

    const existingOpen = await disputesRepository.findOpenByOrderId(orderId);
    if (existingOpen) {
      res.status(400).json({ message: 'An open dispute already exists for this order' });
      return;
    }

    const type = order.status === 'shipped' ? 'pre_capture' : 'post_capture';

    const dispute = await disputesRepository.createForOrder({
      orderId,
      buyerId: userId,
      reason: parsed.data.reason,
      description: parsed.data.description,
      type,
    });

    res.status(201).json(dispute);
  } catch (err) {
    console.error('Create dispute error:', err);
    res.status(500).json({ message: 'Failed to create dispute' });
  }
}

export async function listForOrder(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id as string;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.buyer_id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const disputes = await disputesRepository.findByOrderIdForBuyer(orderId, userId);
    res.json(disputes);
  } catch (err) {
    console.error('List disputes error:', err);
    res.status(500).json({ message: 'Failed to load disputes' });
  }
}

