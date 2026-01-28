import { Router } from "express";
import { loginController, registerDoctorController, registerPatientController, requestPasswordRecoveryController, resetPasswordController } from "../controllers/auth.controllers";

const router = Router();

router.post('/login', loginController)
router.post('/register-biochemist', registerDoctorController)
router.post('/register-patient', registerPatientController)
router.post('/request-password-recovery', requestPasswordRecoveryController)
router.post('/reset-password', resetPasswordController)


export default router