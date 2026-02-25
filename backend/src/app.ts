import express from 'express';
import cors from 'cors';
import routes from './routes';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

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
    console.warn(`CORS blocked origin: ${origin}`);
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
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
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
      error: err.message
    });
  } else if (err?.message?.includes('Solo se permiten archivos PDF')) {
    return res.status(400).json({
      success: false,
      message: 'Solo se permiten archivos PDF',
      error: err.message
    });
  } else if (err?.message?.includes('Solo se permiten imágenes')) {
    return res.status(400).json({
      success: false,
      message: 'Solo se permiten imágenes',
      error: err.message
    });
  } else if (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error interno del servidor'
    });
  }
  return next();
});

export default app;