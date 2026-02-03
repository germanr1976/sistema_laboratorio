"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationHelper = void 0;
const response_helper_1 = require("./response.helper");
class ValidationHelper {
    /**
     * Valida datos usando un schema de Joi
     * @returns Los datos validados o null si hay error
     */
    static validate(schema, data, res) {
        const { error, value } = schema.validate(data);
        if (error) {
            response_helper_1.ResponseHelper.validationError(res, error.details?.[0]?.message || "Error de validación");
            return null;
        }
        return value;
    }
    /**
     * Valida que un ID sea un número válido
     */
    static validateId(id, res) {
        const parsedId = parseInt(id || "0");
        if (isNaN(parsedId) || parsedId <= 0) {
            response_helper_1.ResponseHelper.validationError(res, "ID inválido");
            return null;
        }
        return parsedId;
    }
    /**
     * Valida que el usuario esté autenticado
     */
    static validateAuth(userId, res) {
        if (!userId) {
            response_helper_1.ResponseHelper.unauthorized(res);
            return false;
        }
        return true;
    }
}
exports.ValidationHelper = ValidationHelper;
//# sourceMappingURL=validation.helper.js.map