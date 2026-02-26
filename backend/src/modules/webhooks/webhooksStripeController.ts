import { Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../../config/env';
import { prisma } from '../../prisma';
import * as paymentsRepository from '../payments/paymentsRepository';

const stripe = new Stripe(env.stripeSecretKey);

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!env.stripeWebhookSecret) {
    res.status(500).json({ message: 'Webhook not configured' });
    return;
  }
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ message: 'Invalid body' });
    return;
  }
  const sig = req.headers['stripe-signature'];
  if (typeof sig !== 'string') {
    res.status(400).json({ message: 'Missing stripe-signature' });
    return;
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      env.stripeWebhookSecret
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    res.status(400).json({ message: 'Invalid signature' });
    return;
  }
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await paymentsRepository.updateStatus(pi.id, 'succeeded');
      const payment = await paymentsRepository.findByPaymentIntentId(pi.id);
      if (payment?.listing_id) {
        await prisma.listing.update({
          where: { id: payment.listing_id },
          data: { status: 'sold' },
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await paymentsRepository.updateStatus(pi.id, 'failed');
      break;
    }
    default:
      break;
  }
  res.status(200).send();
}
