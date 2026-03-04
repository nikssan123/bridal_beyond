import dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '4000'), 10),
  databaseUrl: getEnv('DATABASE_URL'),
  jwtSecret: getEnv('JWT_SECRET'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
  stripeSecretKey: getEnv('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: getEnv('STRIPE_WEBHOOK_SECRET', ''),
  stripePlatformFeePercent: parseInt(getEnv('STRIPE_PLATFORM_FEE_PERCENT', '5'), 10),
  stripeBuyerFeePercent: parseInt(getEnv('STRIPE_BUYER_FEE_PERCENT', '5'), 10),
  clientUrl: getEnv('CLIENT_URL', 'http://localhost:5173'),
  stripeCurrency: (getEnv('STRIPE_CURRENCY', 'eur') || 'eur').toLowerCase(),
  adminUsername: getEnv('ADMIN_USERNAME', 'admin'),
  adminPassword: getEnv('ADMIN_PASSWORD', 'change-me'),
  googleClientId: getEnv('GOOGLE_CLIENT_ID'),
};
