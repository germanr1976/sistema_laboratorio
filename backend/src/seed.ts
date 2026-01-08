import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/modules/auth/services/auth.services";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding roles y usuario de prueba...");

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

  const demoDni = "12345678";
  const bioDni = "23456789";

  const demoUser = await prisma.user.upsert({
    where: { dni: demoDni },
    update: {},
    create: {
      dni: demoDni,
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
      userId: demoUser.id,
      studyName: "Hemograma completo",
      studyDate: new Date(),
      socialInsurance: "OSDE",
      statusId: inProgress.id,
      biochemistId: bioUser.id,
      pdfUrl: null,
    },
  });

  console.log({ patientRole, bioRole, demoUser, bioUser, statuses: { pending, inProgress, completed }, study });
  console.log("✅ Seed completo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
