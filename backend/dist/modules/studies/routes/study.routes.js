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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studyController = __importStar(require("../controllers/study.controllers"));
const auth_middleware_1 = require("../../../modules/auth/middlewares/auth.middleware");
const upload_1 = require("../../../config/upload");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/studies
 * @desc    Crear un nuevo estudio con PDF (solo bioquímicos)
 * @access  Private (Biochemist)
 */
router.post("/", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, upload_1.upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'pdfs', maxCount: 20 }]), studyController.createStudy);
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
router.get("/biochemist/me", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, studyController.getMyStudies);
/**
 * @route   GET /api/studies/all
 * @desc    Obtener todos los estudios (solo administradores)
 * @access  Private (Admin)
 */
router.get("/all", auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, studyController.getAllStudies);
/**
 * @route   GET /api/studies/patient/me
 * @desc    Obtener estudios del paciente autenticado
 * @access  Private (Patient)
 */
router.get("/patient/me", auth_middleware_1.authMiddleware, studyController.getMyStudiesAsPatient);
/**
 * @route   GET /api/studies/patient/:dni
 * @desc    Buscar un paciente por DNI
 * @access  Private (Biochemist)
 */
router.get("/patient/:dni", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, studyController.getPatientByDni);
/**
 * @route   GET /api/studies/:id
 * @desc    Obtener un estudio específico por ID
 * @access  Private
 */
router.get("/:id", auth_middleware_1.authMiddleware, studyController.getStudyById);
/**
 * @route   PATCH /api/studies/:id
 * @desc    Actualizar campos de un estudio (socialInsurance, studyDate, etc)
 * @access  Private (Biochemist)
 */
router.patch("/:id", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, studyController.updateStudy);
/**
 * @route   PATCH /api/studies/:id/status
 * @desc    Actualizar estado de un estudio
 * @access  Private (Biochemist)
 */
router.patch("/:id/status", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, studyController.updateStudyStatus);
/**
 * @route   PATCH /api/studies/:id/pdf
 * @desc    Subir/actualizar el PDF de un estudio específico
 * @access  Private (Biochemist)
 */
router.patch("/:id/pdf", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, upload_1.upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'pdfs', maxCount: 20 }]), studyController.updateStudyPdf);
/**
 * @route   DELETE /api/studies/:studyId/attachments/:attachmentId
 * @desc    Eliminar un archivo PDF específico de un estudio
 * @access  Private (Biochemist)
 */
router.delete("/:studyId/attachments/:attachmentId", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, studyController.deleteAttachment);
/**
 * @route   POST /api/studies/:id/cancel
 * @desc    Anular un estudio en estado IN_PROGRESS
 * @access  Private (Biochemist)
 */
router.post("/:id/cancel", auth_middleware_1.authMiddleware, auth_middleware_1.isBiochemist, studyController.cancelStudy);
exports.default = router;
//# sourceMappingURL=study.routes.js.map