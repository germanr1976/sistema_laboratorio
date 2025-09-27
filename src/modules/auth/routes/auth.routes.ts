import { Router } from "express";   
import { loginController, registerDoctorController, registerPatientController } from "../controllers/auth.controllers";

const router = Router();

router.post('/login',loginController)
router.post('/register-doctor',registerDoctorController)
router.post('/register-patient',registerPatientController)


export default router