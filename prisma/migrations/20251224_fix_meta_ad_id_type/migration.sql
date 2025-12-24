-- Fix MetaAd.id type from integer to text
-- This migration safely converts existing integer IDs to text

-- First, drop the foreign key constraint if it exists
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_meta_ad_id_fkey";

-- Drop existing indexes on MetaAd
DROP INDEX IF EXISTS "MetaAd_userId_idx";
DROP INDEX IF EXISTS "MetaAd_workspaceId_idx";
DROP INDEX IF EXISTS "MetaAd_status_idx";

-- Convert MetaAd.id from integer to text
-- We'll use a temporary column approach to preserve data
ALTER TABLE "MetaAd" ADD COLUMN "id_new" TEXT;

-- Copy existing IDs as text
UPDATE "MetaAd" SET "id_new" = "id"::TEXT;

-- Update any references in Conversation table
UPDATE "Conversation" SET "meta_ad_id" = "meta_ad_id"::TEXT WHERE "meta_ad_id" IS NOT NULL;

-- Drop the old id column and rename the new one
ALTER TABLE "MetaAd" DROP CONSTRAINT "MetaAd_pkey";
ALTER TABLE "MetaAd" DROP COLUMN "id";
ALTER TABLE "MetaAd" RENAME COLUMN "id_new" TO "id";

-- Set the new id column as primary key
ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_pkey" PRIMARY KEY ("id");

-- Recreate indexes
CREATE INDEX "MetaAd_userId_idx" ON "MetaAd"("userId");
CREATE INDEX "MetaAd_workspaceId_idx" ON "MetaAd"("workspaceId");

-- Recreate the foreign key constraint
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_meta_ad_id_fkey" 
    FOREIGN KEY ("meta_ad_id") REFERENCES "MetaAd"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
