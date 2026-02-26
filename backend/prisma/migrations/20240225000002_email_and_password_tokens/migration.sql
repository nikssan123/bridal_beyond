-- Migration 002: email verification and password reset fields on users

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reset_password_token_hash VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ NULL;
