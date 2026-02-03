"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.generatePasswordRecoveryToken = generatePasswordRecoveryToken;
exports.verifyPasswordRecoveryToken = verifyPasswordRecoveryToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const passwordHashed = await bcryptjs_1.default.hash(password, saltRounds);
    return passwordHashed;
}
async function comparePassword(password, hashedPassword) {
    const isPassEquals = await bcryptjs_1.default.compare(password, hashedPassword);
    return isPassEquals;
}
async function generateToken(userData) {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jsonwebtoken_1.default.sign(userData, jwtSecret, { expiresIn });
    return token;
}
async function verifyToken(token) {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    try {
        const isTokenCorrect = jsonwebtoken_1.default.verify(token, jwtSecret);
        return isTokenCorrect;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}
/**
 * Genera un token JWT para recuperación de contraseña (corta duración)
 * @param userId - ID del usuario
 * @param dni - DNI del usuario
 * @returns Token con expiración de 1 hora
 */
async function generatePasswordRecoveryToken(userId, dni) {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jsonwebtoken_1.default.sign({ userId, dni, type: 'password-recovery' }, jwtSecret, { expiresIn: '1h' });
    return token;
}
/**
 * Verifica un token de recuperación de contraseña
 * @param token - Token a verificar
 * @returns Datos decodificados del token
 */
async function verifyPasswordRecoveryToken(token) {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded.type !== 'password-recovery') {
            throw new Error('Token inválido: no es un token de recuperación');
        }
        return decoded;
    }
    catch (error) {
        console.error('Error verificando token de recuperación:', error);
        throw error;
    }
}
//# sourceMappingURL=auth.services.js.map