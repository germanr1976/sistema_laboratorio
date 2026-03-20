import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando roles...');

  // Crear roles
  const roles = [
    { name: 'ADMIN' },
    { name: 'PATIENT' },
    { name: 'BIOCHEMIST' },
    { name: 'PLATFORM_ADMIN' },
  ];

  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      const createdRole = await prisma.role.create({
        data: role,
      });
      console.log(`✅ Rol creado: ${createdRole.name}`);
    } else {
      console.log(`ℹ️  Rol ya existe: ${existingRole.name}`);
    }
  }

  console.log('✨ Semilla completada');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
