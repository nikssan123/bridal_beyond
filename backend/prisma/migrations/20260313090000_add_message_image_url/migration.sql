-- Add image_url column to messages table for optional chat image attachments
ALTER TABLE "messages"
  ADD COLUMN "image_url" VARCHAR(512);

