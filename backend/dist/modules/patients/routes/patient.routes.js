"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientController_1 = require("../../../modules/patients/controllers/patientController");
const auth_middleware_1 = require("../../../modules/auth/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/analysis', auth_middleware_1.authMiddleware, patientController_1.getMyAnalysisController);
router.get('/analysis/:id', auth_middleware_1.authMiddleware, patientController_1.getAnalysisByIdController);
exports.default = router;
//# sourceMappingURL=patient.routes.js.map