import { prisma } from '../../prisma';

export type OrderStatus =
  | 'payment_pending'
  | 'payment_secured'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export async function createOrder(params: {
  listingId: string;
  buyerId: string | null;
  sellerId: string;
  priceCents: number;
  platformFeeCents: number;
  paymentIntentId: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingAddressLine: string;
  guestEmail?: string | null;
  guestAccessToken?: string | null;
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
      guest_email: params.guestEmail ?? null,
      guest_access_token: params.guestAccessToken ?? null,
    },
  });
}

export async function countAll() {
  return prisma.order.count();
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

export async function findByIdForGuestToken(orderId: string, token: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      buyer_id: null,
      guest_access_token: token,
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
    where: { seller_id: sellerId, status: { not: 'cancelled' } },
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
    where: { buyer_id: buyerId, status: { not: 'cancelled' } },
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

/**
 * Link all guest orders (buyer_id null, guest_email = userEmail) to the given user.
 * Used when a user registers or logs in with an email that was used for guest checkout.
 */
export async function linkGuestOrdersToUser(userId: string, userEmail: string): Promise<number> {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const orders = await prisma.order.findMany({
    where: {
      buyer_id: null,
      guest_email: normalizedEmail,
    },
    select: { id: true, payment_intent_id: true },
  });
  if (orders.length === 0) return 0;
  await prisma.$transaction([
    prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { buyer_id: userId, guest_email: null, guest_access_token: null },
    }),
    prisma.payment.updateMany({
      where: { payment_intent_id: { in: orders.map((o) => o.payment_intent_id) } },
      data: { buyer_id: userId },
    }),
  ]);
  return orders.length;
}

