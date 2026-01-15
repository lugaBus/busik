-- CreateTable
CREATE TABLE "content_creator_submissions" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "quote" JSONB,
    "description" JSONB,
    "locale" TEXT NOT NULL DEFAULT 'uk-UA',
    "mainLink" TEXT,
    "photoUrls" JSONB,
    "rating" INTEGER,
    "contentFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tone" INTEGER NOT NULL DEFAULT 0,
    "audience" JSONB,
    "metrics" JSONB,
    "piterTest" TEXT,
    "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tagIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ratioIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platforms" JSONB,
    "userId" TEXT,
    "anonymousSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_creator_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_creator_submission_status" (
    "id" TEXT NOT NULL,
    "contentCreatorSubmissionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewedById" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_creator_submission_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_creator_submissions_userId_idx" ON "content_creator_submissions"("userId");

-- CreateIndex
CREATE INDEX "content_creator_submissions_anonymousSessionId_idx" ON "content_creator_submissions"("anonymousSessionId");

-- CreateIndex
CREATE INDEX "content_creator_submission_status_contentCreatorSubmissionId_idx" ON "content_creator_submission_status"("contentCreatorSubmissionId");

-- CreateIndex
CREATE INDEX "content_creator_submission_status_status_idx" ON "content_creator_submission_status"("status");

-- AddForeignKey
ALTER TABLE "content_creator_submissions" ADD CONSTRAINT "content_creator_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_creator_submissions" ADD CONSTRAINT "content_creator_submissions_anonymousSessionId_fkey" FOREIGN KEY ("anonymousSessionId") REFERENCES "anonymous_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_creator_submission_status" ADD CONSTRAINT "content_creator_submission_status_contentCreatorSubmissionId_fkey" FOREIGN KEY ("contentCreatorSubmissionId") REFERENCES "content_creator_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_creator_submission_status" ADD CONSTRAINT "content_creator_submission_status_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
