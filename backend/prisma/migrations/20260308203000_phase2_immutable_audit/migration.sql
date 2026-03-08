-- Phase 2: Immutable audit events

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'AuditEventType'
    ) THEN
        CREATE TYPE "AuditEventType" AS ENUM (
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'STUDY_CREATED',
            'STUDY_STATUS_CHANGED',
            'STUDY_EDITED',
            'STUDY_DOWNLOADED',
            'ROLE_CHANGED',
            'TENANT_SUSPENDED'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" SERIAL NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "tenantId" INTEGER,
    "actorUserId" INTEGER,
    "targetUserId" INTEGER,
    "studyId" INTEGER,
    "requestId" VARCHAR(100),
    "ipAddress" VARCHAR(100),
    "userAgent" VARCHAR(400),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AuditEvent_tenantId_fkey'
    ) THEN
        ALTER TABLE "AuditEvent"
            ADD CONSTRAINT "AuditEvent_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AuditEvent_actorUserId_fkey'
    ) THEN
        ALTER TABLE "AuditEvent"
            ADD CONSTRAINT "AuditEvent_actorUserId_fkey"
            FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AuditEvent_targetUserId_fkey'
    ) THEN
        ALTER TABLE "AuditEvent"
            ADD CONSTRAINT "AuditEvent_targetUserId_fkey"
            FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AuditEvent_studyId_fkey'
    ) THEN
        ALTER TABLE "AuditEvent"
            ADD CONSTRAINT "AuditEvent_studyId_fkey"
            FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AuditEvent_tenantId_idx" ON "AuditEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditEvent_actorUserId_idx" ON "AuditEvent"("actorUserId");
CREATE INDEX IF NOT EXISTS "AuditEvent_targetUserId_idx" ON "AuditEvent"("targetUserId");
CREATE INDEX IF NOT EXISTS "AuditEvent_studyId_idx" ON "AuditEvent"("studyId");
CREATE INDEX IF NOT EXISTS "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");
CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_tenantId_createdAt_idx" ON "AuditEvent"("tenantId", "createdAt");

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'AuditEvent is immutable and append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_event_update ON "AuditEvent";
CREATE TRIGGER trg_prevent_audit_event_update
BEFORE UPDATE ON "AuditEvent"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_event_mutation();

DROP TRIGGER IF EXISTS trg_prevent_audit_event_delete ON "AuditEvent";
CREATE TRIGGER trg_prevent_audit_event_delete
BEFORE DELETE ON "AuditEvent"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_event_mutation();
