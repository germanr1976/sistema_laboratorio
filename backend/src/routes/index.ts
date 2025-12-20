import { Router } from "express";
import authRoutes from '../modules/auth/routes/auth.routes';
import patientsRoutes from '../modules/patients/routes/patient.routes'
import studyRoutes from '../modules/studies/routes/study.routes';

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "🚀 API is running!" });
});

router.use('/auth', authRoutes)
router.use('/patients', patientsRoutes)
router.use('/studies', studyRoutes)

export default router;
