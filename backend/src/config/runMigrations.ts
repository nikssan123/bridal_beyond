import { readFileSync } from 'fs';
import { join } from 'path';
import { getPool } from './database';

const migrationsDir = join(__dirname, 'migrations');

async function runMigrations(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = ['001_initial.sql'];
  for (const name of files) {
    const res = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [name]);
    if (res.rows.length > 0) {
      console.log(`Skip ${name}`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, name), 'utf-8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
    console.log(`Applied ${name}`);
  }
  console.log('Migrations done');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
