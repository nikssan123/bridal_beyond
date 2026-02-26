import { prisma } from '../../prisma';

export type DisputeStatus = 'open' | 'resolved_buyer' | 'resolved_seller' | 'cancelled';

export async function findOpenByOrderId(orderId: string) {
  return prisma.dispute.findFirst({
    where: {
      order_id: orderId,
      status: 'open',
    },
  });
}

export async function createForOrder(params: {
  orderId: string;
  buyerId: string;
  reason: string;
  description?: string;
  type?: string | null;
}) {
  return prisma.dispute.create({
    data: {
      order_id: params.orderId,
      buyer_id: params.buyerId,
      status: 'open',
      reason: params.reason,
      description: params.description ?? null,
      type: params.type ?? null,
    },
  });
}

export async function findByOrderIdForBuyer(orderId: string, buyerId: string) {
  return prisma.dispute.findMany({
    where: {
      order_id: orderId,
      buyer_id: buyerId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

export async function findOrderIdsWithOpenDispute(orderIds: string[]): Promise<string[]> {
  if (orderIds.length === 0) return [];
  const rows = await prisma.dispute.findMany({
    where: {
      order_id: { in: orderIds },
      status: 'open',
    },
    select: { order_id: true },
    distinct: ['order_id'],
  });
  return rows.map((r) => r.order_id);
}

