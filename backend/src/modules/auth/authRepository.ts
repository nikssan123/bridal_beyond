export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  avatar_url: string | null;
  location: string | null;
  member_since: Date;
  created_at: Date;
  updated_at: Date;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const { getPool } = await import('../../config/database');
  const res = await getPool().query(
    'SELECT id, name, email, password_hash, role, avatar_url, location, member_since, created_at, updated_at FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return (res.rows[0] as UserRow) ?? null;
}

export async function findById(id: string): Promise<UserRow | null> {
  const { getPool } = await import('../../config/database');
  const res = await getPool().query(
    'SELECT id, name, email, password_hash, role, avatar_url, location, member_since, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return (res.rows[0] as UserRow) ?? null;
}

export async function create(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
}): Promise<UserRow> {
  const { getPool } = await import('../../config/database');
  const res = await getPool().query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, password_hash, role, avatar_url, location, member_since, created_at, updated_at`,
    [data.name.trim(), data.email.toLowerCase().trim(), data.passwordHash, data.role ?? 'user']
  );
  return res.rows[0] as UserRow;
}
