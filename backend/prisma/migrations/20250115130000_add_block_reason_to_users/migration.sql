-- Add blockReason and deleteReason fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "blockReason" TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;
