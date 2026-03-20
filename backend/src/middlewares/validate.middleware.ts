import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

type ValidationTarget = 'body' | 'params' | 'query';

function validate(schema: Joi.Schema, target: ValidationTarget) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req[target], { abortEarly: false });
        if (error) {
            res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: error.details,
            });
            return;
        }
        next();
    };
}

export const validateBody = (schema: Joi.Schema) => validate(schema, 'body');
export const validateParams = (schema: Joi.Schema) => validate(schema, 'params');
export const validateQuery = (schema: Joi.Schema) => validate(schema, 'query');
