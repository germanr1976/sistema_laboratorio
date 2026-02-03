"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudyByIdSchema = exports.updateStudyStatusSchema = exports.createStudySchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createStudySchema = joi_1.default.object({
    dni: joi_1.default.string()
        .required()
        .pattern(/^[0-9]{8}$/)
        .messages({
        "string.empty": "El DNI es requerido",
        "string.pattern.base": "El DNI debe tener 8 dígitos numéricos",
        "any.required": "El DNI es requerido",
    }),
    studyName: joi_1.default.string()
        .required()
        .min(3)
        .max(255)
        .messages({
        "string.empty": "El nombre del estudio es requerido",
        "string.min": "El nombre del estudio debe tener al menos 3 caracteres",
        "string.max": "El nombre del estudio no puede exceder 255 caracteres",
        "any.required": "El nombre del estudio es requerido",
    }),
    studyDate: joi_1.default.date()
        .optional()
        .allow(null, "")
        .messages({
        "date.base": "La fecha del estudio debe ser una fecha válida",
    }),
    socialInsurance: joi_1.default.string()
        .optional()
        .allow("", null)
        .max(50)
        .messages({
        "string.max": "El número de obra social no puede exceder 50 caracteres",
    }),
    doctor: joi_1.default.string()
        .optional()
        .allow("", null)
        .max(255)
        .messages({
        "string.max": "El nombre del médico no puede exceder 255 caracteres",
    }),
    pdfUrl: joi_1.default.string()
        .optional()
        .uri()
        .allow("")
        .messages({
        "string.uri": "La URL del PDF debe ser válida",
    }),
    biochemistId: joi_1.default.number()
        .integer()
        .positive()
        .optional()
        .messages({
        "number.base": "El ID del bioquímico debe ser un número",
        "number.integer": "El ID del bioquímico debe ser un número entero",
        "number.positive": "El ID del bioquímico debe ser un número positivo",
    }),
});
exports.updateStudyStatusSchema = joi_1.default.object({
    statusName: joi_1.default.string()
        .required()
        .valid("IN_PROGRESS", "PARTIAL", "COMPLETED")
        .messages({
        "string.empty": "El estado es requerido",
        "any.only": "El estado debe ser: IN_PROGRESS, PARTIAL o COMPLETED",
        "any.required": "El estado es requerido",
    }),
});
exports.getStudyByIdSchema = joi_1.default.object({
    id: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        "number.base": "El ID debe ser un número",
        "number.integer": "El ID debe ser un número entero",
        "number.positive": "El ID debe ser un número positivo",
        "any.required": "El ID es requerido",
    }),
});
//# sourceMappingURL=study.validators.js.map