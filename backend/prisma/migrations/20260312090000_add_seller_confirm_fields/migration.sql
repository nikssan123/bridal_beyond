-- Alter orders to support seller-confirmed auth flow
ALTER TABLE "orders"
  ADD COLUMN "seller_confirm_by" TIMESTAMPTZ,
  ADD COLUMN "cancellation_reason" VARCHAR(50);

