import { Router } from 'express';
import {
    authMiddleware,
    isBiochemist,
    isPatient,
} from '@/modules/auth/middlewares/auth.middleware';
import { TENANT_PERMISSION_KEYS } from '@/modules/auth/constants/permissions';
import { requireTenantPermission } from '@/modules/auth/middlewares/permissions.middleware';
import { tenantContext } from '@/middlewares/tenantContext.middleware';
import * as controller from '../controllers/studyRequest.controllers';

const router = Router();
const requirePermission = requireTenantPermission;

router.post('/', authMiddleware, tenantContext, isPatient, controller.createStudyRequest);
router.get('/mine', authMiddleware, tenantContext, isPatient, controller.getMyStudyRequests);

router.get('/', authMiddleware, tenantContext, isBiochemist, requirePermission(TENANT_PERMISSION_KEYS.STUDY_REQUESTS_READ), controller.listStudyRequestsForProfessional);
router.patch('/:id/validate', authMiddleware, tenantContext, isBiochemist, requirePermission(TENANT_PERMISSION_KEYS.STUDY_REQUESTS_VALIDATE), controller.validateStudyRequest);
router.patch('/:id/reject', authMiddleware, tenantContext, isBiochemist, requirePermission(TENANT_PERMISSION_KEYS.STUDY_REQUESTS_REJECT), controller.rejectStudyRequest);
router.post('/:id/convert', authMiddleware, tenantContext, isBiochemist, requirePermission(TENANT_PERMISSION_KEYS.STUDY_REQUESTS_CONVERT), controller.convertStudyRequest);

export default router;
