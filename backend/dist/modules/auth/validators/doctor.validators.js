"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDoctor = validateDoctor;
const joi_1 = __importDefault(require("joi"));
const DoctorSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).required(),
    lastName: joi_1.default.string().min(2).required(),
    dni: joi_1.default.string().required().min(8).max(18).alphanum(),
    license: joi_1.default.string().required().min(4).alphanum(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required().min(8)
});
function validateDoctor(data) {
    return DoctorSchema.validate(data);
}
//# sourceMappingURL=doctor.validators.js.map