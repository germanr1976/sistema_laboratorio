"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configurar CORS con origenes permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3001'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir requests sin origin (como Postman, curl, etc.)
        if (!origin)
            return callback(null, true);
        // Verificar si está en la lista de orígenes permitidos
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Permitir cualquier dominio de vercel.app
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        // Rechazar otros orígenes
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Aumentar límites para permitir múltiples PDFs grandes
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ limit: '100mb', extended: true }));
// Servir archivos estáticos (PDFs)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api', routes_1.default);
// Manejo de errores para multer
app.use((err, _req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        const code = err.code;
        let message = 'Error al subir el archivo';
        if (code === 'LIMIT_FILE_SIZE') {
            message = 'El archivo excede el tamaño máximo permitido (50MB)';
        }
        else if (code === 'LIMIT_FILE_COUNT') {
            message = 'Se excedió la cantidad máxima de archivos (20)';
        }
        return res.status(400).json({
            success: false,
            message,
            error: err.message
        });
    }
    else if (err?.message?.includes('Solo se permiten archivos PDF')) {
        return res.status(400).json({
            success: false,
            message: 'Solo se permiten archivos PDF',
            error: err.message
        });
    }
    else if (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Error interno del servidor'
        });
    }
    return next();
});
exports.default = app;
//# sourceMappingURL=app.js.map