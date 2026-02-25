import { getPool } from '../../config/database';
import { ListingDTO, SellerSummary } from './listingsTypes';

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
  created_at: Date;
  seller_name: string;
  seller_avatar_url: string | null;
  seller_location: string | null;
  seller_member_since: Date | null;
  seller_rating: string | null;
  seller_listings_count: string;
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
    },
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
}

const listQuery = `
  SELECT
    l.id, l.title, l.description, l.price, l.original_price, l.category, l.size, l.condition,
    l.color, l.brand, l.bust, l.waist, l.hips, l.length, l.seller_id, l.created_at,
    u.name AS seller_name, u.avatar_url AS seller_avatar_url, u.location AS seller_location,
    u.member_since AS seller_member_since,
    (SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) FROM reviews r WHERE r.seller_id = l.seller_id) AS seller_rating,
    (SELECT COUNT(*)::text FROM listings ll WHERE ll.seller_id = l.seller_id) AS seller_listings_count
  FROM listings l
  JOIN users u ON u.id = l.seller_id
  WHERE 1=1
`;

export async function list(filters: ListFilters): Promise<ListingDTO[]> {
  const pool = getPool();
  const params: unknown[] = [];
  let paramIndex = 1;
  let sql = listQuery;

  if (filters.category) {
    sql += ` AND l.category = $${paramIndex++}`;
    params.push(filters.category);
  }
  if (filters.size) {
    sql += ` AND l.size = $${paramIndex++}`;
    params.push(filters.size);
  }
  if (filters.condition) {
    sql += ` AND l.condition = $${paramIndex++}`;
    params.push(filters.condition);
  }
  if (filters.minPrice != null) {
    sql += ` AND l.price >= $${paramIndex++}`;
    params.push(filters.minPrice);
  }
  if (filters.maxPrice != null) {
    sql += ` AND l.price <= $${paramIndex++}`;
    params.push(filters.maxPrice);
  }
  if (filters.search && filters.search.trim()) {
    sql += ` AND (l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`;
    params.push(`%${filters.search.trim()}%`);
    paramIndex++;
  }

  const sort =
    filters.sortBy === 'price-asc'
      ? ' ORDER BY l.price ASC'
      : filters.sortBy === 'price-desc'
        ? ' ORDER BY l.price DESC'
        : ' ORDER BY l.created_at DESC';
  sql += sort;

  const res = await pool.query(sql, params);
  const rows = res.rows as ListingRow[];
  const listingIds = rows.map((r) => r.id);
  const imagesRes =
    listingIds.length > 0
      ? await pool.query(
          'SELECT listing_id, url FROM listing_images WHERE listing_id = ANY($1) ORDER BY listing_id, position',
          [listingIds]
        )
      : { rows: [] };
  const imagesByListing: Record<string, string[]> = {};
  for (const r of imagesRes.rows as { listing_id: string; url: string }[]) {
    if (!imagesByListing[r.listing_id]) imagesByListing[r.listing_id] = [];
    imagesByListing[r.listing_id].push(r.url);
  }
  return rows.map((row) => rowToDto(row, imagesByListing[row.id] ?? []));
}

export async function findById(id: string): Promise<ListingDTO | null> {
  const pool = getPool();
  const res = await pool.query(
    `
    ${listQuery}
    AND l.id = $1
    `,
    [id]
  );
  const row = res.rows[0] as ListingRow | undefined;
  if (!row) return null;
  const imgRes = await pool.query('SELECT url FROM listing_images WHERE listing_id = $1 ORDER BY position', [id]);
  const images = (imgRes.rows as { url: string }[]).map((r) => r.url);
  return rowToDto(row, images);
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
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO listings (title, description, price, original_price, category, size, condition, color, brand, bust, waist, hips, length, seller_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id`,
    [
      data.title,
      data.description,
      data.price,
      data.originalPrice ?? null,
      data.category,
      data.size,
      data.condition,
      data.color,
      data.brand,
      data.bust,
      data.waist,
      data.hips,
      data.length,
      sellerId,
    ]
  );
  const listingId = (res.rows[0] as { id: string }).id;
  for (let i = 0; i < data.images.length; i++) {
    await pool.query(
      'INSERT INTO listing_images (listing_id, url, position) VALUES ($1, $2, $3)',
      [listingId, data.images[i], i]
    );
  }
  const listing = await findById(listingId);
  if (!listing) throw new Error('Failed to load created listing');
  return listing;
}
