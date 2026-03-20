import prisma from '@/config/prisma';

export interface QuotaCheckResult {
    allowed: boolean;
    limit: number | null;
    current: number;
}

/**
 * Obtiene la suscripción activa con plan para un tenant.
 * Retorna null si no tiene suscripción o si está suspendida/cancelada.
 */
async function getActivePlan(tenantId: number) {
    const subscription = await prisma.tenantSubscription.findUnique({
        where: { tenantId },
        include: { plan: true },
    });

    if (!subscription) return null;
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') return null;
    if (subscription.endsAt && subscription.endsAt < new Date()) return null;

    return subscription.plan;
}

/**
 * Verifica si el tenant puede crear más usuarios según su plan.
 * Si no tiene suscripción activa o el plan no tiene límite (maxUsers = null),
 * se permite sin restricción.
 */
export async function checkUsersQuota(tenantId: number): Promise<QuotaCheckResult> {
    const plan = await getActivePlan(tenantId);

    if (!plan || plan.maxUsers === null || plan.maxUsers === undefined) {
        return { allowed: true, limit: null, current: 0 };
    }

    const current = await prisma.user.count({ where: { tenantId } });

    return {
        allowed: current < plan.maxUsers,
        limit: plan.maxUsers,
        current,
    };
}

/**
 * Verifica si el tenant puede crear más estudios este mes calendario según su plan.
 * Si no tiene suscripción activa o el plan no tiene límite (maxStudiesPerMonth = null),
 * se permite sin restricción.
 */
export async function checkStudiesQuota(tenantId: number): Promise<QuotaCheckResult> {
    const plan = await getActivePlan(tenantId);

    if (!plan || plan.maxStudiesPerMonth === null || plan.maxStudiesPerMonth === undefined) {
        return { allowed: true, limit: null, current: 0 };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const current = await prisma.study.count({
        where: {
            tenantId,
            createdAt: {
                gte: startOfMonth,
                lt: startOfNextMonth,
            },
        },
    });

    return {
        allowed: current < plan.maxStudiesPerMonth,
        limit: plan.maxStudiesPerMonth,
        current,
    };
}
