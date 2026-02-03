"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelStudy = exports.getPatientByDni = exports.updateStudyPdf = exports.updateStudyStatus = exports.updateStudy = exports.getMyStudiesAsPatient = exports.getStudyById = exports.getAllStudies = exports.getMyStudies = exports.createStudy = exports.deleteAttachment = void 0;
const studyService = __importStar(require("../services/study.services"));
const studyFormatter = __importStar(require("../formatters/study.formatter"));
const study_validators_1 = require("../validators/study.validators");
const response_helper_1 = require("../helpers/response.helper");
const validation_helper_1 = require("../helpers/validation.helper");
const prisma_1 = __importDefault(require("../../../config/prisma"));
var deleteAttachment_1 = require("./deleteAttachment");
Object.defineProperty(exports, "deleteAttachment", { enumerable: true, get: function () { return deleteAttachment_1.deleteAttachment; } });
/**
 * Controlador para crear un nuevo estudio
 * Solo accesible por bioquímicos autenticados
 */
const createStudy = async (req, res) => {
    try {
        // Obtener archivos subidos (soporta 'pdf' único y 'pdfs' múltiples)
        const filesField = req.files;
        const singleFile = req.file;
        let uploadedFiles = [];
        if (Array.isArray(filesField)) {
            uploadedFiles = filesField;
        }
        else if (filesField && typeof filesField === 'object') {
            const f1 = filesField['pdf'] || [];
            const f2 = filesField['pdfs'] || [];
            uploadedFiles = [...f1, ...f2];
        }
        else if (singleFile) {
            uploadedFiles = [singleFile];
        }
        let pdfUrl = undefined;
        if (uploadedFiles.length > 0) {
            pdfUrl = `/uploads/pdfs/${uploadedFiles[0].filename}`;
        }
        console.log('Archivos recibidos:', uploadedFiles?.map(f => f.filename));
        console.log('Body recibido:', req.body);
        // Validar datos de entrada
        const validatedData = validation_helper_1.ValidationHelper.validate(study_validators_1.createStudySchema, req.body, res);
        if (!validatedData)
            return;
        const { dni, studyName, studyDate, socialInsurance, biochemistId, doctor } = validatedData;
        console.log('📝 Datos recibidos en createStudy:', {
            dni,
            studyName,
            studyDate,
            studyDateType: typeof studyDate,
            studyDateIsNull: studyDate === null,
            studyDateIsUndefined: studyDate === undefined,
            socialInsurance,
            biochemistId,
            doctor
        });
        // Verificar que el paciente existe
        const patient = await studyService.getPatientByDni(dni);
        if (!patient) {
            return response_helper_1.ResponseHelper.notFound(res, "Paciente con el DNI proporcionado");
        }
        // Si se proporciona biochemistId, verificar que existe y es un bioquímico
        if (biochemistId) {
            const biochemist = await studyService.getBiochemistById(biochemistId);
            if (!biochemist) {
                return response_helper_1.ResponseHelper.notFound(res, "Bioquímico");
            }
            if (biochemist.role.name !== "BIOCHEMIST") {
                return response_helper_1.ResponseHelper.validationError(res, "El usuario especificado no es un bioquímico");
            }
        }
        // Obtener el estado inicial
        const inProgressStatus = await studyService.getStatusByName("IN_PROGRESS");
        if (!inProgressStatus) {
            return response_helper_1.ResponseHelper.serverError(res, "Error de configuración: Estado 'IN_PROGRESS' no encontrado");
        }
        // Crear el estudio
        const studyData = {
            userId: patient.id,
            studyName,
            socialInsurance: socialInsurance || null,
            doctor: doctor || null,
            statusId: inProgressStatus.id,
            pdfUrl, // Incluir la URL del PDF
            // Asignar al bioquímico autenticado que realiza la carga
            biochemistId: req.user?.id ?? null,
        };
        // Asignar la fecha si viene del frontend, de lo contrario dejarla como null
        if (studyDate !== null && studyDate !== undefined) {
            console.log('📅 Asignando studyDate:', studyDate, 'tipo:', typeof studyDate);
            studyData.studyDate = studyDate instanceof Date ? studyDate : new Date(studyDate);
        }
        else {
            console.log('📅 studyDate es null/undefined, asignando null');
            studyData.studyDate = null;
        }
        console.log('💾 Guardando estudio con datos:', studyData);
        const study = await studyService.createStudy(studyData);
        console.log('✅ Estudio guardado en BD:', {
            id: study.id,
            studyName: study.studyName,
            studyDate: study.studyDate,
            socialInsurance: study.socialInsurance,
            doctor: study.doctor,
            userId: study.userId,
            statusId: study.statusId
        });
        // Crear adjuntos si hay múltiples archivos
        if (uploadedFiles.length > 0) {
            await studyService.addStudyAttachments(study.id, uploadedFiles.map((f) => ({ url: `/uploads/pdfs/${f.filename}`, filename: f.originalname })));
        }
        const studyWithAttachments = await studyService.getStudyById(study.id);
        const formattedStudy = studyFormatter.formatStudy(studyWithAttachments);
        response_helper_1.ResponseHelper.created(res, formattedStudy, "Estudio creado exitosamente");
    }
    catch (error) {
        console.error("Error al crear estudio:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al crear el estudio", error);
    }
};
exports.createStudy = createStudy;
/**
 * Controlador para obtener los estudios del bioquímico autenticado
 * Solo accesible por bioquímicos autenticados
 */
const getMyStudies = async (req, res) => {
    try {
        const biochemistId = req.user?.id;
        if (!biochemistId) {
            return response_helper_1.ResponseHelper.unauthorized(res, "Usuario no autenticado");
        }
        const studies = await studyService.getStudiesByBiochemist(biochemistId);
        const formattedStudies = studies.map(studyFormatter.formatStudy);
        response_helper_1.ResponseHelper.success(res, formattedStudies, "Estudios obtenidos exitosamente");
    }
    catch (error) {
        console.error("Error al obtener estudios del bioquímico:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al obtener estudios", error);
    }
};
exports.getMyStudies = getMyStudies;
/**
 * Controlador para obtener todos los estudios
 * Solo accesible por administradores
 */
const getAllStudies = async (_req, res) => {
    try {
        const studies = await studyService.getAllStudies();
        const formattedStudies = studies.map(studyFormatter.formatStudy);
        response_helper_1.ResponseHelper.success(res, formattedStudies, "Todos los estudios obtenidos exitosamente");
    }
    catch (error) {
        console.error("Error al obtener todos los estudios:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al obtener estudios", error);
    }
};
exports.getAllStudies = getAllStudies;
/**
 * Controlador para obtener un estudio específico por ID
 */
const getStudyById = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const studyId = parseInt(id, 10);
        if (isNaN(studyId)) {
            return response_helper_1.ResponseHelper.validationError(res, "ID de estudio inválido");
        }
        const study = await studyService.getStudyById(studyId);
        if (!study) {
            return response_helper_1.ResponseHelper.notFound(res, "Estudio");
        }
        // Verificar permisos: el paciente, bioquímico asignado o admin pueden ver el estudio
        const isPatient = study.userId === req.user?.id;
        const isBiochemist = study.biochemistId === req.user?.id;
        const isAdmin = req.user?.role?.name === "ADMIN";
        if (!isPatient && !isBiochemist && !isAdmin) {
            return response_helper_1.ResponseHelper.forbidden(res, "No tienes permiso para ver este estudio");
        }
        const formattedStudy = studyFormatter.formatStudy(study);
        response_helper_1.ResponseHelper.success(res, formattedStudy, "Estudio obtenido exitosamente");
    }
    catch (error) {
        console.error("Error al obtener estudio:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al obtener estudio", error);
    }
};
exports.getStudyById = getStudyById;
/**
 * Controlador para obtener los estudios del paciente autenticado
 * Solo accesible por pacientes autenticados
 */
const getMyStudiesAsPatient = async (req, res) => {
    try {
        const patientId = req.user?.id;
        if (!patientId) {
            return response_helper_1.ResponseHelper.unauthorized(res, "Usuario no autenticado");
        }
        const studies = await studyService.getStudiesByPatient(patientId);
        const formattedStudies = studies.map(studyFormatter.formatStudy);
        response_helper_1.ResponseHelper.success(res, formattedStudies, "Estudios obtenidos exitosamente");
    }
    catch (error) {
        console.error("Error al obtener estudios del paciente:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al obtener estudios", error);
    }
};
exports.getMyStudiesAsPatient = getMyStudiesAsPatient;
/**
 * Controlador para actualizar campos de un estudio
 * Permite actualizar socialInsurance, studyDate, etc
 */
const updateStudy = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const studyId = parseInt(id, 10);
        if (isNaN(studyId)) {
            return response_helper_1.ResponseHelper.validationError(res, "ID de estudio inválido");
        }
        const { socialInsurance, studyDate, doctor } = req.body;
        console.log('📝 updateStudy - Actualizando estudio', studyId, { socialInsurance, studyDate, doctor });
        // Construir objeto de actualización solo con campos proporcionados
        const updateData = {};
        if (socialInsurance !== undefined) {
            updateData.socialInsurance = socialInsurance || null;
        }
        if (studyDate !== undefined) {
            updateData.studyDate = new Date(studyDate);
        }
        if (doctor !== undefined) {
            updateData.doctor = doctor || null;
        }
        if (Object.keys(updateData).length === 0) {
            return response_helper_1.ResponseHelper.validationError(res, "No hay campos para actualizar");
        }
        const updatedStudy = await prisma_1.default.study.update({
            where: { id: studyId },
            data: updateData,
            include: {
                attachments: true,
                biochemist: {
                    select: {
                        id: true,
                        license: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                patient: {
                    select: {
                        id: true,
                        dni: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                status: true,
            },
        });
        console.log('✅ Estudio actualizado:', updatedStudy);
        const formattedStudy = studyFormatter.formatStudy(updatedStudy);
        response_helper_1.ResponseHelper.success(res, formattedStudy, "Estudio actualizado exitosamente");
    }
    catch (error) {
        console.error("Error al actualizar estudio:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al actualizar estudio", error);
    }
};
exports.updateStudy = updateStudy;
/**
 * Controlador para actualizar el estado de un estudio
 * Solo accesible por el bioquímico asignado
 */
const updateStudyStatus = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const studyId = parseInt(id, 10);
        if (isNaN(studyId)) {
            return response_helper_1.ResponseHelper.validationError(res, "ID de estudio inválido");
        }
        // Validar datos de entrada
        const validatedData = validation_helper_1.ValidationHelper.validate(study_validators_1.updateStudyStatusSchema, req.body, res);
        if (!validatedData)
            return;
        const { statusName } = validatedData;
        // Obtener el estado por nombre
        const status = await studyService.getStatusByName(statusName);
        if (!status) {
            return response_helper_1.ResponseHelper.notFound(res, "Estado");
        }
        // Obtener el estudio
        const study = await studyService.getStudyById(studyId);
        if (!study) {
            return response_helper_1.ResponseHelper.notFound(res, "Estudio");
        }
        // Verificar que el usuario es el bioquímico asignado
        if (study.biochemistId !== req.user?.id) {
            return response_helper_1.ResponseHelper.forbidden(res, "Solo el bioquímico asignado puede actualizar el estado de este estudio");
        }
        // Actualizar el estado
        const updatedStudy = await studyService.updateStudyStatus(studyId, {
            statusId: status.id,
        });
        const formattedStudy = studyFormatter.formatStudy(updatedStudy);
        response_helper_1.ResponseHelper.success(res, formattedStudy, "Estudio actualizado exitosamente");
    }
    catch (error) {
        console.error("Error al actualizar estudio:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al actualizar estudio", error);
    }
};
exports.updateStudyStatus = updateStudyStatus;
/**
 * Controlador para subir/actualizar el PDF de un estudio existente
 * Solo accesible por el bioquímico asignado
 */
const updateStudyPdf = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const studyId = parseInt(id, 10);
        if (isNaN(studyId)) {
            return response_helper_1.ResponseHelper.validationError(res, "ID de estudio inválido");
        }
        const filesField = req.files;
        const singleFile = req.file;
        let uploadedFiles = [];
        if (Array.isArray(filesField)) {
            uploadedFiles = filesField;
        }
        else if (filesField && typeof filesField === 'object') {
            const f1 = filesField['pdf'] || [];
            const f2 = filesField['pdfs'] || [];
            uploadedFiles = [...f1, ...f2];
        }
        else if (singleFile) {
            uploadedFiles = [singleFile];
        }
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return response_helper_1.ResponseHelper.validationError(res, "Se requiere al menos un archivo PDF");
        }
        // Obtener el estudio
        const study = await studyService.getStudyById(studyId);
        if (!study) {
            return response_helper_1.ResponseHelper.notFound(res, "Estudio");
        }
        // Verificar que el usuario es el bioquímico asignado
        if (study.biochemistId !== req.user?.id) {
            return response_helper_1.ResponseHelper.forbidden(res, "Solo el bioquímico asignado puede actualizar el PDF de este estudio");
        }
        // Actualiza compatibilidad del primer PDF
        const firstUrl = `/uploads/pdfs/${uploadedFiles[0].filename}`;
        await studyService.updateStudyPdfUrl(studyId, { pdfUrl: firstUrl });
        // Agrega todos como adjuntos
        await studyService.addStudyAttachments(studyId, uploadedFiles.map((f) => ({ url: `/uploads/pdfs/${f.filename}`, filename: f.originalname })));
        const updated = await studyService.getStudyById(studyId);
        const formattedStudy = studyFormatter.formatStudy(updated);
        response_helper_1.ResponseHelper.success(res, formattedStudy, "PDF(s) actualizado(s) exitosamente");
    }
    catch (error) {
        console.error("Error al actualizar PDF del estudio:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al actualizar PDF del estudio", error);
    }
};
exports.updateStudyPdf = updateStudyPdf;
/**
 * Controlador para buscar un paciente por DNI
 * Solo accesible por bioquímicos autenticados
 */
const getPatientByDni = async (req, res) => {
    try {
        const dni = Array.isArray(req.params.dni) ? req.params.dni[0] : req.params.dni;
        if (!dni || dni.trim() === "") {
            return response_helper_1.ResponseHelper.validationError(res, "DNI es requerido");
        }
        // Buscar el paciente
        const patient = await studyService.getPatientByDni(dni.trim());
        if (!patient) {
            return response_helper_1.ResponseHelper.notFound(res, "Paciente con el DNI proporcionado");
        }
        // Buscar el último estudio del paciente para obtener la obra social
        const lastStudy = await prisma_1.default.study.findFirst({
            where: {
                userId: patient.id,
            },
            select: {
                socialInsurance: true,
            },
            orderBy: {
                studyDate: 'desc',
            },
        });
        // Retornar los datos del paciente incluyendo obra social del último estudio
        response_helper_1.ResponseHelper.success(res, {
            id: patient.id,
            dni: dni,
            firstName: patient.profile?.firstName,
            lastName: patient.profile?.lastName,
            email: patient.email,
            socialInsurance: lastStudy?.socialInsurance || "",
        }, "Paciente encontrado exitosamente");
    }
    catch (error) {
        console.error("Error al buscar paciente:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al buscar paciente", error);
    }
};
exports.getPatientByDni = getPatientByDni;
/**
 * Controlador para anular un estudio
 * Solo accesible por el bioquímico asignado o admin
 */
const cancelStudy = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const studyId = parseInt(id, 10);
        if (isNaN(studyId)) {
            return response_helper_1.ResponseHelper.validationError(res, "ID de estudio inválido");
        }
        // Obtener el estudio
        const study = await studyService.getStudyById(studyId);
        if (!study) {
            return response_helper_1.ResponseHelper.notFound(res, "Estudio");
        }
        // Verificar permisos: solo el bioquímico asignado puede anular
        if (study.biochemistId !== req.user?.id) {
            return response_helper_1.ResponseHelper.forbidden(res, "Solo el bioquímico asignado puede anular este estudio");
        }
        // Verificar que solo puede anularse en estado IN_PROGRESS
        if (study.status?.name !== "IN_PROGRESS") {
            return response_helper_1.ResponseHelper.validationError(res, "Solo se pueden anular estudios en estado 'En Proceso'");
        }
        // Anular el estudio
        const cancelledStudy = await studyService.cancelStudy(studyId);
        const formattedStudy = studyFormatter.formatStudy(cancelledStudy);
        response_helper_1.ResponseHelper.success(res, formattedStudy, "Estudio anulado exitosamente");
    }
    catch (error) {
        console.error("Error al anular estudio:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al anular estudio", error);
    }
};
exports.cancelStudy = cancelStudy;
// Controlador de paginación eliminado
//# sourceMappingURL=study.controllers.js.map