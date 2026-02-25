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
    patientId: number;
    dni: string;
    requestedDate: Date;
    doctorName: string;
    insuranceName: string;
    medicalOrderPhotoUrl?: string | null;
    observations?: string | null;
}

export const createStudyRequest = async (data: CreateStudyRequestData) => {
    return prismaAny.studyRequest.create({
        data,
        include: {
            patient: { include: { profile: true } },
            validatedBy: { include: { profile: true } },
            convertedStudy: { include: { status: true } },
        },
    });
};

export const getStudyRequestsByPatient = async (patientId: number) => {
    return prismaAny.studyRequest.findMany({
        where: { patientId },
        include: {
            validatedBy: { include: { profile: true } },
            convertedStudy: { include: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};

export const listStudyRequestsForProfessional = async (filters: { dni?: string; status?: StudyRequestStatusValue }) => {
    return prismaAny.studyRequest.findMany({
        where: {
            ...(filters.dni ? { dni: filters.dni } : {}),
            ...(filters.status ? { status: filters.status } : {}),
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

export const getStudyRequestById = async (id: number) => {
    return prismaAny.studyRequest.findUnique({
        where: { id },
        include: {
            patient: { include: { profile: true, role: true } },
            validatedBy: { include: { profile: true } },
            convertedStudy: { include: { status: true } },
        },
    });
};

export const validateStudyRequest = async (id: number, validatedByUserId: number) => {
    return prismaAny.studyRequest.update({
        where: { id },
        data: {
            status: STUDY_REQUEST_STATUS.VALIDATED,
            validatedByUserId,
            validatedAt: new Date(),
        },
        include: {
            patient: { include: { profile: true } },
            validatedBy: { include: { profile: true } },
            convertedStudy: true,
        },
    });
};

export const rejectStudyRequest = async (id: number, validatedByUserId: number, observations?: string | null) => {
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

export const convertStudyRequestToStudy = async (id: number, validatedByUserId: number) => {
    return prisma.$transaction(async (tx) => {
        const txAny = tx as any;
        const request = await txAny.studyRequest.findUnique({
            where: { id },
        });

        if (!request) {
            throw new Error('Solicitud no encontrada');
        }

        if (!request.patientId) {
            throw new Error('La solicitud no está asociada a un paciente');
        }

        if (request.status !== STUDY_REQUEST_STATUS.VALIDATED) {
            throw new Error('Solo se pueden convertir solicitudes validadas');
        }

        if (request.convertedStudyId) {
            throw new Error('La solicitud ya fue convertida a estudio');
        }

        const inProgressStatus = await tx.status.findUnique({ where: { name: 'IN_PROGRESS' } });
        if (!inProgressStatus) {
            throw new Error('Estado IN_PROGRESS no configurado');
        }

        const createdStudy = await tx.study.create({
            data: {
                userId: request.patientId,
                studyName: 'Estudio solicitado por paciente',
                studyDate: request.requestedDate,
                socialInsurance: request.insuranceName,
                doctor: request.doctorName,
                statusId: inProgressStatus.id,
                biochemistId: validatedByUserId,
            },
        });

        const updatedRequest = await txAny.studyRequest.update({
            where: { id },
            data: {
                status: STUDY_REQUEST_STATUS.CONVERTED,
                convertedStudyId: createdStudy.id,
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
