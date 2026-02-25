import { getPool } from '../../config/database';

export interface SellerSummaryRow {
  id: string;
  name: string;
  avatar_url: string | null;
  location: string | null;
  member_since: Date;
  rating: string | null;
  listings_count: string;
}

export async function getSellerSummary(sellerId: string): Promise<SellerSummaryRow | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT
      u.id, u.name, u.avatar_url, u.location, u.member_since,
      (SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0)::text FROM reviews r WHERE r.seller_id = u.id) AS rating,
      (SELECT COUNT(*)::text FROM listings l WHERE l.seller_id = u.id) AS listings_count
    FROM users u
    WHERE u.id = $1`,
    [sellerId]
  );
  return (res.rows[0] as SellerSummaryRow) ?? null;
}
