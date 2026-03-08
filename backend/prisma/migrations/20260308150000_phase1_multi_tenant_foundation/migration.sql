-- Phase 1: Multi-tenant foundation

CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");

INSERT INTO "Tenant" ("name", "slug")
SELECT 'Laboratorio principal', 'default'
WHERE NOT EXISTS (
    SELECT 1 FROM "Tenant" WHERE "slug" = 'default'
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "Study" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
ALTER TABLE "StudyAttachment" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

UPDATE "User"
SET "tenantId" = t."id"
FROM "Tenant" t
WHERE t."slug" = 'default' AND "User"."tenantId" IS NULL;

UPDATE "Study"
SET "tenantId" = t."id"
FROM "Tenant" t
WHERE t."slug" = 'default' AND "Study"."tenantId" IS NULL;

UPDATE "StudyAttachment" sa
SET "tenantId" = s."tenantId"
FROM "Study" s
WHERE sa."studyId" = s."id" AND sa."tenantId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Study" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StudyAttachment" ALTER COLUMN "tenantId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'User_tenantId_fkey'
    ) THEN
        ALTER TABLE "User"
            ADD CONSTRAINT "User_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Study_tenantId_fkey'
    ) THEN
        ALTER TABLE "Study"
            ADD CONSTRAINT "Study_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StudyAttachment_tenantId_fkey'
    ) THEN
        ALTER TABLE "StudyAttachment"
            ADD CONSTRAINT "StudyAttachment_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "User_tenantId_createdAt_idx" ON "User"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "Study_tenantId_idx" ON "Study"("tenantId");
CREATE INDEX IF NOT EXISTS "Study_tenantId_createdAt_idx" ON "Study"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "Study_tenantId_studyDate_idx" ON "Study"("tenantId", "studyDate");

CREATE INDEX IF NOT EXISTS "StudyAttachment_tenantId_idx" ON "StudyAttachment"("tenantId");
CREATE INDEX IF NOT EXISTS "StudyAttachment_tenantId_createdAt_idx" ON "StudyAttachment"("tenantId", "createdAt");
