import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { prismaMock, hashPasswordMock } = vi.hoisted(() => ({
    prismaMock: {
        tenant: {
            findUnique: vi.fn(),
        },
        user: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
    hashPasswordMock: vi.fn(async (password: string) => `hashed:${password}`),
}));

vi.mock('@/config/prisma', () => ({
    default: prismaMock,
}));

vi.mock('../services/auth.services', async () => {
    const actual = await vi.importActual<typeof import('../services/auth.services')>('../services/auth.services');
    return {
        ...actual,
        hashPassword: (password: string) => hashPasswordMock(password),
    };
});

vi.mock('../services/emailService', () => ({
    enviarCorreoRecuperacion: vi.fn(),
}));

import { requestPasswordRecoveryController, resetPasswordController } from './auth.controllers';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Partial<Request>) {
    return {
        headers: {},
        body: {},
        log: {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
        },
        ...partial,
    } as unknown as Request;
}

describe('auth recovery flow', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = {
            ...originalEnv,
            JWT_SECRET: 'test-jwt-secret',
            DEFAULT_TENANT_SLUG: 'default',
            APP_FRONTEND_URL: 'http://localhost:3001',
            ALLOW_RECOVERY_DEBUG_LINK: 'true',
            EMAIL_USER: '',
            EMAIL_PASSWORD: '',
        };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    test('CP-AUTH-06: request + reset exitoso con token válido', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue({ id: 1, slug: 'default' });
        prismaMock.user.findFirst
            .mockResolvedValueOnce({
                id: 10,
                tenantId: 1,
                dni: '30111222',
                email: 'paciente@test.com',
                password: 'hash-original',
                profile: {},
                role: { name: 'PATIENT' },
            })
            .mockResolvedValueOnce({
                id: 10,
                tenantId: 1,
                password: 'hash-original',
            });
        prismaMock.user.update.mockResolvedValue({ id: 10 });

        const recoveryReq = createReq({
            body: { email: 'paciente@test.com' },
            headers: { 'x-tenant-slug': 'default' },
        });
        const recoveryRes = createRes();

        await requestPasswordRecoveryController(recoveryReq, recoveryRes);

        expect(recoveryRes.status).toHaveBeenCalledWith(200);
        const recoveryJsonCalls = (recoveryRes.json as unknown as ReturnType<typeof vi.fn>).mock.calls;
        expect(recoveryJsonCalls.length).toBeGreaterThan(0);
        const recoveryPayload = recoveryJsonCalls[0]?.[0] as {
            debugRecoveryLink?: string;
        };
        expect(recoveryPayload.debugRecoveryLink).toBeTruthy();

        const debugLink = new URL(recoveryPayload.debugRecoveryLink as string);
        const token = debugLink.searchParams.get('token');
        expect(token).toBeTruthy();

        const resetReq = createReq({
            body: {
                token,
                newPassword: 'N3wPass!123',
                confirmPassword: 'N3wPass!123',
            },
        });
        const resetRes = createRes();

        await resetPasswordController(resetReq, resetRes);

        expect(resetRes.status).toHaveBeenCalledWith(200);
        expect(prismaMock.user.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { password: 'hashed:N3wPass!123' },
        });
    });

    test('CP-AUTH-07: token de recovery no se puede reutilizar tras cambio de password', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue({ id: 1, slug: 'default' });
        prismaMock.user.findFirst.mockResolvedValue({
            id: 10,
            tenantId: 1,
            dni: '30111222',
            email: 'paciente@test.com',
            password: 'hash-original',
            profile: {},
            role: { name: 'PATIENT' },
        });

        const recoveryReq = createReq({
            body: { email: 'paciente@test.com' },
            headers: { 'x-tenant-slug': 'default' },
        });
        const recoveryRes = createRes();

        await requestPasswordRecoveryController(recoveryReq, recoveryRes);

        const recoveryJsonCalls = (recoveryRes.json as unknown as ReturnType<typeof vi.fn>).mock.calls;
        expect(recoveryJsonCalls.length).toBeGreaterThan(0);
        const recoveryPayload = recoveryJsonCalls[0]?.[0] as {
            debugRecoveryLink?: string;
        };
        const token = new URL(recoveryPayload.debugRecoveryLink as string).searchParams.get('token');

        prismaMock.user.findFirst.mockResolvedValue({
            id: 10,
            tenantId: 1,
            password: 'hash-ya-cambiado',
        });

        const resetReq = createReq({
            body: {
                token,
                newPassword: 'N3wPass!123',
                confirmPassword: 'N3wPass!123',
            },
        });
        const resetRes = createRes();

        await resetPasswordController(resetReq, resetRes);

        expect(resetRes.status).toHaveBeenCalledWith(401);
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
});
