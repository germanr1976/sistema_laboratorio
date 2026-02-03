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
exports.deleteAttachment = void 0;
const studyService = __importStar(require("../services/study.services"));
const response_helper_1 = require("../../../modules/studies/helpers/response.helper");
/**
 * Controlador para eliminar un attachment específico de un estudio
 */
const deleteAttachment = async (req, res) => {
    try {
        const { studyId, attachmentId } = req.params;
        const studyIdNum = parseInt(String(studyId), 10);
        const attachmentIdNum = parseInt(String(attachmentId), 10);
        if (isNaN(studyIdNum) || isNaN(attachmentIdNum)) {
            return response_helper_1.ResponseHelper.validationError(res, "IDs inválidos");
        }
        const study = await studyService.getStudyById(studyIdNum);
        if (!study) {
            return response_helper_1.ResponseHelper.notFound(res, "Estudio");
        }
        // Verificar que el attachment pertenezca al estudio
        const attachment = study.attachments?.find((a) => a.id === attachmentIdNum);
        if (!attachment) {
            return response_helper_1.ResponseHelper.notFound(res, "Archivo adjunto");
        }
        if (study.biochemistId !== req.user?.id) {
            return response_helper_1.ResponseHelper.forbidden(res, "No tienes permiso para eliminar archivos de este estudio");
        }
        await studyService.deleteAttachment(attachmentIdNum);
        response_helper_1.ResponseHelper.success(res, null, "Archivo eliminado exitosamente");
    }
    catch (error) {
        console.error("Error al eliminar attachment:", error);
        response_helper_1.ResponseHelper.serverError(res, "Error al eliminar archivo", error);
    }
};
exports.deleteAttachment = deleteAttachment;
//# sourceMappingURL=deleteAttachment.js.map