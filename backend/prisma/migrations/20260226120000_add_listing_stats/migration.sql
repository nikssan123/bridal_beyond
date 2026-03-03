-- CreateTable
CREATE TABLE "listing_stats" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "max_active_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "listing_stats_pkey" PRIMARY KEY ("id")
);

