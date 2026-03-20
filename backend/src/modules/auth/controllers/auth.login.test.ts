import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { prismaMock, comparePasswordMock, generateTokenMock } = vi.hoisted(() => ({
    prismaMock: {
        tenant: {
            findUnique: vi.fn(),
        },
        user: {
            findFirst: vi.fn(),
        },
    },
    comparePasswordMock: vi.fn(async (_password: string, _hashedPassword: string) => true),
    generateTokenMock: vi.fn(async (_payload: {
        userId: number;
        tenantId: number;
        dni: string;
        roleId: number;
        roleName: string;
        isPlatformAdmin?: boolean;
    }) => 'token-demo'),
}));

vi.mock('@/config/prisma', () => ({
    default: prismaMock,
}));

vi.mock('../services/auth.services', async () => {
    const actual = await vi.importActual<typeof import('../services/auth.services')>('../services/auth.services');
    return {
        ...actual,
        comparePassword: (password: string, hashedPassword: string) => comparePasswordMock(password, hashedPassword),
        generateToken: (payload: {
            userId: number;
            tenantId: number;
            dni: string;
            roleId: number;
            roleName: string;
            isPlatformAdmin?: boolean;
        }) => generateTokenMock(payload),
    };
});

vi.mock('@/modules/audit/services/audit.services', () => ({
    AUDIT_EVENT_TYPES: {
        LOGIN_FAILED: 'LOGIN_FAILED',
        LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    },
    recordAuditEvent: vi.fn(),
}));

import { loginController } from './auth.controllers';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Record<string, unknown>) {
    return {
        body: {
            dni: '30111222',
            password: 'Abc12345!',
        },
        headers: {},
        log: {
            error: vi.fn(),
            info: vi.fn(),
        },
        ...partial,
    } as unknown as Request;
}

describe('auth.login controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test.each([
        { roleName: 'PATIENT', isPlatformAdmin: false },
        { roleName: 'BIOCHEMIST', isPlatformAdmin: false },
        { roleName: 'ADMIN', isPlatformAdmin: false },
        { roleName: 'PLATFORM_ADMIN', isPlatformAdmin: true },
    ])('CP-AUTH-01: login exitoso para rol $roleName', async ({ roleName, isPlatformAdmin }) => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 10,
            tenantId: 5,
            dni: '30111222',
            roleId: 3,
            email: 'user@test.com',
            password: 'hash-demo',
            isPlatformAdmin,
            role: { name: roleName },
            profile: { firstName: 'Ana', lastName: 'Perez' },
        });

        const req = createReq();
        const res = createRes();

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(generateTokenMock).toHaveBeenCalledWith(expect.objectContaining({
            userId: 10,
            tenantId: 5,
            roleName,
        }));
    });
});
