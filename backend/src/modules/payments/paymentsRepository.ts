import { prisma } from '../../prisma';

export async function create(params: {
  payment_intent_id: string;
  listing_id: string;
  buyer_id: string | null;
  amount_cents: number;
  status: string;
}) {
  return prisma.payment.create({
    data: params,
  });
}

export async function findByPaymentIntentId(paymentIntentId: string) {
  return prisma.payment.findUnique({
    where: { payment_intent_id: paymentIntentId },
    include: { listing: true },
  });
}

export async function updateStatus(paymentIntentId: string, status: string) {
  return prisma.payment.updateMany({
    where: { payment_intent_id: paymentIntentId },
    data: { status },
  });
}

export async function upsertByPaymentIntentId(params: {
  payment_intent_id: string;
  listing_id?: string | null;
  buyer_id?: string | null;
  amount_cents?: number;
  status: string;
}) {
  const existing = await prisma.payment.findUnique({
    where: { payment_intent_id: params.payment_intent_id },
  });
  if (existing) {
    return prisma.payment.update({
      where: { payment_intent_id: params.payment_intent_id },
      data: { status: params.status },
    });
  }
  if (params.listing_id && params.amount_cents != null) {
    return prisma.payment.create({
      data: {
        payment_intent_id: params.payment_intent_id,
        listing_id: params.listing_id,
        buyer_id: params.buyer_id ?? null,
        amount_cents: params.amount_cents,
        status: params.status,
      },
    });
  }
  return null;
}
