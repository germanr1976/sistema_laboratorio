import { Request, Response } from "express";
import * as studyService from "../services/study.services";
import * as studyFormatter from "../formatters/study.formatter";
import {
  createStudySchema,
  updateStudyStatusSchema,
} from "../validators/study.validators";
import { ResponseHelper } from "../helpers/response.helper";
import { ValidationHelper } from "../helpers/validation.helper";
import { PermissionHelper } from "../helpers/permission.helper";

/**
 * Controlador para crear un nuevo estudio
 * Solo accesible por bioquímicos autenticados
 */
export const createStudy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validar datos de entrada
    const validatedData = ValidationHelper.validate<{
      dni: string;
      studyName: string;
      studyDate: Date;
      socialInsurance?: string;
      pdfUrl?: string;
      biochemistId?: number;
    }>(createStudySchema, req.body, res);
    if (!validatedData) return;

    const { dni, studyName, studyDate, socialInsurance, pdfUrl, biochemistId } = validatedData;

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
    // Si no se proporciona biochemistId, se asigna el usuario autenticado
    const studyData = {
      userId: patient.id,
      studyName,
      studyDate: new Date(studyDate),
      socialInsurance,
      statusId: inProgressStatus.id,
      pdfUrl,
      biochemistId: biochemistId || req.user?.id,
    };

    const study = await studyService.createStudy(studyData);
    const formattedStudy = studyFormatter.formatStudy(study);

    ResponseHelper.created(res, formattedStudy, "Estudio creado exitosamente");
  } catch (error: any) {
    console.error("Error al crear estudio:", error);
    ResponseHelper.serverError(res, "Error al crear el estudio", error);
  }
};

/**
 * Controlador para obtener estudios del bioquímico autenticado
 */
export const getMyStudies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validar autenticación
    if (!ValidationHelper.validateAuth(req.user?.id, res)) return;

    const studies = await studyService.getStudiesByBiochemist(req.user!.id);
    const formattedStudies = studyFormatter.formatStudyList(studies);

    ResponseHelper.successWithCount(
      res,
      formattedStudies,
      "Estudios obtenidos exitosamente"
    );
  } catch (error: any) {
    console.error("Error al obtener estudios del bioquímico:", error);
    ResponseHelper.serverError(res, "Error al obtener los estudios", error);
  }
};

/**
 * Controlador para obtener todos los estudios (solo admins)
 */
export const getAllStudies = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const studies = await studyService.getAllStudies();
    const formattedStudies = studyFormatter.formatStudyList(studies);

    ResponseHelper.successWithCount(
      res,
      formattedStudies,
      "Todos los estudios obtenidos exitosamente"
    );
  } catch (error: any) {
    console.error("Error al obtener todos los estudios:", error);
    ResponseHelper.serverError(res, "Error al obtener los estudios", error);
  }
};

/**
 * Controlador para actualizar el estado de un estudio
 */
export const updateStudyStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validar ID del estudio
    const studyId = ValidationHelper.validateId(req.params.id, res);
    if (!studyId) return;

    // Validar datos de entrada
    const validatedData = ValidationHelper.validate<{ statusName: string }>(
      updateStudyStatusSchema,
      req.body,
      res
    );
    if (!validatedData) return;

    // Verificar que el estudio existe
    const study = await studyService.getStudyById(studyId);
    if (!study) {
      return ResponseHelper.notFound(res, "Estudio");
    }

    // Verificar permisos
    if (!PermissionHelper.canUpdateStudy(req.user as any, study)) {
      return ResponseHelper.forbidden(
        res,
        "No tienes permiso para actualizar este estudio"
      );
    }

    // Obtener el nuevo estado
    const newStatus = await studyService.getStatusByName(
      validatedData.statusName
    );
    if (!newStatus) {
      return ResponseHelper.validationError(res, "Estado no válido");
    }

    // Actualizar el estudio
    const updatedStudy = await studyService.updateStudyStatus(studyId, {
      statusId: newStatus.id,
    });
    const formattedStudy = studyFormatter.formatStudy(updatedStudy);

    ResponseHelper.success(
      res,
      formattedStudy,
      "Estado del estudio actualizado exitosamente"
    );
  } catch (error: any) {
    console.error("Error al actualizar estado del estudio:", error);
    ResponseHelper.serverError(res, "Error al actualizar el estado", error);
  }
};

/**
 * Controlador para obtener un estudio por ID
 */
export const getStudyById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validar ID del estudio
    const studyId = ValidationHelper.validateId(req.params.id, res);
    if (!studyId) return;

    // Obtener el estudio
    const study = await studyService.getStudyById(studyId);
    if (!study) {
      return ResponseHelper.notFound(res, "Estudio");
    }

    // Verificar permisos de acceso
    if (!PermissionHelper.canViewStudy(req.user as any, study)) {
      return ResponseHelper.forbidden(
        res,
        "No tienes permiso para ver este estudio"
      );
    }

    const formattedStudy = studyFormatter.formatStudy(study);
    ResponseHelper.success(res, formattedStudy, "Estudio obtenido exitosamente");
  } catch (error: any) {
    console.error("Error al obtener estudio:", error);
    ResponseHelper.serverError(res, "Error al obtener el estudio", error);
  }
};

/**
 * Controlador para obtener todos los bioquímicos disponibles
 */
export const getAllBiochemists = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const biochemists = await studyService.getAllBiochemists();

    const formattedBiochemists = biochemists.map((biochemist) => ({
      id: biochemist.id,
      dni: biochemist.dni,
      email: biochemist.email,
      license: biochemist.license,
      profile: biochemist.profile
        ? {
            firstName: biochemist.profile.firstName,
            lastName: biochemist.profile.lastName,
          }
        : null,
    }));

    ResponseHelper.successWithCount(
      res,
      formattedBiochemists,
      "Bioquímicos obtenidos exitosamente"
    );
  } catch (error: any) {
    console.error("Error al obtener bioquímicos:", error);
    ResponseHelper.serverError(res, "Error al obtener los bioquímicos", error);
  }
};
