import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads/orders');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `order-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes'));
    }
};

export const studyRequestUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024,
        files: 1,
    },
});
