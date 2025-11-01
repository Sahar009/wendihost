-- Add workspace-level Facebook configuration fields
ALTER TABLE "Workspace"
    ADD COLUMN IF NOT EXISTS "facebook_app_id" TEXT,
    ADD COLUMN IF NOT EXISTS "facebook_config_id" TEXT;

