import { Router } from "express";
import { getMyAnalysisController, getAnalysisByIdController } from '@/modules/patients/controllers/patientController';
import { authMiddleware, isPatient } from '@/modules/auth/middlewares/auth.middleware';
import { tenantContext } from '@/middlewares/tenantContext.middleware';

const router = Router();
router.get('/analysis', authMiddleware, tenantContext, isPatient, getMyAnalysisController)
router.get('/analysis/:id', authMiddleware, tenantContext, isPatient, getAnalysisByIdController)

export default router