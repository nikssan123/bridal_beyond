import { prisma } from '../../prisma';
import type { ListingDTO } from '../listings/listingsTypes';

export async function findByUserId(userId: string): Promise<ListingDTO[]> {
  const favorites = await prisma.favorite.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      listing: {
        include: {
          images: { orderBy: { position: 'asc' } },
          seller: {
            include: {
              reviewsReceived: true,
              listings: true,
            },
          },
        },
      },
    },
  });

  return favorites
    .filter((f) => f.listing != null)
    .map((f) => {
      const l = f.listing as any;
      const reviews = (l.seller?.reviewsReceived || []) as any[];
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : 0;
      const listingsCount = ((l.seller?.listings as any[]) || []).length;
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        price: parseFloat(l.price?.toString() ?? '0'),
        originalPrice: l.original_price != null ? parseFloat(l.original_price.toString()) : 0,
        category: l.category,
        size: l.size,
        condition: l.condition,
        color: l.color,
        brand: l.brand,
        measurements: {
          bust: l.bust,
          waist: l.waist,
          hips: l.hips,
          length: l.length,
        },
        images: (l.images || []).map((img: any) => img.url),
        seller: {
          id: l.seller_id,
          name: l.seller?.name ?? '',
          avatar: l.seller?.avatar_url ?? '',
          rating: avgRating,
          listings: listingsCount,
          location: l.seller?.location ?? '',
          memberSince: l.seller?.member_since ? String(l.seller.member_since.getFullYear()) : '',
          isVerified: !!l.seller?.email_verified_at,
        },
        createdAt: l.created_at?.toISOString?.()?.split('T')[0] ?? '',
      } as ListingDTO;
    });
}

export async function add(userId: string, listingId: string): Promise<boolean> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return false;
  try {
    await prisma.favorite.create({
      data: { user_id: userId, listing_id: listingId },
    });
    return true;
  } catch (e: any) {
    if (e?.code === 'P2002') return true; // unique violation = already favorited (idempotent)
    throw e;
  }
}

export async function remove(userId: string, listingId: string): Promise<boolean> {
  const result = await prisma.favorite.deleteMany({
    where: { user_id: userId, listing_id: listingId },
  });
  return result.count > 0;
}
