import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Sembrando datos de prueba...');

    const defaultTenant = await prisma.tenant.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            slug: 'default',
            name: 'Laboratorio principal',
        },
    });

    // Obtener roles
    const patientRole = await prisma.role.findUnique({
        where: { name: 'PATIENT' },
    });

    const biochemistRole = await prisma.role.findUnique({
        where: { name: 'BIOCHEMIST' },
    });

    if (!patientRole || !biochemistRole) {
        throw new Error('Roles no encontrados. Ejecuta primero seed-roles.ts');
    }

    // Crear paciente de prueba
    const existingPatient = await prisma.user.findUnique({
        where: { dni: '87654321' },
    });

    if (!existingPatient) {
        const hashedPassword = await bcrypt.hash('123456', 12);
        const patient = await prisma.user.create({
            data: {
                dni: '87654321',
                tenantId: defaultTenant.id,
                roleId: patientRole.id,
                profile: {
                    create: {
                        firstName: 'María',
                        lastName: 'González',
                        birthDate: new Date('1990-05-15'),
                    },
                },
            },
        });
        console.log('✅ Paciente creado: María González (DNI: 87654321)');
    } else {
        console.log('ℹ️  Paciente ya existe: María González');
    }

    // Crear bioquímico de prueba
    const existingBiochemist = await prisma.user.findUnique({
        where: { dni: '12345678' },
    });

    if (!existingBiochemist) {
        const hashedPassword = await bcrypt.hash('12345678', 12);
        const biochemist = await prisma.user.create({
            data: {
                dni: '12345678',
                tenantId: defaultTenant.id,
                email: 'juan@lab.com',
                license: 'BQ001',
                password: hashedPassword,
                roleId: biochemistRole.id,
                profile: {
                    create: {
                        firstName: 'Dr. Juan',
                        lastName: 'Pérez',
                        birthDate: new Date('1985-03-20'),
                    },
                },
            },
        });
        console.log('✅ Bioquímico creado: Dr. Juan Pérez (DNI: 12345678, Email: juan@lab.com)');
    } else {
        console.log('ℹ️  Bioquímico ya existe: Dr. Juan Pérez');
    }

    // Crear estado inicial para estudios
    const statuses = [
        { name: 'IN_PROGRESS' },
        { name: 'PARTIAL' },
        { name: 'COMPLETED' },
        { name: 'CANCELLED' },
    ];

    for (const status of statuses) {
        const existingStatus = await prisma.status.findUnique({
            where: { name: status.name },
        });

        if (!existingStatus) {
            await prisma.status.create({
                data: status,
            });
            console.log(`✅ Estado creado: ${status.name}`);
        } else {
            console.log(`ℹ️  Estado ya existe: ${existingStatus.name}`);
        }
    }

    console.log('\n📋 Usuarios de prueba:');
    console.log('  Paciente:');
    console.log('    DNI: 87654321');
    console.log('  Bioquímico:');
    console.log('    DNI: 12345678');
    console.log('    Email: juan@lab.com');
    console.log('    Password: 12345678');
    console.log('\n✨ Semilla completada');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
