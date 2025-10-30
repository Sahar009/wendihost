-- Add missing apiKey column to Workspace
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;



