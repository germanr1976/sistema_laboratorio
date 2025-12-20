import { Response } from "express";
import { ObjectSchema } from "joi";
import { ResponseHelper } from "./response.helper";

export class ValidationHelper {
  /**
   * Valida datos usando un schema de Joi
   * @returns Los datos validados o null si hay error
   */
  static validate<T = any>(
    schema: ObjectSchema,
    data: any,
    res: Response
  ): T | null {
    const { error, value } = schema.validate(data);

    if (error) {
      ResponseHelper.validationError(
        res,
        error.details?.[0]?.message || "Error de validación"
      );
      return null;
    }

    return value as T;
  }

  /**
   * Valida que un ID sea un número válido
   */
  static validateId(id: string | undefined, res: Response): number | null {
    const parsedId = parseInt(id || "0");

    if (isNaN(parsedId) || parsedId <= 0) {
      ResponseHelper.validationError(res, "ID inválido");
      return null;
    }

    return parsedId;
  }

  /**
   * Valida que el usuario esté autenticado
   */
  static validateAuth(userId: number | undefined, res: Response): boolean {
    if (!userId) {
      ResponseHelper.unauthorized(res);
      return false;
    }
    return true;
  }
}
