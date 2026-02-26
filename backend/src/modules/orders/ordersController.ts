import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../prisma';
import * as stripeService from '../../services/stripe.service';
import * as ordersRepository from './ordersRepository';
import * as paymentsRepository from '../payments/paymentsRepository';

const createOrderBody = z.object({
  listingId: z.string().uuid(),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(3),
    city: z.string().min(1),
    addressLine: z.string().min(1),
  }),
});

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
      return;
    }
    const { listingId, shippingAddress } = parsed.data;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    if (listing.seller_id === userId) {
      res.status(400).json({ message: 'Cannot purchase own listing' });
      return;
    }
    const status = listing.status ?? 'active';
    if (status !== 'active') {
      res.status(400).json({ message: 'Listing not active' });
      return;
    }
    const seller = listing.seller;
    if (!seller?.stripe_account_id) {
      res.status(400).json({ message: 'Seller has not connected Stripe' });
      return;
    }

    const amountCents = Math.round(Number(listing.price) * 100);
    const platformFeeCents = Math.round(
      amountCents * (env.stripePlatformFeePercent / 100)
    );

    const { id: paymentIntentId, client_secret } = await stripeService.createPaymentIntent({
      amountCents,
      currency: env.stripeCurrency,
      sellerStripeAccountId: seller.stripe_account_id,
      applicationFeeAmount: platformFeeCents,
    });
    if (!client_secret) {
      res.status(500).json({ message: 'Failed to create payment intent' });
      return;
    }

    await paymentsRepository.create({
      payment_intent_id: paymentIntentId,
      listing_id: listingId,
      buyer_id: userId,
      amount_cents: amountCents,
      status: 'requires_capture',
    });

    const order = await ordersRepository.createOrder({
      listingId,
      buyerId: userId,
      sellerId: listing.seller_id,
      priceCents: amountCents,
      platformFeeCents,
      paymentIntentId,
      shippingFullName: shippingAddress.fullName,
      shippingPhone: shippingAddress.phone,
      shippingCity: shippingAddress.city,
      shippingAddressLine: shippingAddress.addressLine,
    });

    res.status(201).json({
      orderId: order.id,
      clientSecret: client_secret,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const order = await ordersRepository.findByIdForUser(orderId, userId);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Failed to load order' });
  }
}

const markShippedBody = z.object({
  courier: z.string().min(1),
  trackingNumber: z.string().min(1),
});

export async function markShipped(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const parsed = markShippedBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
      return;
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.seller_id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (order.status !== 'payment_secured') {
      res.status(400).json({ message: 'Order not ready to be shipped' });
      return;
    }
    const updated = await ordersRepository.setShipmentInfo(orderId, {
      courier: parsed.data.courier,
      trackingNumber: parsed.data.trackingNumber,
    });
    res.json(updated);
  } catch (err) {
    console.error('Mark shipped error:', err);
    res.status(500).json({ message: 'Failed to mark order as shipped' });
  }
}

export async function confirmReceived(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.buyer_id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (order.status !== 'shipped') {
      res.status(400).json({ message: 'Order is not shipped yet' });
      return;
    }

    await stripeService.capturePaymentIntent(order.payment_intent_id);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'completed' },
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Confirm received / capture error:', err);
    const code = err?.code ?? err?.statusCode;
    if (code === 'payment_intent_unexpected_state' || err?.message?.includes('capture')) {
      res.status(400).json({ message: err?.message ?? 'Cannot capture this payment' });
      return;
    }
    res.status(502).json({ message: 'Failed to confirm receipt' });
  }
}

export async function listSellerOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const orders = await ordersRepository.findBySellerId(userId);
    res.json(orders);
  } catch (err) {
    console.error('List seller orders error:', err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
}

