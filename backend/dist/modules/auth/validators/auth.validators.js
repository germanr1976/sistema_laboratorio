"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = validateLogin;
const joi_1 = __importDefault(require("joi"));
const LoginSchema = joi_1.default.object({
    dni: joi_1.default.string().required().min(8).max(18).alphanum(),
    password: joi_1.default.string().optional().min(8)
});
function validateLogin(data) {
    return LoginSchema.validate(data);
}
//# sourceMappingURL=auth.validators.js.map