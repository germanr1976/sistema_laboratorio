import rateLimit from 'express-rate-limit';

/**
 * Lee un entero de una variable de entorno con fallback.
 * En NODE_ENV=test se multiplica el límite por 100 para no interferir con pruebas.
 */
function envInt(key: string, fallback: number): number {
    const raw = process.env[key];
    const parsed = raw !== undefined ? parseInt(raw, 10) : NaN;
    const value = Number.isFinite(parsed) ? parsed : fallback;
    // En entorno de test se relajan todos los límites
    return process.env.NODE_ENV === 'test' ? value * 100 : value;
}

/**
 * Perfil: autenticación (login)
 * Límite estricto por IP para dificultar fuerza bruta.
 *
 * Vars de entorno:
 *   RATE_LIMIT_LOGIN_WINDOW_MS   — ventana en ms   (default: 15 min)
 *   RATE_LIMIT_LOGIN_MAX         — intentos máx    (default: 10)
 */
export const loginRateLimiter = rateLimit({
    windowMs: envInt('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
    max: envInt('RATE_LIMIT_LOGIN_MAX', 10),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión. Por favor intentá nuevamente en 15 minutos.',
    },
    skipSuccessfulRequests: true, // no consume cuota en logins exitosos
});

/**
 * Perfil: recuperación de contraseña
 * Ventana más larga y límite menor para evitar abuso de envíos de email.
 *
 * Vars de entorno:
 *   RATE_LIMIT_RECOVERY_WINDOW_MS — ventana en ms  (default: 60 min)
 *   RATE_LIMIT_RECOVERY_MAX       — peticiones máx (default: 5)
 */
export const passwordRecoveryRateLimiter = rateLimit({
    windowMs: envInt('RATE_LIMIT_RECOVERY_WINDOW_MS', 60 * 60 * 1000),
    max: envInt('RATE_LIMIT_RECOVERY_MAX', 5),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiadas solicitudes de recuperación de contraseña. Por favor intentá nuevamente en 1 hora.',
    },
});

/**
 * Perfil: reset de contraseña
 * Igual de restrictivo que recovery para evitar enumeración de tokens.
 *
 * Vars de entorno:
 *   RATE_LIMIT_RESET_WINDOW_MS — ventana en ms  (default: 60 min)
 *   RATE_LIMIT_RESET_MAX       — peticiones máx (default: 5)
 */
export const passwordResetRateLimiter = rateLimit({
    windowMs: envInt('RATE_LIMIT_RESET_WINDOW_MS', 60 * 60 * 1000),
    max: envInt('RATE_LIMIT_RESET_MAX', 5),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados intentos de restablecimiento de contraseña. Por favor intentá nuevamente en 1 hora.',
    },
});

/**
 * Perfil: registro público (bioquímico y paciente)
 * Evita creación masiva de cuentas desde una sola IP.
 *
 * Vars de entorno:
 *   RATE_LIMIT_REGISTER_WINDOW_MS — ventana en ms  (default: 60 min)
 *   RATE_LIMIT_REGISTER_MAX       — peticiones máx (default: 10)
 */
export const registerRateLimiter = rateLimit({
    windowMs: envInt('RATE_LIMIT_REGISTER_WINDOW_MS', 60 * 60 * 1000),
    max: envInt('RATE_LIMIT_REGISTER_MAX', 10),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados registros desde esta dirección. Por favor intentá nuevamente más tarde.',
    },
});

/**
 * Perfil: acciones administrativas sensibles (bootstrap, cambio de rol, etc.)
 * Límite generoso en ventana larga; pensado para prevenir scripting no autorizado.
 *
 * Vars de entorno:
 *   RATE_LIMIT_ADMIN_WINDOW_MS — ventana en ms  (default: 15 min)
 *   RATE_LIMIT_ADMIN_MAX       — peticiones máx (default: 30)
 */
export const adminActionsRateLimiter = rateLimit({
    windowMs: envInt('RATE_LIMIT_ADMIN_WINDOW_MS', 15 * 60 * 1000),
    max: envInt('RATE_LIMIT_ADMIN_MAX', 30),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiadas solicitudes administrativas. Por favor esperá unos minutos.',
    },
});
