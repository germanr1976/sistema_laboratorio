import { Request, Response } from "express";
import * as studyService from "../services/study.services";
import { ResponseHelper } from "@/modules/studies/helpers/response.helper";

/**
 * Controlador para eliminar un attachment específico de un estudio
 */
export const deleteAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return ResponseHelper.forbidden(res, 'Contexto de tenant no disponible');
    }

    const { studyId, attachmentId } = req.params;
    const studyIdNum = parseInt(String(studyId), 10);
    const attachmentIdNum = parseInt(String(attachmentId), 10);

    if (isNaN(studyIdNum) || isNaN(attachmentIdNum)) {
      return ResponseHelper.validationError(res, "IDs inválidos");
    }

    const study = await studyService.getStudyById(studyIdNum, tenantId);
    if (!study) {
      return ResponseHelper.notFound(res, "Estudio");
    }

    // Verificar que el attachment pertenezca al estudio
    const attachment = study.attachments?.find((a: any) => a.id === attachmentIdNum);
    if (!attachment) {
      return ResponseHelper.notFound(res, "Archivo adjunto");
    }

    if (study.biochemistId !== req.user?.id) {
      return ResponseHelper.forbidden(res, "No tienes permiso para eliminar archivos de este estudio");
    }

    await studyService.deleteAttachment(attachmentIdNum, tenantId);

    ResponseHelper.success(res, null, "Archivo eliminado exitosamente");
  } catch (error: any) {
    req.log.error({ err: error }, 'Error al eliminar attachment');
    ResponseHelper.serverError(res, "Error al eliminar archivo", error);
  }
};
