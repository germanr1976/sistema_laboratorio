import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const verifyTokenMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock('../services/auth.services', () => ({
    verifyToken: (...args: unknown[]) => verifyTokenMock(...args),
}));

vi.mock('@/config/prisma', () => ({
    default: {
        user: {
            findUnique: (...args: unknown[]) => findUniqueMock(...args),
        },
    },
}));

import { authMiddleware, isBiochemist, isPlatformAdmin } from './auth.middleware';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Partial<Request>) {
    return {
        headers: {},
        log: { child: vi.fn().mockReturnThis() },
        ...partial,
    } as unknown as Request;
}

describe('auth.middleware', () => {
    beforeEach(() => {
        verifyTokenMock.mockReset();
        findUniqueMock.mockReset();
    });

    test('devuelve 401 si falta Authorization header', async () => {
        const req = createReq();
        const res = createRes();
        const next = vi.fn() as NextFunction;

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('carga usuario autenticado y enriquece req.log', async () => {
        const req = createReq({ headers: { authorization: 'Bearer token-ok' } });
        const res = createRes();
        const next = vi.fn() as NextFunction;
        const childMock = vi.fn().mockReturnThis();
        req.log = { child: childMock } as unknown as Request['log'];

        verifyTokenMock.mockResolvedValue({ userId: 7, tenantId: 3 });
        findUniqueMock.mockResolvedValue({
            id: 7,
            dni: '12345678',
            roleId: 2,
            tenantId: 3,
            isPlatformAdmin: false,
            email: 'user@test.com',
            password: 'hash',
            role: { name: 'BIOCHEMIST' },
            tenant: { id: 3, name: 'Tenant', slug: 'tenant', suspended: false },
            profile: { firstName: 'Ana', lastName: 'Doe' },
        });

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user?.id).toBe(7);
        expect(childMock).toHaveBeenCalledWith({ userId: 7, tenantId: 3, role: 'BIOCHEMIST' });
    });

    test('isBiochemist devuelve 403 para roles incorrectos', async () => {
        const req = createReq();
        Object.assign(req as object, { user: { role: { name: 'PATIENT' } } as unknown as Request['user'] });
        const res = createRes();
        const next = vi.fn() as NextFunction;

        await isBiochemist(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('isPlatformAdmin permite acceso con rol PLATFORM_ADMIN', async () => {
        const req = createReq();
        Object.assign(req as object, { user: { role: { name: 'PLATFORM_ADMIN' }, isPlatformAdmin: false } as unknown as Request['user'] });
        const res = createRes();
        const next = vi.fn() as NextFunction;

        await isPlatformAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
