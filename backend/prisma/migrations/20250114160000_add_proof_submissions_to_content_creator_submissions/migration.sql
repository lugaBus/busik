-- AlterTable
ALTER TABLE "proof_submissions" 
  ALTER COLUMN "contentCreatorId" DROP NOT NULL,
  ADD COLUMN "contentCreatorSubmissionId" TEXT;

-- CreateIndex
CREATE INDEX "proof_submissions_contentCreatorSubmissionId_idx" ON "proof_submissions"("contentCreatorSubmissionId");

-- AddForeignKey
ALTER TABLE "proof_submissions" ADD CONSTRAINT "proof_submissions_contentCreatorSubmissionId_fkey" FOREIGN KEY ("contentCreatorSubmissionId") REFERENCES "content_creator_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
