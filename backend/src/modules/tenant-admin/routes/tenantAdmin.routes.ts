import { Router } from 'express';
import { authMiddleware, isAdmin } from '@/modules/auth/middlewares/auth.middleware';
import { requireTenantPermission } from '@/modules/auth/middlewares/permissions.middleware';
import { TENANT_PERMISSION_KEYS } from '@/modules/auth/constants/permissions';
import { tenantContext } from '@/middlewares/tenantContext.middleware';
import { quotaGuard } from '@/middlewares/quotaGuard.middleware';
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

router.get('/users', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.USERS_READ), listTenantUsersController);
router.post('/users', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.USERS_WRITE), quotaGuard('users'), createTenantUserController);
router.patch('/users/:userId', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.USERS_WRITE), updateTenantUserController);
router.delete('/users/:userId', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.USERS_DELETE), deleteTenantUserController);

router.get('/settings', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.SETTINGS_READ), getTenantSettingsController);
router.patch('/settings', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.SETTINGS_WRITE), updateTenantSettingsController);

router.get('/plan-status', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.PLAN_READ), getTenantPlanStatusController);

router.get('/permissions', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.ROLE_PERMISSIONS_READ), listRolePermissionsController);
router.put('/permissions', authMiddleware, tenantContext, isAdmin, requireTenantPermission(TENANT_PERMISSION_KEYS.ROLE_PERMISSIONS_WRITE), setRolePermissionsController);

export default router;
