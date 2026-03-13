import { prisma } from '../prisma';
import * as stripeService from '../services/stripe.service';
import { env } from '../config/env';
import { sendBuyerOrderCancelledEmail } from '../services/mailService';

async function cancelStalePendingOrdersOnce(): Promise<void> {
  const now = new Date();
  const staleOrders = await prisma.order.findMany({
    where: {
      status: 'payment_pending',
      seller_confirm_by: {
        lt: now,
      },
    },
    include: {
      buyer: true,
      listing: true,
    },
    take: 50,
  });

  if (!staleOrders.length) {
    return;
  }

  for (const order of staleOrders) {
    try {
      await stripeService.cancelPaymentIntent(order.payment_intent_id);
    } catch (err) {
      console.error(
        'Failed to cancel payment intent for stale order',
        order.id,
        err
      );
    }

    try {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'cancelled', cancellation_reason: 'timeout' },
      });

      const toEmail = order.buyer?.email ?? order.guest_email ?? null;
      const buyerName = order.buyer?.name ?? order.shipping_full_name ?? null;
      const orderUrl =
        order.guest_access_token != null
          ? `${env.clientUrl}/orders/${order.id}?token=${order.guest_access_token}`
          : `${env.clientUrl}/orders/${order.id}`;

      if (toEmail && order.listing && buyerName) {
        sendBuyerOrderCancelledEmail({
          to: toEmail,
          name: buyerName,
          orderUrl,
          listingTitle: order.listing.title,
        }).catch((err) =>
          console.error('Buyer order-cancelled email error (timeout job):', err)
        );
      }
    } catch (err) {
      console.error('Failed to mark stale order as cancelled', order.id, err);
    }
  }
}

export function startCancelStalePendingOrdersJob(): void {
  const intervalMs = 5 * 60 * 1000;
  if (process.env.CANCEL_STALE_ORDERS_JOB === 'false') {
    return;
  }

  // Fire and forget; errors are logged inside the job.
  setInterval(() => {
    cancelStalePendingOrdersOnce().catch((err) => {
      console.error('Error in cancelStalePendingOrders job:', err);
    });
  }, intervalMs);
}

