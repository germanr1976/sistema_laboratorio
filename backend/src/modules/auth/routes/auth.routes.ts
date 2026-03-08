import { Router } from "express";
import { loginController, registerDoctorController, registerPatientController, requestPasswordRecoveryController, resetPasswordController, patientAccessLinkController } from "../controllers/auth.controllers";
import { authMiddleware, isBiochemist } from "../middlewares/auth.middleware";

const router = Router();

router.post('/login', loginController)
router.post('/register-biochemist', registerDoctorController)
router.post('/register-patient', registerPatientController)
router.post('/patient-access-link', authMiddleware, isBiochemist, patientAccessLinkController)
router.post('/request-password-recovery', requestPasswordRecoveryController)
router.post('/reset-password', resetPasswordController)


export default router