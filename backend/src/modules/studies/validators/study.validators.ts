import Joi from "joi";

export const createStudySchema = Joi.object({
  dni: Joi.string()
    .required()
    .pattern(/^[0-9]{8}$/)
    .messages({
      "string.empty": "El DNI es requerido",
      "string.pattern.base": "El DNI debe tener 8 dígitos numéricos",
      "any.required": "El DNI es requerido",
    }),
  studyName: Joi.string()
    .required()
    .min(3)
    .max(255)
    .messages({
      "string.empty": "El nombre del estudio es requerido",
      "string.min": "El nombre del estudio debe tener al menos 3 caracteres",
      "string.max": "El nombre del estudio no puede exceder 255 caracteres",
      "any.required": "El nombre del estudio es requerido",
    }),
  studyDate: Joi.date()
    .required()
    .max("now")
    .messages({
      "date.base": "La fecha del estudio debe ser una fecha válida",
      "date.max": "La fecha del estudio no puede ser futura",
      "any.required": "La fecha del estudio es requerida",
    }),
  socialInsurance: Joi.string()
    .optional()
    .allow("")
    .max(50)
    .messages({
      "string.max": "El número de obra social no puede exceder 50 caracteres",
    }),
  pdfUrl: Joi.string()
    .optional()
    .uri()
    .allow("")
    .messages({
      "string.uri": "La URL del PDF debe ser válida",
    }),
  biochemistId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      "number.base": "El ID del bioquímico debe ser un número",
      "number.integer": "El ID del bioquímico debe ser un número entero",
      "number.positive": "El ID del bioquímico debe ser un número positivo",
    }),
});

export const updateStudyStatusSchema = Joi.object({
  statusName: Joi.string()
    .required()
    .valid("IN_PROGRESS", "PARTIAL", "COMPLETE")
    .messages({
      "string.empty": "El estado es requerido",
      "any.only": "El estado debe ser: IN_PROGRESS, PARTIAL o COMPLETE",
      "any.required": "El estado es requerido",
    }),
});

export const getStudyByIdSchema = Joi.object({
  id: Joi.number()
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
