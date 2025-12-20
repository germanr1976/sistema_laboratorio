import { Router } from "express";
import * as studyController from "../controllers/study.controllers";
import {
  authMiddleware,
  isBiochemist,
  isAdmin,
} from "@/modules/auth/middlewares/auth.middleware";

const router = Router();

/**
 * @route   POST /api/studies
 * @desc    Crear un nuevo estudio (solo bioquímicos)
 * @access  Private (Biochemist)
 */
router.post("/", authMiddleware, isBiochemist, studyController.createStudy);

/**
 * @route   GET /api/studies/biochemists
 * @desc    Obtener lista de todos los bioquímicos disponibles
 * @access  Private (Biochemist, Admin)
 */
router.get(
  "/biochemists",
  authMiddleware,
  studyController.getAllBiochemists
);

/**
 * @route   GET /api/studies/biochemist/me
 * @desc    Obtener estudios asignados al bioquímico autenticado
 * @access  Private (Biochemist)
 */
router.get(
  "/biochemist/me",
  authMiddleware,
  isBiochemist,
  studyController.getMyStudies
);

/**
 * @route   GET /api/studies/all
 * @desc    Obtener todos los estudios (solo administradores)
 * @access  Private (Admin)
 */
router.get("/all", authMiddleware, isAdmin, studyController.getAllStudies);

/**
 * @route   GET /api/studies/:id
 * @desc    Obtener un estudio específico por ID
 * @access  Private (Admin, Biochemist propietario, Patient propietario)
 */
router.get("/:id", authMiddleware, studyController.getStudyById);

/**
 * @route   PATCH /api/studies/:id/status
 * @desc    Actualizar el estado de un estudio
 * @access  Private (Admin, Biochemist propietario)
 */
router.patch("/:id/status", authMiddleware, studyController.updateStudyStatus);

export default router;
