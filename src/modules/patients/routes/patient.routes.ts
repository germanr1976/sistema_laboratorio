import { Router } from "express";   
import {getMyAnalysisController, getAnalysisByIdController} from '@/modules/patients/controllers/patientController';

const router = Router();
router.get('/analysis', getMyAnalysisController)
router.get('/analysis/:id', getAnalysisByIdController)

export default router