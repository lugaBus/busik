-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_submissions" (
    "id" TEXT NOT NULL,
    "contentCreatorId" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "description" JSONB,
    "userId" TEXT,
    "anonymousSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proof_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_submitterId_key" ON "anonymous_sessions"("submitterId");

-- CreateIndex
CREATE INDEX "proof_submissions_contentCreatorId_idx" ON "proof_submissions"("contentCreatorId");

-- CreateIndex
CREATE INDEX "proof_submissions_userId_idx" ON "proof_submissions"("userId");

-- CreateIndex
CREATE INDEX "proof_submissions_anonymousSessionId_idx" ON "proof_submissions"("anonymousSessionId");

-- AddForeignKey
ALTER TABLE "proof_submissions" ADD CONSTRAINT "proof_submissions_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_submissions" ADD CONSTRAINT "proof_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_submissions" ADD CONSTRAINT "proof_submissions_anonymousSessionId_fkey" FOREIGN KEY ("anonymousSessionId") REFERENCES "anonymous_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
