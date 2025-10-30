-- Add missing responseTemplate column to Campaign
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "responseTemplate" TEXT;



