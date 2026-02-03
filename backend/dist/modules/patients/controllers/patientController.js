"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAnalysisController = getMyAnalysisController;
exports.getAnalysisByIdController = getAnalysisByIdController;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const auth_1 = require("../../../modules/auth");
async function getMyAnalysisController(req, res) {
    const userId = req.user?.id;
    const userRole = req.user?.role.name;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado.'
        });
    }
    if (userRole !== auth_1.ROLE_NAMES.PATIENT) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Este recurso es solo para pacientes'
        });
    }
    try {
        const analyses = await prisma_1.default.study.findMany({
            where: {
                userId: userId
            },
            select: {
                id: true,
                studyName: true,
                pdfUrl: true,
                studyDate: true,
                socialInsurance: true,
                status: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                studyDate: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Análisis recuperados exitosamente',
            data: analyses
        });
    }
    catch (error) {
        console.error('Error al obtener los análisis del paciente', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener los análisis'
        });
    }
}
async function getAnalysisByIdController(req, res) {
    const userId = req.user?.id;
    const userRole = req.user?.role.name;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const analysisId = parseInt(id || '0');
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'usuario no autenticado'
        });
    }
    // validar rol 
    if (userRole !== auth_1.ROLE_NAMES.PATIENT) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Este recurso es solo para pacientes'
        });
    }
    // validar ID
    if (isNaN(analysisId)) {
        return res.status(400).json({
            success: false,
            message: 'ID de análisis invalido'
        });
    }
    try {
        const analysis = await prisma_1.default.study.findFirst({
            where: {
                id: analysisId,
                userId: userId
            },
            select: {
                id: true,
                studyName: true,
                studyDate: true,
                pdfUrl: true,
                socialInsurance: true,
                status: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Análisis no encontrado'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Análisis encontrado exitosamente',
            data: analysis
        });
    }
    catch (error) {
        console.error('Error al obtener los análisis del paciente', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener los análisis'
        });
    }
}
//# sourceMappingURL=patientController.js.map