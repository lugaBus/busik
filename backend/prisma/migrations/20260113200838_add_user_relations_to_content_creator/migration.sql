-- AlterTable
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "publishedById" TEXT;

-- AddForeignKey
ALTER TABLE "content_creators" ADD CONSTRAINT "content_creators_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_creators" ADD CONSTRAINT "content_creators_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
