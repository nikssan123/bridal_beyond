import { prisma } from '../../prisma';

export interface ShopReviewDTO {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ShopReviewStats {
  averageRating: number;
  count: number;
}

export async function listByShopId(shopId: string): Promise<ShopReviewDTO[]> {
  const rows = await prisma.shopReview.findMany({
    where: { shop_id: shopId },
    orderBy: { created_at: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    userName: r.author_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at.toISOString().split('T')[0],
  }));
}

export async function getStatsByShopId(shopId: string): Promise<ShopReviewStats> {
  const agg = await prisma.shopReview.aggregate({
    where: { shop_id: shopId },
    _avg: { rating: true },
    _count: { id: true },
  });
  return {
    averageRating: agg._avg.rating ?? 0,
    count: agg._count.id,
  };
}

export async function create(data: {
  shopId: string;
  authorName: string;
  rating: number;
  comment: string;
  authorUserId?: string;
}): Promise<ShopReviewDTO> {
  const row = await prisma.shopReview.create({
    data: {
      shop_id: data.shopId,
      author_user_id: data.authorUserId ?? null,
      author_name: data.authorName,
      rating: data.rating,
      comment: data.comment,
    },
  });
  return {
    id: row.id,
    userName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString().split('T')[0],
  };
}
