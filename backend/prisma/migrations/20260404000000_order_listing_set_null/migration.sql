-- Make listing_id nullable on orders so that deleting a listing preserves the order record
ALTER TABLE "orders" ALTER COLUMN "listing_id" DROP NOT NULL;

-- Drop the existing CASCADE foreign key and replace with SET NULL
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_listing_id_fkey";
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
