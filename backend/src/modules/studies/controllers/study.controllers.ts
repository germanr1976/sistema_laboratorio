import { Request, Response } from "express";
import * as studyService from "../services/study.services";
import * as studyFormatter from "../formatters/study.formatter";
import {
  createStudySchema,
  updateStudyStatusSchema,
} from "../validators/study.validators";
import { ResponseHelper } from "../helpers/response.helper";
import { ValidationHelper } from "../helpers/validation.helper";
import prisma from "@/config/prisma";

export { deleteAttachment } from "./deleteAttachment";

/**
 * Controlador para crear un nuevo estudio
 * Solo accesible por bioquímicos autenticados
 */
export const createStudy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Obtener archivos subidos (soporta 'pdf' único y 'pdfs' múltiples)
    const filesField = (req as any).files as Record<string, Express.Multer.File[]> | Express.Multer.File[] | undefined;
    const singleFile = (req as any).file as Express.Multer.File | undefined;
    let uploadedFiles: Express.Multer.File[] = [];
    if (Array.isArray(filesField)) {
      uploadedFiles = filesField;
    } else if (filesField && typeof filesField === 'object') {
      const f1 = (filesField as any)['pdf'] || [];
      const f2 = (filesField as any)['pdfs'] || [];
      uploadedFiles = [...f1, ...f2];
    } else if (singleFile) {
      uploadedFiles = [singleFile];
    }

    let pdfUrl: string | undefined = undefined;
    if (uploadedFiles.length > 0) {
      pdfUrl = `/uploads/pdfs/${uploadedFiles[0]!.filename}`;
    }

    console.log('Archivos recibidos:', uploadedFiles?.map(f => f.filename));
    console.log('Body recibido:', req.body);

    // Validar datos de entrada
    const validatedData = ValidationHelper.validate<{
      dni: string;
      studyName: string;
      studyDate?: string | null;
      socialInsurance?: string;
      biochemistId?: number;
      doctor?: string;
    }>(createStudySchema, req.body, res);
    if (!validatedData) return;

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
      return ResponseHelper.notFound(res, "Paciente con el DNI proporcionado");
    }

    // Si se proporciona biochemistId, verificar que existe y es un bioquímico
    if (biochemistId) {
      const biochemist = await studyService.getBiochemistById(biochemistId);
      if (!biochemist) {
        return ResponseHelper.notFound(res, "Bioquímico");
      }
      if (biochemist.role.name !== "BIOCHEMIST") {
        return ResponseHelper.validationError(
          res,
          "El usuario especificado no es un bioquímico"
        );
      }
    }

    // Obtener el estado inicial
    const inProgressStatus = await studyService.getStatusByName("IN_PROGRESS");
    if (!inProgressStatus) {
      return ResponseHelper.serverError(
        res,
        "Error de configuración: Estado 'IN_PROGRESS' no encontrado"
      );
    }

    // Crear el estudio
    const studyData: any = {
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
      studyData.studyDate = (studyDate as any) instanceof Date ? studyDate : new Date(studyDate);
    } else {
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
      await studyService.addStudyAttachments(
        study.id,
        uploadedFiles.map((f) => ({ url: `/uploads/pdfs/${f.filename}`, filename: f.originalname }))
      );
    }

    const studyWithAttachments = await studyService.getStudyById(study.id);
    const formattedStudy = studyFormatter.formatStudy(studyWithAttachments);

    ResponseHelper.created(res, formattedStudy, "Estudio creado exitosamente");
  } catch (error: any) {
    console.error("Error al crear estudio:", error);
    ResponseHelper.serverError(res, "Error al crear el estudio", error);
  }
};

/**
 * Controlador para obtener los estudios del bioquímico autenticado
 * Solo accesible por bioquímicos autenticados
 */
export const getMyStudies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const biochemistId = req.user?.id;

    if (!biochemistId) {
      return ResponseHelper.unauthorized(res, "Usuario no autenticado");
    }

    const studies = await studyService.getStudiesByBiochemist(biochemistId);
    const formattedStudies = studies.map(studyFormatter.formatStudy);

    ResponseHelper.success(res, formattedStudies, "Estudios obtenidos exitosamente");
  } catch (error: any) {
    console.error("Error al obtener estudios del bioquímico:", error);
    ResponseHelper.serverError(res, "Error al obtener estudios", error);
  }
};

/**
 * Controlador para obtener todos los estudios
 * Solo accesible por administradores
 */
export const getAllStudies = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const studies = await studyService.getAllStudies();
    const formattedStudies = studies.map(studyFormatter.formatStudy);

    ResponseHelper.success(res, formattedStudies, "Todos los estudios obtenidos exitosamente");
  } catch (error: any) {
    console.error("Error al obtener todos los estudios:", error);
    ResponseHelper.serverError(res, "Error al obtener estudios", error);
  }
};

/**
 * Controlador para obtener un estudio específico por ID
 */
export const getStudyById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const studyId = parseInt(id!, 10);

    if (isNaN(studyId)) {
      return ResponseHelper.validationError(res, "ID de estudio inválido");
    }

    const study = await studyService.getStudyById(studyId);

    if (!study) {
      return ResponseHelper.notFound(res, "Estudio");
    }

    // Verificar permisos: el paciente, bioquímico asignado o admin pueden ver el estudio
    const isPatient = study.userId === req.user?.id;
    const isBiochemist = study.biochemistId === req.user?.id;
    const isAdmin = req.user?.role?.name === "ADMIN";

    if (!isPatient && !isBiochemist && !isAdmin) {
      return ResponseHelper.forbidden(res, "No tienes permiso para ver este estudio");
    }

    const formattedStudy = studyFormatter.formatStudy(study);

    ResponseHelper.success(res, formattedStudy, "Estudio obtenido exitosamente");
  } catch (error: any) {
    console.error("Error al obtener estudio:", error);
    ResponseHelper.serverError(res, "Error al obtener estudio", error);
  }
};

/**
 * Controlador para obtener los estudios del paciente autenticado
 * Solo accesible por pacientes autenticados
 */
export const getMyStudiesAsPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = req.user?.id;

    if (!patientId) {
      return ResponseHelper.unauthorized(res, "Usuario no autenticado");
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await studyService.getStudiesByPatient(patientId, page, limit);
    const formattedStudies = result.items.map(studyFormatter.formatStudy);
    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / result.limit);

    ResponseHelper.success(
      res,
      {
        items: formattedStudies,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages,
        },
        summary: result.summary,
      },
      "Estudios obtenidos exitosamente"
    );
  } catch (error: any) {
    console.error("Error al obtener estudios del paciente:", error);
    ResponseHelper.serverError(res, "Error al obtener estudios", error);
  }
};

/**
 * Controlador para actualizar campos de un estudio
 * Permite actualizar socialInsurance, studyDate, etc
 */
export const updateStudy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const studyId = parseInt(id!, 10);

    if (isNaN(studyId)) {
      return ResponseHelper.validationError(res, "ID de estudio inválido");
    }

    const { socialInsurance, studyDate, doctor } = req.body;

    console.log('📝 updateStudy - Actualizando estudio', studyId, { socialInsurance, studyDate, doctor });

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: any = {};
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
      return ResponseHelper.validationError(res, "No hay campos para actualizar");
    }

    const updatedStudy = await prisma.study.update({
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
    ResponseHelper.success(res, formattedStudy, "Estudio actualizado exitosamente");
  } catch (error: any) {
    console.error("Error al actualizar estudio:", error);
    ResponseHelper.serverError(res, "Error al actualizar estudio", error);
  }
};

/**
 * Controlador para actualizar el estado de un estudio
 * Solo accesible por el bioquímico asignado
 */
export const updateStudyStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const studyId = parseInt(id!, 10);

    if (isNaN(studyId)) {
      return ResponseHelper.validationError(res, "ID de estudio inválido");
    }

    // Validar datos de entrada
    const validatedData = ValidationHelper.validate<{
      statusName: string;
    }>(updateStudyStatusSchema, req.body, res);
    if (!validatedData) return;

    const { statusName } = validatedData;

    // Obtener el estado por nombre
    const status = await studyService.getStatusByName(statusName);
    if (!status) {
      return ResponseHelper.notFound(res, "Estado");
    }

    // Obtener el estudio
    const study = await studyService.getStudyById(studyId);

    if (!study) {
      return ResponseHelper.notFound(res, "Estudio");
    }

    // Verificar que el usuario es el bioquímico asignado
    if (study.biochemistId !== req.user?.id) {
      return ResponseHelper.forbidden(
        res,
        "Solo el bioquímico asignado puede actualizar el estado de este estudio"
      );
    }

    // Actualizar el estado
    const updatedStudy = await studyService.updateStudyStatus(studyId, {
      statusId: status.id,
    });

    const formattedStudy = studyFormatter.formatStudy(updatedStudy);

    ResponseHelper.success(res, formattedStudy, "Estudio actualizado exitosamente");
  } catch (error: any) {
    console.error("Error al actualizar estudio:", error);
    ResponseHelper.serverError(res, "Error al actualizar estudio", error);
  }
};

/**
 * Controlador para subir/actualizar el PDF de un estudio existente
 * Solo accesible por el bioquímico asignado
 */
export const updateStudyPdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const studyId = parseInt(id!, 10);

    if (isNaN(studyId)) {
      return ResponseHelper.validationError(res, "ID de estudio inválido");
    }

    const filesField = (req as any).files as Record<string, Express.Multer.File[]> | Express.Multer.File[] | undefined;
    const singleFile = (req as any).file as Express.Multer.File | undefined;
    let uploadedFiles: Express.Multer.File[] = [];
    if (Array.isArray(filesField)) {
      uploadedFiles = filesField;
    } else if (filesField && typeof filesField === 'object') {
      const f1 = (filesField as any)['pdf'] || [];
      const f2 = (filesField as any)['pdfs'] || [];
      uploadedFiles = [...f1, ...f2];
    } else if (singleFile) {
      uploadedFiles = [singleFile];
    }
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return ResponseHelper.validationError(res, "Se requiere al menos un archivo PDF");
    }

    // Obtener el estudio
    const study = await studyService.getStudyById(studyId);
    if (!study) {
      return ResponseHelper.notFound(res, "Estudio");
    }

    // Verificar que el usuario es el bioquímico asignado
    if (study.biochemistId !== req.user?.id) {
      return ResponseHelper.forbidden(
        res,
        "Solo el bioquímico asignado puede actualizar el PDF de este estudio"
      );
    }

    // Actualiza compatibilidad del primer PDF
    const firstUrl = `/uploads/pdfs/${uploadedFiles[0]!.filename}`;
    await studyService.updateStudyPdfUrl(studyId, { pdfUrl: firstUrl });

    // Agrega todos como adjuntos
    await studyService.addStudyAttachments(
      studyId,
      uploadedFiles.map((f) => ({ url: `/uploads/pdfs/${f.filename}`, filename: f.originalname }))
    );

    const updated = await studyService.getStudyById(studyId);
    const formattedStudy = studyFormatter.formatStudy(updated);

    ResponseHelper.success(res, formattedStudy, "PDF(s) actualizado(s) exitosamente");
  } catch (error: any) {
    console.error("Error al actualizar PDF del estudio:", error);
    ResponseHelper.serverError(res, "Error al actualizar PDF del estudio", error);
  }
};

/**
 * Controlador para buscar un paciente por DNI
 * Solo accesible por bioquímicos autenticados
 */
export const getPatientByDni = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const dni = Array.isArray(req.params.dni) ? req.params.dni[0] : req.params.dni;

    if (!dni || dni.trim() === "") {
      return ResponseHelper.validationError(res, "DNI es requerido");
    }

    // Buscar el paciente
    const patient = await studyService.getPatientByDni(dni.trim());

    if (!patient) {
      return ResponseHelper.notFound(res, "Paciente con el DNI proporcionado");
    }

    // Buscar el último estudio del paciente para obtener la obra social
    const lastStudy = await prisma.study.findFirst({
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
    ResponseHelper.success(res, {
      id: patient.id,
      dni: dni,
      firstName: patient.profile?.firstName,
      lastName: patient.profile?.lastName,
      email: patient.email,
      socialInsurance: lastStudy?.socialInsurance || "",
    }, "Paciente encontrado exitosamente");
  } catch (error: any) {
    console.error("Error al buscar paciente:", error);
    ResponseHelper.serverError(res, "Error al buscar paciente", error);
  }
};

/**
 * Controlador para anular un estudio
 * Solo accesible por el bioquímico asignado o admin
 */
export const cancelStudy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const studyId = parseInt(id!, 10);

    if (isNaN(studyId)) {
      return ResponseHelper.validationError(res, "ID de estudio inválido");
    }

    // Obtener el estudio
    const study = await studyService.getStudyById(studyId);
    if (!study) {
      return ResponseHelper.notFound(res, "Estudio");
    }

    // Verificar permisos: solo el bioquímico asignado puede anular
    if (study.biochemistId !== req.user?.id) {
      return ResponseHelper.forbidden(
        res,
        "Solo el bioquímico asignado puede anular este estudio"
      );
    }

    // Verificar que solo puede anularse en estado IN_PROGRESS
    if (study.status?.name !== "IN_PROGRESS") {
      return ResponseHelper.validationError(
        res,
        "Solo se pueden anular estudios en estado 'En Proceso'"
      );
    }

    // Anular el estudio
    const cancelledStudy = await studyService.cancelStudy(studyId);
    const formattedStudy = studyFormatter.formatStudy(cancelledStudy);

    ResponseHelper.success(res, formattedStudy, "Estudio anulado exitosamente");
  } catch (error: any) {
    console.error("Error al anular estudio:", error);
    ResponseHelper.serverError(res, "Error al anular estudio", error);
  }
};

// Controlador de paginación eliminado