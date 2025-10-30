CREATE TYPE "AdType" AS ENUM ('FACEBOOK', 'WHATSAPP');

CREATE TABLE "MetaAd" (
    "id" SERIAL NOT NULL,
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
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
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

ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "MetaAd_userId_idx" ON "MetaAd"("userId");

CREATE INDEX "MetaAd_workspaceId_idx" ON "MetaAd"("workspaceId");

CREATE INDEX "MetaAd_status_idx" ON "MetaAd"("status");