import { Router } from 'express';
import { authMiddleware, isPlatformAdmin } from '@/modules/auth/middlewares/auth.middleware';
import { listGlobalAuditEvents } from '@/modules/audit/controllers/audit.controllers';
import {
    assignTenantPlanController,
    bootstrapPlatformAdminController,
    createTenantAdminController,
    createTenantController,
    deleteTenantController,
    getGlobalMetricsController,
    listTenantsController,
    setTenantSuspendedByPlatformController,
    updateTenantController,
} from '@/modules/platform/controllers/platform.controllers';

const router = Router();

router.post('/bootstrap-admin', bootstrapPlatformAdminController);
router.get('/tenants', authMiddleware, isPlatformAdmin, listTenantsController);
router.post('/tenants', authMiddleware, isPlatformAdmin, createTenantController);
router.patch('/tenants/:tenantId', authMiddleware, isPlatformAdmin, updateTenantController);
router.delete('/tenants/:tenantId', authMiddleware, isPlatformAdmin, deleteTenantController);
router.post('/tenants/:tenantId/admins', authMiddleware, isPlatformAdmin, createTenantAdminController);
router.patch('/tenants/:tenantId/suspended', authMiddleware, isPlatformAdmin, setTenantSuspendedByPlatformController);
router.patch('/tenants/:tenantId/plan', authMiddleware, isPlatformAdmin, assignTenantPlanController);
router.get('/metrics/global', authMiddleware, isPlatformAdmin, getGlobalMetricsController);
router.get('/audit/events', authMiddleware, isPlatformAdmin, listGlobalAuditEvents);

export default router;
