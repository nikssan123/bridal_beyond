/**
 * Creates a single user for E2E tests. Run once against your test DB:
 *   npx dotenv -e .env.e2e -- node prisma/seed-e2e.js
 * Or with default .env: node prisma/seed-e2e.js
 *
 * User: e2e@example.com / e2e-test-password (email verified so login works)
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const E2E_EMAIL = 'e2e@example.com';
const E2E_PASSWORD = 'e2e-test-password';
const SALT_ROUNDS = 10;

async function main() {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, SALT_ROUNDS);
  const existing = await prisma.user.findUnique({ where: { email: E2E_EMAIL } });
  if (existing) {
    await prisma.user.update({
      where: { email: E2E_EMAIL },
      data: { password_hash: passwordHash, email_verified_at: new Date() },
    });
    console.log(`Updated E2E user: ${E2E_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        name: 'E2E Test User',
        email: E2E_EMAIL,
        password_hash: passwordHash,
        role: 'user',
        member_since: new Date(),
        email_verified_at: new Date(),
      },
    });
    console.log(`Created E2E user: ${E2E_EMAIL}`);
  }
  console.log(`  Password: ${E2E_PASSWORD}`);
  console.log('Set in client/.env.e2e: E2E_LOGIN_EMAIL=e2e@example.com E2E_LOGIN_PASSWORD=e2e-test-password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
