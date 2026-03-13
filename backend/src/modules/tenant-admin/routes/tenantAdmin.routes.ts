import { Router } from 'express';
import { authMiddleware, isAdmin } from '@/modules/auth/middlewares/auth.middleware';
import { tenantContext } from '@/middlewares/tenantContext.middleware';
import {
    createTenantUserController,
    deleteTenantUserController,
    getTenantPlanStatusController,
    getTenantSettingsController,
    listRolePermissionsController,
    listTenantUsersController,
    setRolePermissionsController,
    updateTenantSettingsController,
    updateTenantUserController,
} from '@/modules/tenant-admin/controllers/tenantAdmin.controllers';

const router = Router();

router.get('/users', authMiddleware, tenantContext, isAdmin, listTenantUsersController);
router.post('/users', authMiddleware, tenantContext, isAdmin, createTenantUserController);
router.patch('/users/:userId', authMiddleware, tenantContext, isAdmin, updateTenantUserController);
router.delete('/users/:userId', authMiddleware, tenantContext, isAdmin, deleteTenantUserController);

router.get('/settings', authMiddleware, tenantContext, isAdmin, getTenantSettingsController);
router.patch('/settings', authMiddleware, tenantContext, isAdmin, updateTenantSettingsController);

router.get('/plan-status', authMiddleware, tenantContext, isAdmin, getTenantPlanStatusController);

router.get('/permissions', authMiddleware, tenantContext, isAdmin, listRolePermissionsController);
router.put('/permissions', authMiddleware, tenantContext, isAdmin, setRolePermissionsController);

export default router;
