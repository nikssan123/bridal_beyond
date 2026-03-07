import { prisma } from '../../prisma';

export interface SellerSummaryRow {
  id: string;
  name: string;
  avatar_url: string | null;
  location: string | null;
  member_since: Date;
  rating: number;
  listings_count: number;
  is_verified: boolean;
  has_payment_setup: boolean;
}

export async function getSellerSummary(sellerId: string): Promise<SellerSummaryRow | null> {
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    include: {
      listings: true,
      reviewsReceived: true,
    },
  });
  if (!user) return null;

  const listings_count = user.listings.length;
  const rating =
    user.reviewsReceived.length > 0
      ? user.reviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) / user.reviewsReceived.length
      : 0;

  return {
    id: user.id,
    name: user.name,
    avatar_url: user.avatar_url,
    location: user.location,
    member_since: user.member_since,
    rating,
    listings_count,
    is_verified: !!user.email_verified_at,
    has_payment_setup: !!user.stripe_account_id,
  };
}

