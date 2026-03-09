import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma';
import * as stripeService from '../../services/stripe.service';

const resolveDisputeBody = z.object({
  outcome: z.enum(['buyer_refund', 'seller_payout', 'no_refund', 'partial_refund']),
  refundAmountCents: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
});

export async function listDisputes(req: Request, res: Response): Promise<void> {
  try {
    const status = (req.query.status as string | undefined) || undefined;
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          include: {
            listing: true,
            buyer: true,
            seller: true,
          },
        },
        buyer: true,
      },
    });

    res.json(disputes);
  } catch (err) {
    console.error('List admin disputes error:', err);
    res.status(500).json({ message: 'Failed to load disputes' });
  }
}

export async function getDispute(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            listing: true,
            buyer: true,
            seller: true,
          },
        },
        buyer: true,
      },
    });
    if (!dispute) {
      res.status(404).json({ message: 'Dispute not found' });
      return;
    }
    res.json(dispute);
  } catch (err) {
    console.error('Get admin dispute error:', err);
    res.status(500).json({ message: 'Failed to load dispute' });
  }
}

export async function resolveDispute(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const parsed = resolveDisputeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
      return;
    }

    const body = parsed.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });
    if (!dispute) {
      res.status(404).json({ message: 'Dispute not found' });
      return;
    }
    if (dispute.status !== 'open') {
      res.status(400).json({ message: 'Dispute is already resolved' });
      return;
    }
    if (!dispute.order) {
      res.status(400).json({ message: 'Dispute has no associated order' });
      return;
    }

    const order = dispute.order;
    const now = new Date();

    const isPreCapture = order.status === 'shipped';

    let newStatus: 'resolved_buyer' | 'resolved_seller' | 'cancelled' = 'cancelled';

    if (isPreCapture) {
      if (body.outcome === 'partial_refund') {
        res
          .status(400)
          .json({ message: 'Partial refunds are not supported before payment capture' });
        return;
      }

      if (body.outcome === 'buyer_refund') {
        await stripeService.cancelPaymentIntent(order.payment_intent_id);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'cancelled' },
        });
        newStatus = 'resolved_buyer';
      } else if (body.outcome === 'seller_payout' || body.outcome === 'no_refund') {
        await stripeService.capturePaymentIntent(order.payment_intent_id);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'completed', payout_released_at: new Date() },
        });
        newStatus = body.outcome === 'seller_payout' ? 'resolved_seller' : 'cancelled';
      }
    } else {
      if (body.outcome === 'buyer_refund' || body.outcome === 'partial_refund') {
        const amount =
          body.outcome === 'partial_refund' ? body.refundAmountCents : undefined;
        if (body.outcome === 'partial_refund' && !amount) {
          res
            .status(400)
            .json({ message: 'refundAmountCents is required for partial_refund outcome' });
          return;
        }

        await stripeService.refundPaymentIntent({
          paymentIntentId: order.payment_intent_id,
          amountCents: amount,
        });

        if (body.outcome === 'buyer_refund') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'cancelled' },
          });
        }

        newStatus = 'resolved_buyer';
      } else if (body.outcome === 'seller_payout') {
        // Payment was already captured earlier; ensure payout timestamp is set if missing.
        if (!order.payout_released_at) {
          await prisma.order.update({
            where: { id: order.id },
            data: { payout_released_at: new Date() },
          });
        }
        newStatus = 'resolved_seller';
      } else if (body.outcome === 'no_refund') {
        newStatus = 'cancelled';
      }
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: newStatus,
        resolution_notes: body.notes ?? null,
        resolved_at: now,
      },
    });

    res.json(updatedDispute);
  } catch (err: any) {
    console.error('Resolve dispute error:', err);
    const code = err?.code ?? err?.statusCode;
    if (code === 'payment_intent_unexpected_state' || err?.message?.includes('capture')) {
      res.status(400).json({ message: err?.message ?? 'Stripe payment state does not allow this action' });
      return;
    }
    res.status(502).json({ message: 'Failed to resolve dispute' });
  }
}

