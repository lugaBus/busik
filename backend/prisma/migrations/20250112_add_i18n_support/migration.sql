-- AlterTable: Convert name fields to JSON for i18n support
-- Note: This migration will convert existing string values to JSON format
-- Existing data will be preserved in all three language fields

-- Content Creators
ALTER TABLE "content_creators" 
ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('ua', "name", 'en', COALESCE("name", ''), 'ru', COALESCE("name", ''));

-- Categories  
ALTER TABLE "categories"
ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('ua', "name", 'en', COALESCE("name", ''), 'ru', COALESCE("name", '')),
ALTER COLUMN "description" TYPE jsonb USING CASE 
  WHEN "description" IS NULL THEN NULL 
  ELSE jsonb_build_object('ua', "description", 'en', COALESCE("description", ''), 'ru', COALESCE("description", ''))
END;

-- Tags
ALTER TABLE "tags"
ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('ua', "name", 'en', COALESCE("name", ''), 'ru', COALESCE("name", '')),
ALTER COLUMN "description" TYPE jsonb USING CASE 
  WHEN "description" IS NULL THEN NULL 
  ELSE jsonb_build_object('ua', "description", 'en', COALESCE("description", ''), 'ru', COALESCE("description", ''))
END;
