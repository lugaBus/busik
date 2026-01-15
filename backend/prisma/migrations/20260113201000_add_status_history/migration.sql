-- CreateTable
CREATE TABLE IF NOT EXISTS "content_creator_status_history" (
    "id" TEXT NOT NULL,
    "contentCreatorId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_creator_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "content_creator_status_history_contentCreatorId_idx" ON "content_creator_status_history"("contentCreatorId");

-- AddForeignKey
ALTER TABLE "content_creator_status_history" ADD CONSTRAINT "content_creator_status_history_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_creator_status_history" ADD CONSTRAINT "content_creator_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
