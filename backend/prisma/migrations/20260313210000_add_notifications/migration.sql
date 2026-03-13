-- CreateTable: notifications
CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "body" TEXT,
  "href" VARCHAR(255),
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Foreign key to users
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Index to efficiently query latest notifications per user
CREATE INDEX "notifications_user_id_created_at_idx"
  ON "notifications"("user_id", "created_at");

