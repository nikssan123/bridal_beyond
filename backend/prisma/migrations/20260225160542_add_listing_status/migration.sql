-- DropForeignKey
ALTER TABLE "listing_images" DROP CONSTRAINT "listing_images_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "listings" DROP CONSTRAINT "listings_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_author_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_seller_id_fkey";

-- DropIndex
DROP INDEX "idx_listing_images_listing_id";

-- DropIndex
DROP INDEX "idx_listings_category";

-- DropIndex
DROP INDEX "idx_listings_condition";

-- DropIndex
DROP INDEX "idx_listings_created_at";

-- DropIndex
DROP INDEX "idx_listings_price";

-- DropIndex
DROP INDEX "idx_listings_seller_id";

-- DropIndex
DROP INDEX "idx_reviews_seller_id";

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "status" VARCHAR(20) DEFAULT 'active',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "member_since" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "email_verified_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "email_verification_expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "reset_password_expires_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
