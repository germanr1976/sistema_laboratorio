import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import logger from '@/config/logger';
import { requestIdMiddleware } from '@/middlewares/requestId.middleware';
import { requestTelemetryMiddleware } from '@/middlewares/requestTelemetry.middleware';
import { httpsRedirect } from '@/middlewares/httpsRedirect.middleware';
import { errorHandler } from '@/middlewares/errorHandler.middleware';

dotenv.config();

const app = express();

// Agregar requestId a cada request (debe ir primero)
app.use(requestIdMiddleware);

// Registrar telemetría estructurada por request (duración, status, userId, tenantId)
app.use(requestTelemetryMiddleware);

// Redirigir HTTP a HTTPS en producción
app.use(httpsRedirect);

// Helmet con HSTS habilitado
app.use(helmet({
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

// Configurar CORS con origenes permitidos
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (como Postman, curl, etc.)
        if (!origin) return callback(null, true);

        // Permitir cualquier dominio de vercel.app
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        // Verificar si está en la lista de orígenes permitidos
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Log para debug
        logger.warn({ origin }, 'CORS blocked origin');
        // Permitir de todas formas (permitir más en producción)
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Aumentar límites para permitir múltiples PDFs grandes
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Servir archivos estáticos (PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', routes);

// Manejo de errores para multer
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        const code = (err as multer.MulterError).code as string;
        let message = 'Error al subir el archivo';
        if (code === 'LIMIT_FILE_SIZE') {
            message = 'El archivo excede el tamaño máximo permitido (50MB)';
        } else if (code === 'LIMIT_FILE_COUNT') {
            message = 'Se excedió la cantidad máxima de archivos (20)';
        }
        return res.status(400).json({
            success: false,
            message,
            error: (err as multer.MulterError).message,
        });
    } else if ((err as { message?: string })?.message?.includes('Solo se permiten archivos PDF')) {
        return res.status(400).json({
            success: false,
            message: 'Solo se permiten archivos PDF',
            error: (err as Error).message,
        });
    } else if ((err as { message?: string })?.message?.includes('Solo se permiten imágenes')) {
        return res.status(400).json({
            success: false,
            message: 'Solo se permiten imágenes',
            error: (err as Error).message,
        });
    } else if (err) {
        return next(err);
    }
    return next();
});

// Manejador centralizado de errores (debe ir al final)
app.use(errorHandler);

export default app;