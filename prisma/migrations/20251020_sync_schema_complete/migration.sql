-- Sync database with current Prisma schema
-- This migration adds missing columns and tables without dropping existing data

-- Create missing enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "Status" AS ENUM ('PENDING', 'FAILED', 'SUCCESS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FileType" AS ENUM ('none', 'image', 'video', 'audio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdType" AS ENUM ('FACEBOOK', 'WHATSAPP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'DISAPPROVED', 'ARCHIVED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageSource" AS ENUM ('CAMPAIGN', 'WIDGET', 'META_ADS', 'DIRECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update MessageType enum to include 'broadcast'
DO $$ BEGIN
    ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'broadcast';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to existing tables
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "responseTemplate" TEXT;

-- Add missing columns to Workspace table
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;

-- Add missing columns to Contact table  
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "tag" TEXT DEFAULT 'new';

-- Add missing columns to Conversation table
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "source" "MessageSource" DEFAULT 'DIRECT';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "campaign_id" INTEGER;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "widget_id" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "meta_ad_id" TEXT;

-- Add missing columns to Message table
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN DEFAULT false;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "fileType" "FileType" DEFAULT 'none';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "link" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "messageId" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "status" "MessageStatus" DEFAULT 'sent';

-- Create missing tables
CREATE TABLE IF NOT EXISTS "Assistant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "knowledge" JSONB,
    "workspaceId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assistant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssistantKnowledgeChunk" (
    "id" SERIAL NOT NULL,
    "assistantId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WhatsAppWidget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'right',
    "bottom" INTEGER NOT NULL DEFAULT 20,
    "backgroundColor" TEXT NOT NULL DEFAULT '#25D366',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "icon" TEXT NOT NULL DEFAULT 'whatsapp',
    "widgetCode" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppWidget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Upload" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MetaAd" (
    "id" TEXT NOT NULL,
    "adName" TEXT NOT NULL,
    "adType" "AdType" NOT NULL DEFAULT 'FACEBOOK',
    "color" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "mediaUrl" TEXT,
    "adText" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "facebookAdId" TEXT,
    "campaignId" TEXT,
    "adSetId" TEXT,
    "creativeId" TEXT,
    "userId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAd_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutomationSettings" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "holidayMode" BOOLEAN NOT NULL DEFAULT false,
    "workingHours" JSONB NOT NULL DEFAULT '[]',
    "automationRules" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ResponseMaterial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponseMaterial_pkey" PRIMARY KEY ("id")
);

-- Create missing indexes
CREATE INDEX IF NOT EXISTS "Campaign_workspaceId_idx" ON "Campaign"("workspaceId");
CREATE INDEX IF NOT EXISTS "Campaign_userId_idx" ON "Campaign"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppWidget_widgetCode_key" ON "WhatsAppWidget"("widgetCode");
CREATE INDEX IF NOT EXISTS "WhatsAppWidget_userId_idx" ON "WhatsAppWidget"("userId");
CREATE INDEX IF NOT EXISTS "WhatsAppWidget_workspaceId_idx" ON "WhatsAppWidget"("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS "AutomationSettings_workspaceId_key" ON "AutomationSettings"("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS "ResponseMaterial_workspaceId_type_key" ON "ResponseMaterial"("workspaceId", "type");

-- Add missing foreign key constraints
DO $$ BEGIN
    ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AssistantKnowledgeChunk" ADD CONSTRAINT "AssistantKnowledgeChunk_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_widget_id_fkey" FOREIGN KEY ("widget_id") REFERENCES "WhatsAppWidget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_meta_ad_id_fkey" FOREIGN KEY ("meta_ad_id") REFERENCES "MetaAd"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WhatsAppWidget" ADD CONSTRAINT "WhatsAppWidget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WhatsAppWidget" ADD CONSTRAINT "WhatsAppWidget_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Upload" ADD CONSTRAINT "Upload_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AutomationSettings" ADD CONSTRAINT "AutomationSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ResponseMaterial" ADD CONSTRAINT "ResponseMaterial_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

