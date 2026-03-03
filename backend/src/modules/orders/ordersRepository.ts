import { prisma } from '../../prisma';

export type OrderStatus =
  | 'payment_pending'
  | 'payment_secured'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export async function createOrder(params: {
  listingId: string;
  buyerId: string;
  sellerId: string;
  priceCents: number;
  platformFeeCents: number;
  paymentIntentId: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingAddressLine: string;
}) {
  return prisma.order.create({
    data: {
      listing_id: params.listingId,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      price_cents: params.priceCents,
      platform_fee_cents: params.platformFeeCents,
      payment_intent_id: params.paymentIntentId,
      status: 'payment_pending',
      shipping_full_name: params.shippingFullName,
      shipping_phone: params.shippingPhone,
      shipping_city: params.shippingCity,
      shipping_address_line: params.shippingAddressLine,
    },
  });
}

export async function findByIdForUser(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [{ buyer_id: userId }, { seller_id: userId }],
    },
    include: {
      listing: {
        include: {
          images: { orderBy: { position: 'asc' } },
          seller: true,
        },
      },
    },
  });
}

export async function findBySellerId(sellerId: string) {
  return prisma.order.findMany({
    where: { seller_id: sellerId },
    orderBy: { created_at: 'desc' },
    include: {
      listing: {
        include: {
          images: { orderBy: { position: 'asc' } },
          seller: true,
        },
      },
    },
  });
}

export async function findByBuyerId(buyerId: string) {
  return prisma.order.findMany({
    where: { buyer_id: buyerId },
    orderBy: { created_at: 'desc' },
    include: {
      listing: {
        include: {
          images: { orderBy: { position: 'asc' } },
          seller: true,
        },
      },
    },
  });
}

export async function findByPaymentIntentId(paymentIntentId: string) {
  return prisma.order.findUnique({
    where: { payment_intent_id: paymentIntentId },
  });
}

export async function findActiveByListingId(listingId: string) {
  return prisma.order.findFirst({
    where: {
      listing_id: listingId,
      status: { in: ['payment_pending', 'payment_secured', 'shipped'] },
    },
  });
}

export async function updateStatus(orderId: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function setShipmentInfo(orderId: string, data: { courier: string; trackingNumber: string }) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      courier: data.courier,
      tracking_number: data.trackingNumber,
      status: 'shipped',
    },
  });
}

