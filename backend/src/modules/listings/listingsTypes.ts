export const categories = ['wedding', 'graduation', 'evening'] as const;
export const conditions = ['new', 'like-new', 'good', 'fair'] as const;
export type Category = (typeof categories)[number];
export type Condition = (typeof conditions)[number];

export interface SellerSummary {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  listings: number;
  location: string;
  memberSince: string;
  isVerified?: boolean;
}

export interface ShopSummaryOnListing {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface ListingDTO {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: Category;
  size: string;
  condition: Condition;
  color: string;
  brand: string;
  measurements: { bust: string; waist: string; hips: string; length: string };
  images: string[];
  seller: SellerSummary;
  shop?: ShopSummaryOnListing;
  status?: string;
  createdAt: string;
}

export interface ListingCreateInput {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  size: string;
  condition: Condition;
  color: string;
  brand: string;
  measurements: { bust: string; waist: string; hips: string; length: string };
  images: string[];
  shopId?: string;
}
