import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpeta de uploads si no existe
const uploadDir = path.join(__dirname, '../../uploads/pdfs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `study-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Filtro para aceptar solo PDFs
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max por archivo
        files: 20, // Máximo 20 archivos por request
    }
});