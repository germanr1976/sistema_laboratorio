import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import logger from '@/config/logger';

const isDevelopment = process.env.NODE_ENV !== 'production';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
    const requestId = req.id ?? 'unknown';
    const log = req.log ?? logger;

    // Joi Validation Error
    if (err instanceof ValidationError) {
        res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            requestId,
            ...(isDevelopment && { error: err.details.map(d => d.message).join(', ') }),
        });
        return;
    }

    // Prisma Known Request Error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let message = 'Error de base de datos';
        if (err.code === 'P2002') {
            message = 'Ya existe un registro con esos datos únicos';
        } else if (err.code === 'P2025') {
            message = 'El registro solicitado no fue encontrado';
        } else if (err.code === 'P2003') {
            message = 'Error de clave foránea: el registro relacionado no existe';
        } else if (err.code === 'P2014') {
            message = 'La operación violaría una relación requerida';
        }
        res.status(err.code === 'P2025' ? 404 : 409).json({
            success: false,
            message,
            requestId,
            ...(isDevelopment && { error: err.message }),
        });
        return;
    }

    // Prisma Validation Error
    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({
            success: false,
            message: 'Error de validación de base de datos',
            requestId,
            ...(isDevelopment && { error: err.message }),
        });
        return;
    }

    // Multer Error
    if (err instanceof multer.MulterError) {
        let message = 'Error al subir el archivo';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'El archivo excede el tamaño máximo permitido (50MB)';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Se excedió la cantidad máxima de archivos (20)';
        }
        res.status(400).json({
            success: false,
            message,
            requestId,
            ...(isDevelopment && { error: err.message }),
        });
        return;
    }

    // JWT Token Expired
    if (err instanceof TokenExpiredError) {
        res.status(401).json({
            success: false,
            message: 'Token expirado',
            requestId,
        });
        return;
    }

    // JWT Invalid Token
    if (err instanceof JsonWebTokenError) {
        res.status(401).json({
            success: false,
            message: 'Token inválido',
            requestId,
        });
        return;
    }

    // Unknown error
    log.error({ err }, 'Unhandled error');
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        requestId,
        ...(isDevelopment && { error: err instanceof Error ? err.message : String(err) }),
    });
}
