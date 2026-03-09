-- Add is_featured flag to listings for curated featured offers
ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT FALSE;

