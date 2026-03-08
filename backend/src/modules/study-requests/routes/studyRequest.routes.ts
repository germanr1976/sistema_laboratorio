import { Router } from 'express';
import {
    authMiddleware,
    isBiochemist,
    isPatient,
} from '@/modules/auth/middlewares/auth.middleware';
import { tenantContext } from '@/middlewares/tenantContext.middleware';
import * as controller from '../controllers/studyRequest.controllers';

const router = Router();

router.post('/', authMiddleware, tenantContext, isPatient, controller.createStudyRequest);
router.get('/mine', authMiddleware, tenantContext, isPatient, controller.getMyStudyRequests);

router.get('/', authMiddleware, tenantContext, isBiochemist, controller.listStudyRequestsForProfessional);
router.patch('/:id/validate', authMiddleware, tenantContext, isBiochemist, controller.validateStudyRequest);
router.patch('/:id/reject', authMiddleware, tenantContext, isBiochemist, controller.rejectStudyRequest);
router.post('/:id/convert', authMiddleware, tenantContext, isBiochemist, controller.convertStudyRequest);

export default router;
