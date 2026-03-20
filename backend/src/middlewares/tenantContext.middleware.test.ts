import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const findUniqueMock = vi.fn();

vi.mock('@/config/prisma', () => ({
    default: {
        tenant: {
            findUnique: (...args: unknown[]) => findUniqueMock(...args),
        },
    },
}));

import { tenantContext } from './tenantContext.middleware';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Partial<Request>) {
    return {
        id: 'req-1',
        log: { error: vi.fn() },
        ...partial,
    } as unknown as Request;
}

describe('tenantContext.middleware', () => {
    beforeEach(() => {
        findUniqueMock.mockReset();
    });

    test('devuelve 423 cuando el tenant está suspendido', async () => {
        const req = createReq({ tenantId: 5 });
        Object.assign(req as object, { user: { tenantId: 5 } as unknown as Request['user'] });
        const res = createRes();
        const next = vi.fn() as NextFunction;

        findUniqueMock.mockResolvedValue({ id: 5, name: 'Tenant', slug: 'tenant', suspended: true });

        await tenantContext(req, res, next);

        expect(res.status).toHaveBeenCalledWith(423);
        expect(next).not.toHaveBeenCalled();
    });

    test('inyecta tenant en request cuando el tenant es válido', async () => {
        const req = createReq({ tenantId: 5 });
        Object.assign(req as object, { user: { tenantId: 5 } as unknown as Request['user'] });
        const res = createRes();
        const next = vi.fn() as NextFunction;

        findUniqueMock.mockResolvedValue({ id: 5, name: 'Tenant', slug: 'tenant', suspended: false });

        await tenantContext(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.tenant?.id).toBe(5);
    });
});
