import prisma from '@/config/prisma';

const STUDY_REQUEST_STATUS = {
    PENDING: 'PENDING',
    VALIDATED: 'VALIDATED',
    REJECTED: 'REJECTED',
    CONVERTED: 'CONVERTED',
} as const;

type StudyRequestStatusValue = (typeof STUDY_REQUEST_STATUS)[keyof typeof STUDY_REQUEST_STATUS];
const prismaAny = prisma as any;

interface CreateStudyRequestData {
    tenantId: number;
    patientId: number;
    dni: string;
    requestedDate: Date;
    doctorName: string;
    insuranceName: string;
    observations?: string | null;
}

export const createStudyRequest = async (data: CreateStudyRequestData) => {
    const scopedPatient = await prisma.user.findFirst({
        where: {
            id: data.patientId,
            tenantId: data.tenantId,
            role: {
                name: 'PATIENT',
            },
        },
        select: { id: true },
    });

    if (!scopedPatient) {
        throw new Error('Paciente no encontrado para el tenant actual');
    }

    // A new study request should start in PENDING state and remain unconverted until a professional validates it.
    // The previous implementation auto-converted and even created a Study, bypassing the approval workflow.
    return prismaAny.studyRequest.create({
        data: {
            patientId: data.patientId,
            dni: data.dni,
            requestedDate: data.requestedDate,
            doctorName: data.doctorName,
            insuranceName: data.insuranceName,
            medicalOrderPhotoUrl: null,
            observations: data.observations || null,
            status: STUDY_REQUEST_STATUS.PENDING,
            // convertedStudyId remains null until validation
        },
        include: {
            patient: { include: { profile: true } },
            validatedBy: { include: { profile: true } },
            convertedStudy: { include: { status: true } },
        },
    });
};

export const getStudyRequestsByPatient = async (patientId: number, tenantId: number) => {
    return prismaAny.studyRequest.findMany({
        where: {
            patientId,
            patient: {
                tenantId,
            },
        },
        include: {
            validatedBy: { include: { profile: true } },
            convertedStudy: { include: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};

export const listStudyRequestsForProfessional = async (tenantId: number, filters: { dni?: string; status?: StudyRequestStatusValue }) => {
    return prismaAny.studyRequest.findMany({
        where: {
            ...(filters.dni ? { dni: filters.dni } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            OR: [
                {
                    patient: {
                        tenantId,
                    },
                },
                {
                    convertedStudy: {
                        tenantId,
                    },
                },
            ],
        },
        include: {
            patient: { include: { profile: true } },
            validatedBy: { include: { profile: true } },
            convertedStudy: {
                include: {
                    status: true,
                    patient: { include: { profile: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

export const getStudyRequestById = async (id: number, tenantId: number) => {
    return prismaAny.studyRequest.findFirst({
        where: {
            id,
            OR: [
                {
                    patient: {
                        tenantId,
                    },
                },
                {
                    convertedStudy: {
                        tenantId,
                    },
                },
            ],
        },
        include: {
            patient: { include: { profile: true, role: true } },
            validatedBy: { include: { profile: true } },
            convertedStudy: { include: { status: true } },
        },
    });
};

export const validateStudyRequest = async (id: number, tenantId: number, validatedByUserId: number) => {
    const scoped = await getStudyRequestById(id, tenantId);
    if (!scoped) {
        throw new Error('Solicitud no encontrada');
    }

    // First update to VALIDATED
    await prismaAny.studyRequest.update({
        where: { id },
        data: {
            status: STUDY_REQUEST_STATUS.VALIDATED,
            validatedByUserId,
            validatedAt: new Date(),
        },
    });

    // Then convert to study
    const converted = await convertStudyRequestToStudy(id, tenantId, validatedByUserId);
    return converted;
};

export const rejectStudyRequest = async (id: number, tenantId: number, validatedByUserId: number, observations?: string | null) => {
    const scoped = await getStudyRequestById(id, tenantId);
    if (!scoped) {
        throw new Error('Solicitud no encontrada');
    }

    return prismaAny.studyRequest.update({
        where: { id },
        data: {
            status: STUDY_REQUEST_STATUS.REJECTED,
            validatedByUserId,
            validatedAt: new Date(),
            observations: observations ?? undefined,
        },
        include: {
            patient: { include: { profile: true } },
            validatedBy: { include: { profile: true } },
            convertedStudy: true,
        },
    });
};

export const convertStudyRequestToStudy = async (id: number, tenantId: number, validatedByUserId: number) => {
    return prisma.$transaction(async (tx) => {
        const txAny = tx as any;
        const request = await getStudyRequestById(id, tenantId);

        if (!request) {
            throw new Error('Solicitud no encontrada');
        }

        if (!request.patientId) {
            throw new Error('La solicitud no está asociada a un paciente');
        }

        if (request.status !== STUDY_REQUEST_STATUS.VALIDATED) {
            throw new Error('Solo se pueden convertir solicitudes validadas');
        }

        const inProgressStatus = await tx.status.findUnique({ where: { name: 'IN_PROGRESS' } });
        if (!inProgressStatus) {
            throw new Error('Estado IN_PROGRESS no configurado');
        }

        // Si ya existe un Study vinculado, reutilizarlo y asignar biochemist si hace falta
        let studyId = request.convertedStudyId;
        if (studyId) {
            // Asegurar que el estudio tenga biochemistId si se está validando
            const existingStudy = await tx.study.findFirst({ where: { id: studyId, tenantId } });
            if (!existingStudy) {
                throw new Error('Estudio vinculado no encontrado');
            }

            if (!existingStudy.biochemistId) {
                await tx.study.update({ where: { id: studyId }, data: { biochemistId: validatedByUserId } });
            }
        } else {
            // Crear estudio si no existía
            const createdStudy = await tx.study.create({
                data: {
                    tenantId,
                    userId: request.patientId,
                    studyName: 'Estudio solicitado por paciente',
                    studyDate: request.requestedDate,
                    socialInsurance: request.insuranceName,
                    doctor: request.doctorName,
                    statusId: inProgressStatus.id,
                    biochemistId: validatedByUserId,
                },
            });
            studyId = createdStudy.id;
        }

        const updatedRequest = await txAny.studyRequest.update({
            where: { id },
            data: {
                status: STUDY_REQUEST_STATUS.CONVERTED,
                convertedStudyId: studyId,
                validatedByUserId,
                validatedAt: new Date(),
            },
            include: {
                patient: { include: { profile: true } },
                validatedBy: { include: { profile: true } },
                convertedStudy: { include: { status: true } },
            },
        });

        return updatedRequest;
    });
};

export { STUDY_REQUEST_STATUS };
