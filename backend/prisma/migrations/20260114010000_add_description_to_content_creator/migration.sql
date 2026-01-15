-- AlterTable
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "description" JSONB;
