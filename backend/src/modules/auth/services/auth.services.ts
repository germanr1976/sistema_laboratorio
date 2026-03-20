import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import logger from '@/config/logger';

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const passwordHashed = await bcrypt.hash(password, saltRounds);
    return passwordHashed;
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    const isPassEquals = await bcrypt.compare(password, hashedPassword);
    return isPassEquals;
}

export async function generateToken(userData: {
    userId: number,
    tenantId: number,
    dni: string,
    roleId: number,
    roleName: string,
    isPlatformAdmin?: boolean,
}): Promise<string> {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(userData, jwtSecret, { expiresIn } as jwt.SignOptions);
    return token;
}

export async function verifyToken(token: string): Promise<any> {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    try {
        const isTokenCorrect = jwt.verify(token, jwtSecret)
        return isTokenCorrect
    } catch (error) {
        logger.error({ err: error }, 'Error verificando token');
        throw error
    }
}

/**
 * Genera un token JWT para recuperación de contraseña (corta duración)
 * @param userId - ID del usuario
 * @param dni - DNI del usuario
 * @returns Token con expiración de 1 hora
 */
export async function generatePasswordRecoveryToken(
    userId: number,
    tenantId: number,
    dni: string,
    passwordHash: string
): Promise<string> {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const passwordVersion = buildRecoveryPasswordVersion(passwordHash);
    const token = jwt.sign(
        { userId, tenantId, dni, type: 'password-recovery', passwordVersion },
        jwtSecret,
        { expiresIn: '1h' }
    );
    return token;
}

/**
 * Deriva una versión estable de contraseña para invalidar tokens de recovery
 * cuando la contraseña ya cambió.
 */
export function buildRecoveryPasswordVersion(passwordHash: string): string {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const source = `${passwordHash}::${jwtSecret}`;
    return crypto.createHash('sha256').update(source).digest('hex').slice(0, 24);
}

/**
 * Verifica un token de recuperación de contraseña
 * @param token - Token a verificar
 * @returns Datos decodificados del token
 */
export async function verifyPasswordRecoveryToken(token: string): Promise<any> {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    try {
        const decoded = jwt.verify(token, jwtSecret);
        if ((decoded as any).type !== 'password-recovery') {
            throw new Error('Token inválido: no es un token de recuperación');
        }
        return decoded;
    } catch (error) {
        logger.error({ err: error }, 'Error verificando token de recuperación');
        throw error;
    }
}