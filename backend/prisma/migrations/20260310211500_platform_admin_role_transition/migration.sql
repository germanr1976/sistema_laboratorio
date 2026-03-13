-- Phase 3 follow-up: transition platform access to dedicated role
INSERT INTO "Role" ("name")
VALUES ('PLATFORM_ADMIN') ON CONFLICT ("name") DO NOTHING;
-- Migrate legacy platform admins (flag-based) to dedicated role.
UPDATE "User" u
SET "roleId" = r."id"
FROM "Role" r
WHERE r."name" = 'PLATFORM_ADMIN'
  AND u."isPlatformAdmin" = true
  AND u."roleId" <> r."id";
-- Keep legacy flag aligned during transition period.
UPDATE "User" u
SET "isPlatformAdmin" = true
FROM "Role" r
WHERE r."name" = 'PLATFORM_ADMIN'
  AND u."roleId" = r."id"
  AND u."isPlatformAdmin" = false;