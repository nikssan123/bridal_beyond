import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import * as authRepository from '../auth/authRepository';
import * as listingsRepository from '../listings/listingsRepository';
import * as paymentsRepository from './paymentsRepository';
import * as stripeService from '../../services/stripe.service';

const createIntentBody = z.object({
  listingId: z.string().uuid(),
});

export async function createIntent(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createIntentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
      return;
    }
    const { listingId } = parsed.data;
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const listing = await listingsRepository.findById(listingId);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    if (listing.seller.id === userId) {
      res.status(400).json({ message: 'Cannot purchase own listing' });
      return;
    }
    const status = listing.status ?? 'active';
    if (status !== 'active') {
      res.status(400).json({ message: 'Listing not active' });
      return;
    }
    const seller = await authRepository.findById(listing.seller.id);
    if (!seller?.stripe_account_id) {
      res.status(400).json({ message: 'Seller has not connected Stripe' });
      return;
    }
    const amountCents = Math.round(listing.price * 100);
    const applicationFeeAmount = Math.round(
      amountCents * (env.stripePlatformFeePercent / 100)
    );
    const { id: paymentIntentId, client_secret } = await stripeService.createPaymentIntent({
      amountCents,
      currency: env.stripeCurrency,
      sellerStripeAccountId: seller.stripe_account_id,
      applicationFeeAmount,
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
    res.status(200).json({ clientSecret: client_secret, paymentIntentId });
  } catch (err) {
    console.error('Create payment intent error:', err);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
}

export async function capture(req: Request, res: Response): Promise<void> {
  try {
    const paymentIntentId = req.params.paymentIntentId as string;
    if (!paymentIntentId) {
      res.status(400).json({ message: 'Missing paymentIntentId' });
      return;
    }
    await stripeService.capturePaymentIntent(paymentIntentId);
    res.status(200).json({ message: 'Payment captured successfully' });
  } catch (err: any) {
    console.error('Capture payment error:', err);
    const code = err?.code ?? err?.statusCode;
    if (code === 'payment_intent_unexpected_state' || err?.message?.includes('capture')) {
      res.status(400).json({ message: err?.message ?? 'Cannot capture this payment' });
      return;
    }
    res.status(502).json({ message: 'Capture failed' });
  }
}
