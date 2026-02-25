import app from './app';
import { env } from './config/env';
import { getPool } from './config/database';

async function main(): Promise<void> {
  try {
    await getPool().query('SELECT 1');
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
