-- AlterTable
ALTER TABLE "users" ADD COLUMN "meta_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_meta_id_key" ON "users"("meta_id");
