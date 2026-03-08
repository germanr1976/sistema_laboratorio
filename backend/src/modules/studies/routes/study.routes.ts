import { Router } from "express";
import * as studyController from "../controllers/study.controllers";
import {
  authMiddleware,
  isBiochemist,
  isAdmin,
} from "@/modules/auth/middlewares/auth.middleware";
import { upload } from "@/config/upload";
import { tenantContext } from '@/middlewares/tenantContext.middleware';

const router = Router();

/**
 * @route   POST /api/studies
 * @desc    Crear un nuevo estudio con PDF (solo bioquímicos)
 * @access  Private (Biochemist)
 */
router.post(
  "/",
  authMiddleware,
  tenantContext,
  isBiochemist,
  upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'pdfs', maxCount: 20 }]),
  studyController.createStudy
);

/**
 * @route   GET /api/studies/list
 * @desc    Obtener estudios con paginación
 * @access  Private (Biochemist)
 */
// Ruta de paginación eliminada

/**
 * @route   GET /api/studies/biochemist/me
 * @desc    Obtener estudios asignados al bioquímico autenticado
 * @access  Private (Biochemist)
 */
router.get(
  "/biochemist/me",
  authMiddleware,
  tenantContext,
  isBiochemist,
  studyController.getMyStudies
);

/**
 * @route   GET /api/studies/all
 * @desc    Obtener todos los estudios (solo administradores)
 * @access  Private (Admin)
 */
router.get("/all", authMiddleware, tenantContext, isAdmin, studyController.getAllStudies);

/**
 * @route   GET /api/studies/patient/me
 * @desc    Obtener estudios del paciente autenticado
 * @access  Private (Patient)
 */
router.get(
  "/patient/me",
  authMiddleware,
  tenantContext,
  studyController.getMyStudiesAsPatient
);

/**
 * @route   GET /api/studies/patient/:dni
 * @desc    Buscar un paciente por DNI
 * @access  Private (Biochemist)
 */
router.get(
  "/patient/:dni",
  authMiddleware,
  tenantContext,
  isBiochemist,
  studyController.getPatientByDni
);

/**
 * @route   GET /api/studies/:id
 * @desc    Obtener un estudio específico por ID
 * @access  Private
 */
router.get("/:id", authMiddleware, tenantContext, studyController.getStudyById);

/**
 * @route   PATCH /api/studies/:id
 * @desc    Actualizar campos de un estudio (socialInsurance, studyDate, etc)
 * @access  Private (Biochemist)
 */
router.patch(
  "/:id",
  authMiddleware,
  tenantContext,
  isBiochemist,
  studyController.updateStudy
);

/**
 * @route   PATCH /api/studies/:id/status
 * @desc    Actualizar estado de un estudio
 * @access  Private (Biochemist)
 */
router.patch(
  "/:id/status",
  authMiddleware,
  tenantContext,
  isBiochemist,
  studyController.updateStudyStatus
);

/**
 * @route   PATCH /api/studies/:id/pdf
 * @desc    Subir/actualizar el PDF de un estudio específico
 * @access  Private (Biochemist)
 */
router.patch(
  "/:id/pdf",
  authMiddleware,
  tenantContext,
  isBiochemist,
  upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'pdfs', maxCount: 20 }]),
  studyController.updateStudyPdf
);

/**
 * @route   DELETE /api/studies/:studyId/attachments/:attachmentId
 * @desc    Eliminar un archivo PDF específico de un estudio
 * @access  Private (Biochemist)
 */
router.delete(
  "/:studyId/attachments/:attachmentId",
  authMiddleware,
  tenantContext,
  isBiochemist,
  studyController.deleteAttachment
);

/**
 * @route   POST /api/studies/:id/cancel
 * @desc    Anular un estudio en estado IN_PROGRESS
 * @access  Private (Biochemist)
 */
router.post(
  "/:id/cancel",
  authMiddleware,
  tenantContext,
  isBiochemist,
  studyController.cancelStudy
);

export default router;