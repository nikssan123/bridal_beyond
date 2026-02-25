export interface ReviewRow {
  id: string;
  seller_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: Date;
}

export interface ReviewDTO {
  id: string;
  sellerId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function listBySellerId(sellerId: string): Promise<ReviewDTO[]> {
  const { getPool } = await import('../../config/database');
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, seller_id, author_name, rating, comment, created_at
     FROM reviews
     WHERE seller_id = $1
     ORDER BY created_at DESC`,
    [sellerId]
  );
  return (res.rows as ReviewRow[]).map((r) => ({
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
  const { getPool } = await import('../../config/database');
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO reviews (seller_id, author_user_id, author_name, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, seller_id, author_name, rating, comment, created_at`,
    [data.sellerId, data.authorUserId ?? null, data.authorName, data.rating, data.comment]
  );
  const row = res.rows[0] as ReviewRow & { created_at: Date };
  return {
    id: row.id,
    sellerId: row.seller_id,
    userName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString().split('T')[0],
  };
}
