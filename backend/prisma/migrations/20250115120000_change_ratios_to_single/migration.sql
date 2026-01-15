-- Step 1: Keep only the first ratio for each content creator (by createdAt)
-- Delete all ratios except the first one for each content creator
DELETE FROM content_creator_ratios
WHERE id NOT IN (
  SELECT DISTINCT ON ("contentCreatorId") id
  FROM content_creator_ratios
  ORDER BY "contentCreatorId", "createdAt" ASC
);

-- Step 2: Drop the existing unique constraint on (contentCreatorId, ratioId)
ALTER TABLE content_creator_ratios
DROP CONSTRAINT IF EXISTS content_creator_ratios_content_creator_id_ratio_id_key;

-- Step 3: Add unique constraint on contentCreatorId only (ensuring one ratio per creator)
ALTER TABLE content_creator_ratios
ADD CONSTRAINT content_creator_ratios_content_creator_id_key UNIQUE ("contentCreatorId");
