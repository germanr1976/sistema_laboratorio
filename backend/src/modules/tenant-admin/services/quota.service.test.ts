import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks de Prisma ─────────────────────────────────────────────────────────
const subscriptionFindUniqueMock = vi.fn();
const userCountMock = vi.fn();
const studyCountMock = vi.fn();

vi.mock('@/config/prisma', () => ({
    default: {
        tenantSubscription: {
            findUnique: (...args: unknown[]) => subscriptionFindUniqueMock(...args),
        },
        user: {
            count: (...args: unknown[]) => userCountMock(...args),
        },
        study: {
            count: (...args: unknown[]) => studyCountMock(...args),
        },
    },
}));

import { checkUsersQuota, checkStudiesQuota } from './quota.service';

// Helper para construir una suscripción activa con plan
function makeSub(planOverrides: Record<string, unknown> = {}, subOverrides: Record<string, unknown> = {}) {
    return {
        status: 'ACTIVE',
        endsAt: null,
        plan: {
            maxUsers: 10,
            maxStudiesPerMonth: 50,
            ...planOverrides,
        },
        ...subOverrides,
    };
}

describe('quota.service — checkUsersQuota', () => {
    beforeEach(() => {
        subscriptionFindUniqueMock.mockReset();
        userCountMock.mockReset();
        studyCountMock.mockReset();
    });

    test('permite si no hay suscripción activa (sin plan)', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(null);

        const result = await checkUsersQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBeNull();
        expect(userCountMock).not.toHaveBeenCalled();
    });

    test('permite si el plan no tiene límite de usuarios (maxUsers = null)', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxUsers: null }));

        const result = await checkUsersQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBeNull();
        expect(userCountMock).not.toHaveBeenCalled();
    });

    test('permite si el tenant está por debajo del límite', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxUsers: 10 }));
        userCountMock.mockResolvedValue(7);

        const result = await checkUsersQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(10);
        expect(result.current).toBe(7);
    });

    test('bloquea si el tenant alcanzó el límite exacto', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxUsers: 10 }));
        userCountMock.mockResolvedValue(10);

        const result = await checkUsersQuota(1);

        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(10);
        expect(result.current).toBe(10);
    });

    test('bloquea si el tenant superó el límite', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxUsers: 10 }));
        userCountMock.mockResolvedValue(15);

        const result = await checkUsersQuota(1);

        expect(result.allowed).toBe(false);
        expect(result.current).toBe(15);
    });

    test('bloquea si la suscripción está SUSPENDED', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({}, { status: 'SUSPENDED' }));

        const result = await checkUsersQuota(1);

        // Sin plan activo → permite sin restricción (comportamiento conservador)
        expect(result.allowed).toBe(true);
        expect(result.limit).toBeNull();
    });

    test('bloquea si la suscripción expiró (endsAt en el pasado)', async () => {
        const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24);
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({}, { endsAt: pastDate }));

        const result = await checkUsersQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBeNull();
    });

    test('permite plan TRIAL con límite respetado', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxUsers: 5 }, { status: 'TRIAL' }));
        userCountMock.mockResolvedValue(3);

        const result = await checkUsersQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(5);
    });
});

describe('quota.service — checkStudiesQuota', () => {
    beforeEach(() => {
        subscriptionFindUniqueMock.mockReset();
        userCountMock.mockReset();
        studyCountMock.mockReset();
    });

    test('permite si no hay suscripción', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(null);

        const result = await checkStudiesQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBeNull();
        expect(studyCountMock).not.toHaveBeenCalled();
    });

    test('permite si el plan no tiene límite mensual (maxStudiesPerMonth = null)', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxStudiesPerMonth: null }));

        const result = await checkStudiesQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBeNull();
    });

    test('filtra la consulta al mes calendario actual', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxStudiesPerMonth: 50 }));
        studyCountMock.mockResolvedValue(20);

        await checkStudiesQuota(42);

        expect(studyCountMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    tenantId: 42,
                    createdAt: expect.objectContaining({
                        gte: expect.any(Date),
                        lt: expect.any(Date),
                    }),
                }),
            })
        );
    });

    test('permite si está por debajo del límite mensual', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxStudiesPerMonth: 50 }));
        studyCountMock.mockResolvedValue(49);

        const result = await checkStudiesQuota(1);

        expect(result.allowed).toBe(true);
        expect(result.current).toBe(49);
    });

    test('bloquea si alcanzó el límite mensual', async () => {
        subscriptionFindUniqueMock.mockResolvedValue(makeSub({ maxStudiesPerMonth: 50 }));
        studyCountMock.mockResolvedValue(50);

        const result = await checkStudiesQuota(1);

        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(50);
        expect(result.current).toBe(50);
    });
});
