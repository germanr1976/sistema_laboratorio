import { Router } from "express";
import authRoutes from '../modules/auth/routes/auth.routes';
import patientsRoutes from '../modules/patients/routes/patient.routes'

const router = Router();

// Healthcheck / Root route
router.get("/", (_req, res) => {
  res.json({ message: "🚀 API is running!" });
});

router.use('/auth', authRoutes)
router.use('/patients', patientsRoutes)

export default router;
