import { prisma } from '../../prisma';

export interface ReviewDTO {
  id: string;
  sellerId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function listBySellerId(sellerId: string): Promise<ReviewDTO[]> {
  const reviews = await prisma.review.findMany({
    where: { seller_id: sellerId },
    orderBy: { created_at: 'desc' },
  });
  return reviews.map((r: any) => ({
    id: r.id,
    sellerId: r.seller_id,
    userName: r.author_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at.toISOString().split('T')[0],
  }));
}

export async function create(data: {
  sellerId: string;
  authorName: string;
  rating: number;
  comment: string;
  authorUserId?: string;
}): Promise<ReviewDTO> {
  const row = await prisma.review.create({
    data: {
      seller_id: data.sellerId,
      author_user_id: data.authorUserId ?? null,
      author_name: data.authorName,
      rating: data.rating,
      comment: data.comment,
    },
  });
  return {
    id: row.id,
    sellerId: row.seller_id,
    userName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString().split('T')[0],
  };
}
