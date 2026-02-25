import { Router } from 'express';
import {
    authMiddleware,
    isBiochemist,
    isPatient,
} from '@/modules/auth/middlewares/auth.middleware';
import { studyRequestUpload } from '@/config/studyRequestUpload';
import * as controller from '../controllers/studyRequest.controllers';

const router = Router();

router.post('/', authMiddleware, isPatient, studyRequestUpload.single('medicalOrderPhoto'), controller.createStudyRequest);
router.get('/mine', authMiddleware, isPatient, controller.getMyStudyRequests);

router.get('/', authMiddleware, isBiochemist, controller.listStudyRequestsForProfessional);
router.patch('/:id/validate', authMiddleware, isBiochemist, controller.validateStudyRequest);
router.patch('/:id/reject', authMiddleware, isBiochemist, controller.rejectStudyRequest);
router.post('/:id/convert', authMiddleware, isBiochemist, controller.convertStudyRequest);

export default router;
