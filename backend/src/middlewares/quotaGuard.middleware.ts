import { Request, Response, NextFunction } from 'express';
import { checkUsersQuota, checkStudiesQuota } from '@/modules/tenant-admin/services/quota.service';

type QuotaType = 'users' | 'studies';

const LABELS: Record<QuotaType, string> = {
    users: 'usuarios',
    studies: 'estudios este mes',
};

/**
 * Middleware factory que verifica cuotas del plan del tenant antes de
 * permitir crear un recurso.
 *
 * Uso:
 *   router.post('/users', authMiddleware, tenantContext, quotaGuard('users'), controller)
 *   router.post('/studies', authMiddleware, tenantContext, quotaGuard('studies'), controller)
 *
 * Responde 402 si el tenant superó su límite del plan.
 * Deja pasar si no tiene suscripción activa o el plan no tiene límite.
 */
export function quotaGuard(type: QuotaType) {
    return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
        const tenantId = req.tenantId;
        if (!tenantId) {
            res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
            return;
        }

        try {
            const result =
                type === 'users'
                    ? await checkUsersQuota(tenantId)
                    : await checkStudiesQuota(tenantId);

            if (!result.allowed) {
                res.status(402).json({
                    success: false,
                    code: 'QUOTA_EXCEEDED',
                    message: `Límite de ${LABELS[type]} alcanzado para el plan actual (${result.current}/${result.limit}). Actualizá tu plan para continuar.`,
                    quota: {
                        type,
                        limit: result.limit,
                        current: result.current,
                    },
                });
                return;
            }

            next();
        } catch (err) {
            req.log.error({ err }, `Error verificando cuota de ${type}`);
            next(err);
        }
    };
}
