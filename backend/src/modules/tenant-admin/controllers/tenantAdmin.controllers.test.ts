import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { prismaMock, hashPasswordMock } = vi.hoisted(() => ({
    prismaMock: {
        role: {
            findUnique: vi.fn(),
        },
        user: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
        },
        study: {
            count: vi.fn(),
        },
        studyRequest: {
            count: vi.fn(),
        },
        $transaction: vi.fn(),
    },
    hashPasswordMock: vi.fn(async (password: string) => `hashed:${password}`),
}));

vi.mock('@/config/prisma', () => ({
    default: prismaMock,
}));

vi.mock('@/modules/auth/services/auth.services', () => ({
    hashPassword: (password: string) => hashPasswordMock(password),
}));

vi.mock('@/modules/audit/services/audit.services', () => ({
    AUDIT_EVENT_TYPES: {
        USER_CREATED: 'USER_CREATED',
        USER_DELETED: 'USER_DELETED',
    },
    recordAuditEvent: vi.fn(),
}));

import { createTenantUserController, deleteTenantUserController } from './tenantAdmin.controllers';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Record<string, unknown>) {
    return {
        params: {},
        body: {},
        tenantId: 77,
        user: { id: 11 } as Request['user'],
        log: { error: vi.fn() },
        ...partial,
    } as unknown as Request;
}

describe('tenantAdmin controllers authz rules', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-TADM-01: ADMIN crea usuario y queda forzado al tenant del request', async () => {
        prismaMock.role.findUnique.mockResolvedValue({ id: 3, name: 'BIOCHEMIST' });
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.findUnique.mockResolvedValue(null);

        const txUserCreate = vi.fn().mockResolvedValue({
            id: 99,
            dni: '30444555',
            email: 'nuevo@test.com',
            tenantId: 77,
        });
        const txProfileCreate = vi.fn().mockResolvedValue({
            userId: 99,
            firstName: 'Ana',
            lastName: 'Perez',
        });

        prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
            return callback({
                user: { create: txUserCreate },
                profile: { create: txProfileCreate },
            });
        });

        const req = createReq({
            body: {
                dni: '30444555',
                email: 'nuevo@test.com',
                password: 'Abc12345!',
                roleName: 'BIOCHEMIST',
                firstName: 'Ana',
                lastName: 'Perez',
            },
        });
        const res = createRes();

        await createTenantUserController(req, res);

        expect(txUserCreate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                tenantId: 77,
                roleId: 3,
                password: 'hashed:Abc12345!',
            }),
        }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('CP-TADM-03: ADMIN no puede auto-eliminarse', async () => {
        const req = createReq({
            params: { userId: '11' } as Request['params'],
            user: { id: 11 } as Request['user'],
        });
        const res = createRes();

        await deleteTenantUserController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });
});
