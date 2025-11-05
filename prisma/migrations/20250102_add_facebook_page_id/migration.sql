-- Add Facebook page ID to Workspace
ALTER TABLE "Workspace"
    ADD COLUMN IF NOT EXISTS "facebook_page_id" TEXT;

