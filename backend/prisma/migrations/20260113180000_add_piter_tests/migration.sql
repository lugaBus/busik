-- CreateTable
CREATE TABLE IF NOT EXISTS "content_creator_piter_tests" (
    "id" TEXT NOT NULL,
    "contentCreatorId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_creator_piter_tests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "content_creator_piter_tests" ADD CONSTRAINT "content_creator_piter_tests_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove piterTest JSON field from content_creators (if exists)
ALTER TABLE "content_creators" DROP COLUMN IF EXISTS "piterTest";
