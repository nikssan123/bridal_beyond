-- AlterTable: Order - make buyer_id nullable, add guest fields
ALTER TABLE "orders" ALTER COLUMN "buyer_id" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN "guest_email" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN "guest_access_token" VARCHAR(64);
CREATE UNIQUE INDEX "orders_guest_access_token_key" ON "orders"("guest_access_token");

-- AlterTable: Payment - make buyer_id nullable
ALTER TABLE "payments" ALTER COLUMN "buyer_id" DROP NOT NULL;
