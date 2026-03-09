-- Track when payout is released to the seller (used for dispute window logic)
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "payout_released_at" TIMESTAMPTZ;

