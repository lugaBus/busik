-- CreateTable
CREATE TABLE "proof_submission_status" (
    "id" TEXT NOT NULL,
    "proofSubmissionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewedById" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_submission_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proof_submission_status_proofSubmissionId_idx" ON "proof_submission_status"("proofSubmissionId");

-- CreateIndex
CREATE INDEX "proof_submission_status_status_idx" ON "proof_submission_status"("status");

-- AddForeignKey
ALTER TABLE "proof_submission_status" ADD CONSTRAINT "proof_submission_status_proofSubmissionId_fkey" FOREIGN KEY ("proofSubmissionId") REFERENCES "proof_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_submission_status" ADD CONSTRAINT "proof_submission_status_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
