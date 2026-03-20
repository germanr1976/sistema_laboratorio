import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/config/prisma', () => ({
    default: {
        tenant: {
            upsert: vi.fn(),
        },
    },
}));

vi.mock('@/modules/audit/services/audit.services', () => ({
    AUDIT_EVENT_TYPES: {},
    recordAuditEvent: vi.fn(),
}));

import { registerDoctorController } from './auth.controllers';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Record<string, unknown>) {
    return {
        headers: {},
        body: {},
        log: {
            error: vi.fn(),
            info: vi.fn(),
        },
        ...partial,
    } as unknown as Request;
}

describe('auth register biochemist guard', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            BIOCHEMIST_SELF_REGISTER_ENABLED: 'false',
        };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    test('R-SEC-06: bloquea autoregistro cuando BIOCHEMIST_SELF_REGISTER_ENABLED=false', async () => {
        const req = createReq({
            body: {
                firstName: 'Ana',
                lastName: 'Perez',
                dni: '30333444',
                license: 'MP-123',
                email: 'ana@test.com',
                password: 'Abc12345!',
            },
        });
        const res = createRes();

        await registerDoctorController(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringMatching(/registro libre de bioquímicos/i),
        }));
    });
});
