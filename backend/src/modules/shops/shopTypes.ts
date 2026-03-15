export const shopStatuses = ['pending', 'approved', 'rejected'] as const;
export type ShopStatus = (typeof shopStatuses)[number];

export interface ShopSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  status: ShopStatus;
  listingsCount: number;
  createdAt: string;
}

export interface ShopReviewSummary {
  averageRating: number;
  count: number;
}

export interface ShopProfile extends ShopSummary {
  ownerName: string;
  ownerId: string;
  reviewSummary?: ShopReviewSummary;
}

export interface ShopProfileWithEmail extends ShopProfile {
  ownerEmail?: string;
}

export interface ShopCreateInput {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  logoUrl?: string;
}
