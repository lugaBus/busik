-- CreateTable
CREATE TABLE IF NOT EXISTS "platforms" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "description" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "platforms_slug_key" ON "platforms"("slug");

-- CreateTable
CREATE TABLE IF NOT EXISTS "content_creator_platforms" (
    "id" TEXT NOT NULL,
    "contentCreatorId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_creator_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "content_creator_platforms_contentCreatorId_platformId_url_key" ON "content_creator_platforms"("contentCreatorId", "platformId", "url");

-- AddForeignKey
ALTER TABLE "content_creator_platforms" ADD CONSTRAINT "content_creator_platforms_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_creator_platforms" ADD CONSTRAINT "content_creator_platforms_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove platforms JSON field from content_creators (if exists)
ALTER TABLE "content_creators" DROP COLUMN IF EXISTS "platforms";
