"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHelper = void 0;
class ResponseHelper {
    /**
     * Respuesta exitosa genérica
     */
    static success(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
        };
        res.status(statusCode).json(response);
    }
    /**
     * Respuesta exitosa con conteo
     */
    static successWithCount(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            count: data.length,
        };
        res.status(statusCode).json(response);
    }
    /**
     * Respuesta de creación exitosa
     */
    static created(res, data, message) {
        this.success(res, data, message, 201);
    }
    /**
     * Error de validación
     */
    static validationError(res, message) {
        const response = {
            success: false,
            message,
        };
        res.status(400).json(response);
    }
    /**
     * No autorizado
     */
    static unauthorized(res, message = "Usuario no autenticado") {
        const response = {
            success: false,
            message,
        };
        res.status(401).json(response);
    }
    /**
     * Prohibido (sin permisos)
     */
    static forbidden(res, message = "No tienes permiso para realizar esta acción") {
        const response = {
            success: false,
            message,
        };
        res.status(403).json(response);
    }
    /**
     * No encontrado
     */
    static notFound(res, resource = "Recurso") {
        const response = {
            success: false,
            message: `${resource} no encontrado`,
        };
        res.status(404).json(response);
    }
    /**
     * Error interno del servidor
     */
    static serverError(res, message = "Error interno del servidor", error) {
        const response = {
            success: false,
            message,
            error: process.env.NODE_ENV === "development" ? error?.message : undefined,
        };
        res.status(500).json(response);
    }
}
exports.ResponseHelper = ResponseHelper;
//# sourceMappingURL=response.helper.js.map