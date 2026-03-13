-- Phase 3: SaaS administration foundation
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tenant"
ADD COLUMN IF NOT EXISTS "contactEmail" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "supportPhone" VARCHAR(50),
    ADD COLUMN IF NOT EXISTS "address" VARCHAR(255);
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_key_key" ON "Permission"("key");
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE INDEX IF NOT EXISTS "RolePermission_roleId_idx" ON "RolePermission"("roleId");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'RolePermission_roleId_fkey'
) THEN
ALTER TABLE "RolePermission"
ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'RolePermission_permissionId_fkey'
) THEN
ALTER TABLE "RolePermission"
ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'SubscriptionStatus'
) THEN CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELED', 'TRIAL');
END IF;
END $$;
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "maxUsers" INTEGER,
    "maxStudiesPerMonth" INTEGER,
    "maxStorageMb" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_code_key" ON "Plan"("code");
CREATE TABLE IF NOT EXISTS "TenantSubscription" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TenantSubscription_tenantId_key" ON "TenantSubscription"("tenantId");
CREATE INDEX IF NOT EXISTS "TenantSubscription_planId_idx" ON "TenantSubscription"("planId");
CREATE INDEX IF NOT EXISTS "TenantSubscription_status_idx" ON "TenantSubscription"("status");
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TenantSubscription_tenantId_fkey'
) THEN
ALTER TABLE "TenantSubscription"
ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TenantSubscription_planId_fkey'
) THEN
ALTER TABLE "TenantSubscription"
ADD CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
END IF;
END $$;
-- Extend AuditEventType enum with Phase 3 events
DO $$ BEGIN ALTER TYPE "AuditEventType"
ADD VALUE IF NOT EXISTS 'USER_CREATED';
ALTER TYPE "AuditEventType"
ADD VALUE IF NOT EXISTS 'USER_UPDATED';
ALTER TYPE "AuditEventType"
ADD VALUE IF NOT EXISTS 'USER_DELETED';
ALTER TYPE "AuditEventType"
ADD VALUE IF NOT EXISTS 'TENANT_SETTINGS_UPDATED';
ALTER TYPE "AuditEventType"
ADD VALUE IF NOT EXISTS 'PLATFORM_TENANT_CREATED';
ALTER TYPE "AuditEventType"
ADD VALUE IF NOT EXISTS 'PLATFORM_PLAN_ASSIGNED';
ALTER TYPE "AuditEventType"
ADD VALUE IF NOT EXISTS 'PERMISSION_CHANGED';
END $$;
CREATE INDEX IF NOT EXISTS "User_isPlatformAdmin_idx" ON "User"("isPlatformAdmin");
-- Seed initial plans
INSERT INTO "Plan" (
        "code",
        "name",
        "description",
        "maxUsers",
        "maxStudiesPerMonth",
        "maxStorageMb"
    )
VALUES (
        'STARTER',
        'Starter',
        'Plan inicial para laboratorios pequeños',
        5,
        500,
        2048
    ),
    (
        'PRO',
        'Pro',
        'Plan intermedio con más capacidad operativa',
        25,
        5000,
        10240
    ),
    (
        'ENTERPRISE',
        'Enterprise',
        'Plan corporativo con alta capacidad',
        NULL,
        NULL,
        NULL
    ) ON CONFLICT ("code") DO NOTHING;
-- Seed base permissions
INSERT INTO "Permission" ("key", "description")
VALUES ('users.read', 'Listar usuarios del tenant'),
    ('users.create', 'Crear usuarios del tenant'),
    ('users.update', 'Editar usuarios del tenant'),
    ('users.delete', 'Eliminar usuarios del tenant'),
    ('roles.manage', 'Gestionar roles y permisos'),
    ('audit.read', 'Consultar eventos de auditoria'),
    (
        'tenant.settings.manage',
        'Gestionar configuración del laboratorio'
    ),
    ('tenant.plan.read', 'Consultar estado del plan') ON CONFLICT ("key") DO NOTHING;
-- Assign all seeded permissions to ADMIN role
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id",
    p."id"
FROM "Role" r
    JOIN "Permission" p ON TRUE
WHERE r."name" = 'ADMIN' ON CONFLICT ("roleId", "permissionId") DO NOTHING;
-- Ensure default tenant has an active subscription
INSERT INTO "TenantSubscription" ("tenantId", "planId", "status", "startsAt")
SELECT t."id",
    p."id",
    'ACTIVE',
    CURRENT_TIMESTAMP
FROM "Tenant" t
    JOIN "Plan" p ON p."code" = 'STARTER'
WHERE t."slug" = 'default' ON CONFLICT ("tenantId") DO NOTHING;