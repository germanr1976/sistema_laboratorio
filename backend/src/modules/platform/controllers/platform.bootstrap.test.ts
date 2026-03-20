import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/config/prisma', () => ({
    default: {
        user: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        role: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/modules/audit/services/audit.services', () => ({
    AUDIT_EVENT_TYPES: {
        PERMISSION_CHANGED: 'PERMISSION_CHANGED',
    },
    recordAuditEvent: vi.fn(),
}));

import { bootstrapPlatformAdminController } from './platform.controllers';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Partial<Request>) {
    return {
        headers: {},
        body: { email: 'platform@test.com' },
        log: { error: vi.fn() },
        ...partial,
    } as unknown as Request;
}

describe('platform bootstrap guard', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            PLATFORM_BOOTSTRAP_SECRET: 'super-secret-123',
        };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    test('CP-PLAT-03: bootstrap-admin requiere secret correcto', async () => {
        const req = createReq({
            headers: { 'x-platform-bootstrap-secret': 'secret-invalido' },
        });
        const res = createRes();

        await bootstrapPlatformAdminController(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringMatching(/Secret de bootstrap inválido/i),
        }));
    });

    test('R-SEC-04: bootstrap-admin se bloquea si PLATFORM_BOOTSTRAP_ENABLED=false', async () => {
        process.env.PLATFORM_BOOTSTRAP_ENABLED = 'false';

        const req = createReq({
            headers: { 'x-platform-bootstrap-secret': 'super-secret-123' },
        });
        const res = createRes();

        await bootstrapPlatformAdminController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringMatching(/deshabilitado/i),
        }));
    });
});
