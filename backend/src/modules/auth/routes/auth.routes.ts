import { Router } from "express";
import { changeUserRoleController, loginController, registerDoctorController, registerPatientController, requestPasswordRecoveryController, resetPasswordController, setTenantSuspendedController } from "../controllers/auth.controllers";
import { authMiddleware, isAdmin, isBiochemist } from "../middlewares/auth.middleware";
import { tenantContext } from "@/middlewares/tenantContext.middleware";
import {
    loginRateLimiter,
    passwordRecoveryRateLimiter,
    passwordResetRateLimiter,
    registerRateLimiter,
    adminActionsRateLimiter,
} from "@/config/rateLimiter";
import { patientAccessLinkController } from "../controllers/auth.controllers";

const router = Router();

router.post('/login', loginRateLimiter, loginController)
router.post('/register-biochemist', registerRateLimiter, registerDoctorController)
router.post('/register-patient', registerRateLimiter, registerPatientController)
router.post('/patient-access-link', authMiddleware, tenantContext, isBiochemist, adminActionsRateLimiter, patientAccessLinkController)
router.post('/request-password-recovery', passwordRecoveryRateLimiter, requestPasswordRecoveryController)
router.post('/reset-password', passwordResetRateLimiter, resetPasswordController)
router.patch('/users/:userId/role', authMiddleware, tenantContext, isAdmin, adminActionsRateLimiter, changeUserRoleController)
router.patch('/tenant/suspended', authMiddleware, tenantContext, isAdmin, adminActionsRateLimiter, setTenantSuspendedController)


export default router