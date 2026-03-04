import { Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../../config/env';
import { prisma } from '../../prisma';
import * as paymentsRepository from '../payments/paymentsRepository';
import { sendOrderConfirmationEmail, sendSellerNewOrderEmail } from '../../services/mailService';

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
    case 'payment_intent.amount_capturable_updated': {
      // Manual capture: customer authorized payment; PI is now requires_capture. Mark order as payment_secured.
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.status === 'requires_capture' && pi.amount_capturable && pi.amount_capturable > 0) {
        await paymentsRepository.updateStatus(pi.id, 'requires_capture');
        try {
          const order = await prisma.order.findUnique({
            where: { payment_intent_id: pi.id },
            include: { listing: true, buyer: true, seller: true },
          });
          if (order && order.status === 'payment_pending') {
            const updated = await prisma.order.update({
              where: { id: order.id },
              data: { status: 'payment_secured' },
            });

            if (order.buyer && order.seller && order.listing) {
              const orderUrl = `${env.clientUrl}/orders/${order.id}`;
              const totalPrice = `${(Number(order.price_cents) / 100).toFixed(2)} лв.`;

              // Fire-and-forget buyer email
              sendOrderConfirmationEmail({
                to: order.buyer.email,
                name: order.buyer.name,
                orderUrl,
                listingTitle: order.listing.title,
                totalPrice,
              }).catch((err) =>
                console.error('Order confirmation email error (webhook):', err)
              );

              // Fire-and-forget seller email
              sendSellerNewOrderEmail({
                to: order.seller.email,
                sellerName: order.seller.name,
                orderUrl,
                listingTitle: order.listing.title,
                totalPrice,
                buyerName: order.buyer.name,
              }).catch((err) =>
                console.error('Seller new order email error (webhook):', err)
              );
            }

            console.log('Order marked payment_secured from webhook:', updated.id);
          }
        } catch (e) {
          console.error('Failed to update order from webhook (amount_capturable_updated):', e);
        }
      }
      break;
    }
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
      // If there is an Order associated to this PaymentIntent and it is still pending, mark as payment_secured
      try {
        const order = await prisma.order.findUnique({
          where: { payment_intent_id: pi.id },
        });
        if (order && order.status === 'payment_pending') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'payment_secured' },
          });
        }
      } catch (e) {
        console.error('Failed to update order from webhook:', e);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await paymentsRepository.updateStatus(pi.id, 'failed');
      try {
        const order = await prisma.order.findUnique({
          where: { payment_intent_id: pi.id },
        });
        if (order && order.status === 'payment_pending') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'cancelled' },
          });
        }
      } catch (e) {
        console.error('Failed to cancel order from webhook:', e);
      }
      break;
    }
    default:
      break;
  }
  res.status(200).send();
}
