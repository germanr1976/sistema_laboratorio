"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttachment = exports.getAllBiochemists = exports.getBiochemistById = exports.getPatientByDni = exports.getStatusByName = exports.cancelStudy = exports.deleteStudy = exports.getStudiesByPatient = exports.addStudyAttachments = exports.updateStudyPdfUrl = exports.updateStudyStatus = exports.getStudyById = exports.getAllStudies = exports.getStudiesByBiochemist = exports.createStudy = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const createStudy = async (data) => {
    const payload = {
        userId: data.userId,
        studyName: data.studyName,
        socialInsurance: data.socialInsurance || null,
        doctor: data.doctor || null,
        statusId: data.statusId,
        pdfUrl: data.pdfUrl || null,
        biochemistId: data.biochemistId || null,
    };
    if (data.studyDate !== undefined && data.studyDate !== null) {
        payload.studyDate = data.studyDate;
    }
    return await prisma_1.default.study.create({
        data: payload,
        include: {
            patient: {
                include: {
                    profile: true,
                },
            },
            biochemist: {
                include: {
                    profile: true,
                },
            },
            status: true,
            attachments: true,
        },
    });
};
exports.createStudy = createStudy;
const getStudiesByBiochemist = async (biochemistId) => {
    return await prisma_1.default.study.findMany({
        where: {
            biochemistId,
        },
        include: {
            patient: { include: { profile: true } },
            biochemist: { include: { profile: true } },
            status: true,
            attachments: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
exports.getStudiesByBiochemist = getStudiesByBiochemist;
const getAllStudies = async () => {
    return await prisma_1.default.study.findMany({
        include: {
            patient: { include: { profile: true } },
            biochemist: { include: { profile: true } },
            status: true,
            attachments: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
exports.getAllStudies = getAllStudies;
const getStudyById = async (studyId) => {
    return await prisma_1.default.study.findUnique({
        where: {
            id: studyId,
        },
        include: {
            patient: { include: { profile: true } },
            biochemist: { include: { profile: true } },
            status: true,
            attachments: true,
        },
    });
};
exports.getStudyById = getStudyById;
const updateStudyStatus = async (studyId, data) => {
    return await prisma_1.default.study.update({
        where: {
            id: studyId,
        },
        data: {
            statusId: data.statusId,
        },
        include: {
            patient: { include: { profile: true } },
            biochemist: { include: { profile: true } },
            status: true,
            attachments: true,
        },
    });
};
exports.updateStudyStatus = updateStudyStatus;
const updateStudyPdfUrl = async (studyId, data) => {
    return await prisma_1.default.study.update({
        where: { id: studyId },
        data: { pdfUrl: data.pdfUrl },
        include: {
            patient: { include: { profile: true } },
            biochemist: { include: { profile: true } },
            status: true,
            attachments: true,
        },
    });
};
exports.updateStudyPdfUrl = updateStudyPdfUrl;
const addStudyAttachments = async (studyId, files) => {
    if (files.length === 0)
        return { count: 0 };
    return await prisma_1.default.studyAttachment.createMany({
        data: files.map((f) => ({ studyId, url: f.url, filename: f.filename || null })),
    });
};
exports.addStudyAttachments = addStudyAttachments;
const getStudiesByPatient = async (userId) => {
    return await prisma_1.default.study.findMany({
        where: {
            userId,
        },
        include: {
            biochemist: { include: { profile: true } },
            status: true,
            attachments: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
exports.getStudiesByPatient = getStudiesByPatient;
const deleteStudy = async (studyId) => {
    return await prisma_1.default.study.delete({
        where: {
            id: studyId,
        },
    });
};
exports.deleteStudy = deleteStudy;
const cancelStudy = async (studyId) => {
    // Obtener el estado CANCELLED
    const cancelledStatus = await (0, exports.getStatusByName)("CANCELLED");
    if (!cancelledStatus) {
        throw new Error("Estado CANCELLED no encontrado en la BD");
    }
    return await prisma_1.default.study.update({
        where: { id: studyId },
        data: { statusId: cancelledStatus.id },
        include: {
            patient: { include: { profile: true } },
            biochemist: { include: { profile: true } },
            status: true,
            attachments: true,
        },
    });
};
exports.cancelStudy = cancelStudy;
const getStatusByName = async (statusName) => {
    return await prisma_1.default.status.findUnique({
        where: {
            name: statusName,
        },
    });
};
exports.getStatusByName = getStatusByName;
const getPatientByDni = async (dni) => {
    return await prisma_1.default.user.findUnique({
        where: {
            dni,
        },
        include: {
            profile: true,
        },
    });
};
exports.getPatientByDni = getPatientByDni;
const getBiochemistById = async (biochemistId) => {
    return await prisma_1.default.user.findUnique({
        where: {
            id: biochemistId,
        },
        include: {
            role: true,
            profile: true,
        },
    });
};
exports.getBiochemistById = getBiochemistById;
const getAllBiochemists = async () => {
    return await prisma_1.default.user.findMany({
        where: {
            role: {
                name: "BIOCHEMIST",
            },
        },
        include: {
            profile: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
exports.getAllBiochemists = getAllBiochemists;
// Función NUEVA para obtener estudios con paginación
// Servicio de paginación eliminado
const deleteAttachment = async (attachmentId) => {
    return await prisma_1.default.studyAttachment.delete({
        where: { id: attachmentId },
    });
};
exports.deleteAttachment = deleteAttachment;
//# sourceMappingURL=study.services.js.map