import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Iniciando backfill de pacientes legacy...');

    const patientRole = await prisma.role.findUnique({
        where: { name: 'PATIENT' },
    });

    if (!patientRole) {
        throw new Error('Rol PATIENT no encontrado.');
    }

    const patients = await prisma.user.findMany({
        where: { roleId: patientRole.id },
        select: {
            id: true,
            dni: true,
            email: true,
            password: true,
        },
    });

    let markedWithoutEmail = 0;
    let alreadyMarked = 0;
    let alreadyComplete = 0;

    for (const patient of patients) {
        const currentEmail = patient.email?.trim() ?? null;
        const isPending = !!currentEmail && currentEmail.endsWith('@pending.local');
        const hasPassword = !!patient.password;

        if (isPending) {
            alreadyMarked += 1;
            continue;
        }

        if (!currentEmail) {
            const pendingEmail = `paciente.${patient.dni}.${patient.id}@pending.local`;
            await prisma.user.update({
                where: { id: patient.id },
                data: { email: pendingEmail },
            });
            markedWithoutEmail += 1;
            continue;
        }

        if (hasPassword) {
            alreadyComplete += 1;
        }
    }

    const pendingNoPassword = await prisma.user.count({
        where: {
            roleId: patientRole.id,
            email: { endsWith: '@pending.local' },
        },
    });

    console.log('✅ Backfill finalizado');
    console.log(`- Pacientes marcados (sin email): ${markedWithoutEmail}`);
    console.log(`- Pacientes ya marcados: ${alreadyMarked}`);
    console.log(`- Pacientes completos (email+password): ${alreadyComplete}`);
    console.log(`- Pacientes pendientes de completar registro: ${pendingNoPassword}`);
    console.log('ℹ️ Los pacientes pendientes deben ingresar por /registro con su DNI para definir email y contraseña.');
}

main()
    .catch((error) => {
        console.error('❌ Error en backfill:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
