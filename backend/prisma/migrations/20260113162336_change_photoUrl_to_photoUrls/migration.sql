-- AlterTable
ALTER TABLE "content_creators" DROP COLUMN IF EXISTS "photoUrl";
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "photoUrls" JSON;
