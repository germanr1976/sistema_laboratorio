-- Week 8: performance baseline and initial DB tuning
-- Align composite indexes with the most frequent multi-tenant read patterns.
CREATE INDEX IF NOT EXISTS "Study_tenantId_biochemistId_createdAt_idx" ON "Study"("tenantId", "biochemistId", "createdAt");
CREATE INDEX IF NOT EXISTS "Study_tenantId_userId_createdAt_idx" ON "Study"("tenantId", "userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Study_tenantId_userId_studyDate_idx" ON "Study"("tenantId", "userId", "studyDate");
CREATE INDEX IF NOT EXISTS "StudyRequest_patientId_createdAt_idx" ON "StudyRequest"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "StudyRequest_status_createdAt_idx" ON "StudyRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "StudyRequest_validatedByUserId_createdAt_idx" ON "StudyRequest"("validatedByUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "TenantSubscription_status_updatedAt_idx" ON "TenantSubscription"("status", "updatedAt");