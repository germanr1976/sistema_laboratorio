"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePatient = validatePatient;
const joi_1 = __importDefault(require("joi"));
const PatientSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).required(),
    lastName: joi_1.default.string().min(2).required(),
    dni: joi_1.default.string().required().min(8).max(18).alphanum(),
    birthDate: joi_1.default.date().required()
});
function validatePatient(data) {
    return PatientSchema.validate(data);
}
//# sourceMappingURL=patient.validators.js.map