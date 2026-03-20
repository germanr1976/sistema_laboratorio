import { Router } from 'express';
import { authMiddleware, isPlatformAdmin } from '@/modules/auth/middlewares/auth.middleware';
import { requireTenantPermission } from '@/modules/auth/middlewares/permissions.middleware';
import { listGlobalAuditEvents } from '@/modules/audit/controllers/audit.controllers';
import {
    assignTenantPlanController,
    bootstrapPlatformAdminController,
    createTenantAdminController,
    createTenantController,
    deleteTenantController,
    getGlobalMetricsController,
    getRuntimeMetricsController,
    listTenantsController,
    setTenantSuspendedByPlatformController,
    updateTenantController,
} from '@/modules/platform/controllers/platform.controllers';
import { adminActionsRateLimiter } from '@/config/rateLimiter';

const router = Router();
const requirePermission = requireTenantPermission;

router.post('/bootstrap-admin', adminActionsRateLimiter, bootstrapPlatformAdminController);
router.get('/tenants', authMiddleware, isPlatformAdmin, listTenantsController);
router.post('/tenants', authMiddleware, isPlatformAdmin, requirePermission('platform.tenants.create'), adminActionsRateLimiter, createTenantController);
router.patch('/tenants/:tenantId', authMiddleware, isPlatformAdmin, requirePermission('platform.tenants.update'), adminActionsRateLimiter, updateTenantController);
router.delete('/tenants/:tenantId', authMiddleware, isPlatformAdmin, requirePermission('platform.tenants.delete'), adminActionsRateLimiter, deleteTenantController);
router.post('/tenants/:tenantId/admins', authMiddleware, isPlatformAdmin, requirePermission('platform.tenants.admins.create'), adminActionsRateLimiter, createTenantAdminController);
router.patch('/tenants/:tenantId/suspended', authMiddleware, isPlatformAdmin, requirePermission('platform.tenants.suspend'), adminActionsRateLimiter, setTenantSuspendedByPlatformController);
router.patch('/tenants/:tenantId/plan', authMiddleware, isPlatformAdmin, requirePermission('platform.tenants.plan.assign'), adminActionsRateLimiter, assignTenantPlanController);
router.get('/metrics/global', authMiddleware, isPlatformAdmin, getGlobalMetricsController);
router.get('/metrics/runtime', authMiddleware, isPlatformAdmin, getRuntimeMetricsController);
router.get('/audit/events', authMiddleware, isPlatformAdmin, listGlobalAuditEvents);

export default router;
