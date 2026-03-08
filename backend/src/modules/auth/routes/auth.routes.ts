import { Router } from "express";
import { changeUserRoleController, loginController, registerDoctorController, registerPatientController, requestPasswordRecoveryController, resetPasswordController, setTenantSuspendedController } from "../controllers/auth.controllers";
import { authMiddleware, isAdmin } from "../middlewares/auth.middleware";
import { tenantContext } from "@/middlewares/tenantContext.middleware";

const router = Router();

router.post('/login', loginController)
router.post('/register-biochemist', registerDoctorController)
router.post('/register-patient', registerPatientController)
router.post('/request-password-recovery', requestPasswordRecoveryController)
router.post('/reset-password', resetPasswordController)
router.patch('/users/:userId/role', authMiddleware, tenantContext, isAdmin, changeUserRoleController)
router.patch('/tenant/suspended', authMiddleware, tenantContext, isAdmin, setTenantSuspendedController)


export default router