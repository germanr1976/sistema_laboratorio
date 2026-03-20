import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const getStudyByIdMock = vi.fn();
const getAllStudiesMock = vi.fn();
const getStudiesByBiochemistMock = vi.fn();

vi.mock('../services/study.services', () => ({
    getStudyById: (...args: unknown[]) => getStudyByIdMock(...args),
    getAllStudies: (...args: unknown[]) => getAllStudiesMock(...args),
    getStudiesByBiochemist: (...args: unknown[]) => getStudiesByBiochemistMock(...args),
}));

vi.mock('../formatters/study.formatter', () => ({
    formatStudy: (study: unknown) => study,
}));

vi.mock('@/config/prisma', () => ({
    default: {},
}));

vi.mock('@/modules/audit/services/audit.services', () => ({
    AUDIT_EVENT_TYPES: {},
    recordAuditEvent: vi.fn(),
}));

import { getAllStudies, getMyStudies, getStudyById } from './study.controllers';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Record<string, unknown>) {
    return {
        params: { id: '10' },
        tenantId: 1,
        user: {
            id: 99,
            role: { name: 'PATIENT' },
        } as Request['user'],
        log: {
            error: vi.fn(),
        },
        ...(partial || {}),
    } as unknown as Request;
}

describe('study.controllers getStudyById access', () => {
    beforeEach(() => {
        getStudyByIdMock.mockReset();
        getAllStudiesMock.mockReset();
        getStudiesByBiochemistMock.mockReset();
    });

    test('CP-TENANT-01: responde 404 cuando el estudio no existe en el tenant actual', async () => {
        getStudyByIdMock.mockResolvedValue(null);
        const req = createReq();
        const res = createRes();

        await getStudyById(req, res);

        expect(getStudyByIdMock).toHaveBeenCalledWith(10, 1);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 403 cuando el usuario del mismo tenant no tiene permiso sobre el estudio', async () => {
        getStudyByIdMock.mockResolvedValue({
            id: 10,
            userId: 111,
            biochemistId: 222,
            status: { name: 'IN_PROGRESS' },
            attachments: [],
        });

        const req = createReq({
            user: {
                id: 333,
                role: { name: 'PATIENT' },
            } as Request['user'],
        });
        const res = createRes();

        await getStudyById(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('responde 200 cuando el paciente propietario accede a su estudio', async () => {
        getStudyByIdMock.mockResolvedValue({
            id: 10,
            userId: 99,
            biochemistId: 222,
            status: { name: 'IN_PROGRESS' },
            attachments: [],
        });

        const req = createReq();
        const res = createRes();

        await getStudyById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-TENANT-02: listado admin utiliza tenantId del request', async () => {
        getAllStudiesMock.mockResolvedValue([
            { id: 1, tenantId: 7, userId: 100, biochemistId: 200, status: { name: 'IN_PROGRESS' }, attachments: [] },
            { id: 2, tenantId: 7, userId: 101, biochemistId: null, status: { name: 'COMPLETED' }, attachments: [] },
        ]);

        const req = createReq({
            tenantId: 7,
            user: {
                id: 500,
                role: { name: 'ADMIN' },
            } as Request['user'],
        });
        const res = createRes();

        await getAllStudies(req, res);

        expect(getAllStudiesMock).toHaveBeenCalledWith(7);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.arrayContaining([
                expect.objectContaining({ id: 1, tenantId: 7 }),
                expect.objectContaining({ id: 2, tenantId: 7 }),
            ]),
        }));
    });

    test('CP-STUDY-03: listado de bioquímico usa user.id y tenantId para estudios asignados', async () => {
        getStudiesByBiochemistMock.mockResolvedValue([
            { id: 101, tenantId: 7, biochemistId: 500, status: { name: 'IN_PROGRESS' }, attachments: [] },
            { id: 102, tenantId: 7, biochemistId: 500, status: { name: 'PARTIAL' }, attachments: [] },
        ]);

        const req = createReq({
            tenantId: 7,
            user: {
                id: 500,
                role: { name: 'BIOCHEMIST' },
            } as Request['user'],
        });
        const res = createRes();

        await getMyStudies(req, res);

        expect(getStudiesByBiochemistMock).toHaveBeenCalledWith(500, 7);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.arrayContaining([
                expect.objectContaining({ biochemistId: 500 }),
            ]),
        }));
    });
});
