"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/routes/auth.routes"));
const patient_routes_1 = __importDefault(require("../modules/patients/routes/patient.routes"));
const study_routes_1 = __importDefault(require("../modules/studies/routes/study.routes"));
const router = (0, express_1.Router)();
router.get("/", (_req, res) => {
    res.json({ message: "🚀 API is running!" });
});
router.use('/auth', auth_routes_1.default);
router.use('/patients', patient_routes_1.default);
router.use('/studies', study_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map