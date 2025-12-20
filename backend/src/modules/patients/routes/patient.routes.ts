import { Router } from "express";   
import {getMyAnalysisController, getAnalysisByIdController} from '@/modules/patients/controllers/patientController';
import { authMiddleware } from '@/modules/auth/middlewares/auth.middleware'; 

const router = Router();
router.get('/analysis',authMiddleware, getMyAnalysisController)
router.get('/analysis/:id',authMiddleware, getAnalysisByIdController)

export default router