import { Router } from "express";
import authRoutes from '../modules/auth/routes/auth.routes';
import patientsRoutes from '../modules/patients/routes/patient.routes'
import studyRoutes from '../modules/studies/routes/study.routes';
import studyRequestRoutes from '../modules/study-requests/routes/studyRequest.routes';
import auditRoutes from '../modules/audit/routes/audit.routes';
import platformRoutes from '../modules/platform/routes/platform.routes';
import tenantAdminRoutes from '../modules/tenant-admin/routes/tenantAdmin.routes';

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "🚀 API is running!" });
});

router.use('/auth', authRoutes)
router.use('/patients', patientsRoutes)
router.use('/studies', studyRoutes)
router.use('/study-requests', studyRequestRoutes)
router.use('/audit', auditRoutes)
router.use('/platform', platformRoutes)
router.use('/tenant-admin', tenantAdminRoutes)

export default router;
