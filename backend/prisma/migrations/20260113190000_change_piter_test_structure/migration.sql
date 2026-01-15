-- Drop old ContentCreatorPiterTest table
DROP TABLE IF EXISTS "content_creator_piter_tests";

-- Add piterTest field to content_creators
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "piterTest" TEXT;

-- CreateTable for PiterTestProof
CREATE TABLE IF NOT EXISTS "piter_test_proofs" (
    "id" TEXT NOT NULL,
    "contentCreatorId" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "description" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piter_test_proofs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "piter_test_proofs" ADD CONSTRAINT "piter_test_proofs_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
