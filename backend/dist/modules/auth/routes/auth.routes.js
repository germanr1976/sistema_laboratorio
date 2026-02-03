"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controllers_1 = require("../controllers/auth.controllers");
const router = (0, express_1.Router)();
router.post('/login', auth_controllers_1.loginController);
router.post('/register-biochemist', auth_controllers_1.registerDoctorController);
router.post('/register-patient', auth_controllers_1.registerPatientController);
router.post('/request-password-recovery', auth_controllers_1.requestPasswordRecoveryController);
router.post('/reset-password', auth_controllers_1.resetPasswordController);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map