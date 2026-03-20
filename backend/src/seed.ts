import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/modules/auth/services/auth.services";
import logger from "@/config/logger";
import {
  ALL_PLATFORM_PERMISSION_KEYS,
  ALL_TENANT_PERMISSION_KEYS,
  BIOCHEMIST_DEFAULT_PERMISSION_KEYS,
} from "@/modules/auth/constants/permissions";

const prisma = new PrismaClient();

async function main() {
  logger.info("Seeding roles y usuario de prueba...");

  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      slug: 'default',
      name: 'Laboratorio principal',
    },
  });

  const patientRole = await prisma.role.upsert({
    where: { name: "PATIENT" },
    update: {},
    create: { name: "PATIENT" },
  });

  const bioRole = await prisma.role.upsert({
    where: { name: "BIOCHEMIST" },
    update: {},
    create: { name: "BIOCHEMIST" },
  });

  await prisma.role.upsert({
    where: { name: "PLATFORM_ADMIN" },
    update: {},
    create: { name: "PLATFORM_ADMIN" },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const platformRole = await prisma.role.findUnique({ where: { name: "PLATFORM_ADMIN" } });

  const seededPermissions = [] as { id: number; key: string }[];
  for (const key of ALL_TENANT_PERMISSION_KEYS) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        description: `Permiso granular para ${key}`,
      },
    });
    seededPermissions.push({ id: permission.id, key: permission.key });
  }

  const seededPlatformPermissions = [] as { id: number; key: string }[];
  for (const key of ALL_PLATFORM_PERMISSION_KEYS) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        description: `Permiso granular para ${key}`,
      },
    });
    seededPlatformPermissions.push({ id: permission.id, key: permission.key });
  }

  const roleIdsToGrant = [adminRole.id, platformRole?.id].filter((roleId): roleId is number =>
    Number.isFinite(roleId)
  );

  for (const roleId of roleIdsToGrant) {
    for (const permission of seededPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId: permission.id,
        },
      });
    }
  }

  if (platformRole?.id) {
    for (const permission of seededPlatformPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: platformRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: platformRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const biochemistPermissionSet = new Set(BIOCHEMIST_DEFAULT_PERMISSION_KEYS);
  for (const permission of seededPermissions) {
    if (!biochemistPermissionSet.has(permission.key as (typeof BIOCHEMIST_DEFAULT_PERMISSION_KEYS)[number])) {
      continue;
    }
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: bioRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: bioRole.id,
        permissionId: permission.id,
      },
    });
  }

  const demoDni = "12345678";
  const bioDni = "23456789";

  const demoUser = await prisma.user.upsert({
    where: { dni: demoDni },
    update: {},
    create: {
      dni: demoDni,
      tenantId: defaultTenant.id,
      roleId: patientRole.id,
      profile: {
        create: {
          firstName: "Paciente",
          lastName: "Demo",
        },
      },
    },
  });

  // Crear bioquímico con contraseña
  const bioPassword = await hashPassword("Bio123456");
  const bioUser = await prisma.user.upsert({
    where: { dni: bioDni },
    update: {},
    create: {
      dni: bioDni,
      tenantId: defaultTenant.id,
      email: "bio@demo.local",
      license: "LIC-0001",
      password: bioPassword,
      roleId: bioRole.id,
      profile: {
        create: {
          firstName: "Bio",
          lastName: "Demo",
        },
      },
    },
  });

  // Estados para estudios
  const pending = await prisma.status.upsert({
    where: { name: "PENDING" },
    update: {},
    create: { name: "PENDING" },
  });
  const inProgress = await prisma.status.upsert({
    where: { name: "IN_PROGRESS" },
    update: {},
    create: { name: "IN_PROGRESS" },
  });
  const completed = await prisma.status.upsert({
    where: { name: "COMPLETED" },
    update: {},
    create: { name: "COMPLETED" },
  });

  // Estudio de ejemplo
  const study = await prisma.study.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      userId: demoUser.id,
      studyName: "Hemograma completo",
      studyDate: new Date(),
      socialInsurance: "OSDE",
      statusId: inProgress.id,
      biochemistId: bioUser.id,
      pdfUrl: null,
    },
  });

  logger.info({
    patientRole,
    bioRole,
    adminRole,
    demoUser,
    bioUser,
    statuses: { pending, inProgress, completed },
    study,
    permissionKeys: {
      tenant: seededPermissions.map((p) => p.key),
      platform: seededPlatformPermissions.map((p) => p.key),
      biochemistDefaults: seededPermissions
        .filter((p) => biochemistPermissionSet.has(p.key as (typeof BIOCHEMIST_DEFAULT_PERMISSION_KEYS)[number]))
        .map((p) => p.key),
    },
  });
  logger.info("Seed completo");
}

main()
  .catch((e) => {
    logger.error({ err: e }, "Seed failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
