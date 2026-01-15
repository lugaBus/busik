-- AlterTable
ALTER TABLE "content_creators" DROP COLUMN IF EXISTS "tone";
ALTER TABLE "content_creators" ADD COLUMN "tone" INTEGER NOT NULL DEFAULT 0;
