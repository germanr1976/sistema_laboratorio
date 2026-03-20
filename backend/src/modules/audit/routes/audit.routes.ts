import { Router } from 'express';
import { authMiddleware, isAdmin } from '@/modules/auth/middlewares/auth.middleware';
import { tenantContext } from '@/middlewares/tenantContext.middleware';
import { listAuditEvents } from '@/modules/audit/controllers/audit.controllers';

const router = Router();

router.get('/', authMiddleware, tenantContext, isAdmin, listAuditEvents);

export default router;
