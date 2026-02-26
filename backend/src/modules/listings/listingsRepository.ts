import { prisma } from '../../prisma';
import { ListingDTO } from './listingsTypes';

interface ListingRow {
  id: string;
  title: string;
  description: string;
  price: string;
  original_price: string | null;
  category: string;
  size: string;
  condition: string;
  color: string;
  brand: string;
  bust: string;
  waist: string;
  hips: string;
  length: string;
  seller_id: string;
  status: string | null;
  created_at: Date;
  seller_name: string;
  seller_avatar_url: string | null;
  seller_location: string | null;
  seller_member_since: Date | null;
  seller_rating: string | null;
  seller_listings_count: string;
  seller_is_verified: boolean;
}

function rowToDto(row: ListingRow, images: string[]): ListingDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: parseFloat(row.price),
    originalPrice: row.original_price != null ? parseFloat(row.original_price) : 0,
    category: row.category as ListingDTO['category'],
    size: row.size,
    condition: row.condition as ListingDTO['condition'],
    color: row.color,
    brand: row.brand,
    measurements: { bust: row.bust, waist: row.waist, hips: row.hips, length: row.length },
    images,
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      avatar: row.seller_avatar_url ?? '',
      rating: row.seller_rating != null ? parseFloat(row.seller_rating) : 0,
      listings: parseInt(row.seller_listings_count, 10),
      location: row.seller_location ?? '',
      memberSince: row.seller_member_since ? String(row.seller_member_since.getFullYear()) : '',
      isVerified: row.seller_is_verified,
    },
    status: row.status ?? undefined,
    createdAt: row.created_at.toISOString().split('T')[0],
  };
}

export interface ListFilters {
  category?: string;
  size?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc';
  sellerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ListResult {
  listings: ListingDTO[];
  total: number;
}

export async function list(filters: ListFilters): Promise<ListResult> {
  const where: any = {};
  if (filters.category) where.category = filters.category;
  if (filters.size) where.size = filters.size;
  if (filters.condition) where.condition = filters.condition;
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }
  if (filters.sellerId) where.seller_id = filters.sellerId;
  if (filters.status) where.status = filters.status;

  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;

  const [total, rows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        seller: {
          include: {
            reviewsReceived: true,
            listings: true,
          },
        },
      },
      orderBy: (() => {
        let orderBy: any = { created_at: 'desc' as const };
        if (filters.sortBy === 'price-asc') orderBy = { price: 'asc' as const };
        else if (filters.sortBy === 'price-desc') orderBy = { price: 'desc' as const };
        return orderBy;
      })(),
    }),
  ]);

  const listings = rows.map((l: any) => {
    const reviews = (l.seller.reviewsReceived as any[]) || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;
    const listingsCount = ((l.seller.listings as any[]) || []).length;
    return rowToDto(
      {
        id: l.id,
        title: l.title,
        description: l.description,
        price: l.price.toString(),
        original_price: l.original_price ? l.original_price.toString() : null,
        category: l.category,
        size: l.size,
        condition: l.condition,
        color: l.color,
        brand: l.brand,
        bust: l.bust,
        waist: l.waist,
        hips: l.hips,
        length: l.length,
        seller_id: l.seller_id,
        status: l.status,
        created_at: l.created_at,
        seller_name: l.seller.name,
        seller_avatar_url: l.seller.avatar_url,
        seller_location: l.seller.location,
        seller_member_since: l.seller.member_since,
        seller_rating: avgRating.toString(),
        seller_listings_count: listingsCount.toString(),
        seller_is_verified: !!l.seller.email_verified_at,
      },
      l.images.map((img: any) => img.url)
    );
  });

  return { listings, total };
}

export async function findById(id: string): Promise<ListingDTO | null> {
  const l: any = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: {
        include: {
          reviewsReceived: true,
          listings: true,
        },
      },
      images: {
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!l) return null;
  const reviews = (l.seller.reviewsReceived as any[]) || [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;
  const listingsCount = ((l.seller.listings as any[]) || []).length;
  return rowToDto(
    {
      id: l.id,
      title: l.title,
      description: l.description,
      price: l.price.toString(),
      original_price: l.original_price ? l.original_price.toString() : null,
      category: l.category,
      size: l.size,
      condition: l.condition,
      color: l.color,
      brand: l.brand,
      bust: l.bust,
      waist: l.waist,
      hips: l.hips,
      length: l.length,
      seller_id: l.seller_id,
      status: l.status,
      created_at: l.created_at,
      seller_name: l.seller.name,
      seller_avatar_url: l.seller.avatar_url,
      seller_location: l.seller.location,
      seller_member_since: l.seller.member_since,
      seller_rating: avgRating.toString(),
      seller_listings_count: listingsCount.toString(),
      seller_is_verified: !!l.seller.email_verified_at,
    },
    l.images.map((img: any) => img.url)
  );
}

export async function create(
  sellerId: string,
  data: {
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: string;
    size: string;
    condition: string;
    color: string;
    brand: string;
    bust: string;
    waist: string;
    hips: string;
    length: string;
    images: string[];
  }
): Promise<ListingDTO> {
  const listing = await prisma.listing.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      original_price: data.originalPrice ?? null,
      category: data.category,
      size: data.size,
      condition: data.condition,
      color: data.color,
      brand: data.brand,
      bust: data.bust,
      waist: data.waist,
      hips: data.hips,
      length: data.length,
      seller_id: sellerId,
      status: 'active',
      images: {
        create: data.images.map((url, index) => ({ url, position: index })),
      },
    },
  });
  const full = await findById(listing.id);
  if (!full) throw new Error('Failed to load created listing');
  return full;
}
