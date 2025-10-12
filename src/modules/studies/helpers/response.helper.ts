import { Response } from "express";

interface SuccessResponse {
  success: true;
  message: string;
  data?: any;
  count?: number;
}

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export class ResponseHelper {
  /**
   * Respuesta exitosa genérica
   */
  static success(res: Response, data: any, message: string, statusCode = 200): void {
    const response: SuccessResponse = {
      success: true,
      message,
      data,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Respuesta exitosa con conteo
   */
  static successWithCount(
    res: Response,
    data: any[],
    message: string,
    statusCode = 200
  ): void {
    const response: SuccessResponse = {
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
  static created(res: Response, data: any, message: string): void {
    this.success(res, data, message, 201);
  }

  /**
   * Error de validación
   */
  static validationError(res: Response, message: string): void {
    const response: ErrorResponse = {
      success: false,
      message,
    };
    res.status(400).json(response);
  }

  /**
   * No autorizado
   */
  static unauthorized(res: Response, message = "Usuario no autenticado"): void {
    const response: ErrorResponse = {
      success: false,
      message,
    };
    res.status(401).json(response);
  }

  /**
   * Prohibido (sin permisos)
   */
  static forbidden(res: Response, message = "No tienes permiso para realizar esta acción"): void {
    const response: ErrorResponse = {
      success: false,
      message,
    };
    res.status(403).json(response);
  }

  /**
   * No encontrado
   */
  static notFound(res: Response, resource = "Recurso"): void {
    const response: ErrorResponse = {
      success: false,
      message: `${resource} no encontrado`,
    };
    res.status(404).json(response);
  }

  /**
   * Error interno del servidor
   */
  static serverError(
    res: Response,
    message = "Error interno del servidor",
    error?: any
  ): void {
    const response: ErrorResponse = {
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error?.message : undefined,
    };
    res.status(500).json(response);
  }
}
