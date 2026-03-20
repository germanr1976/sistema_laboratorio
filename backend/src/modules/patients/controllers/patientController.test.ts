import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const studyFindManyMock = vi.fn();
const studyFindFirstMock = vi.fn();

vi.mock('@/config/prisma', () => ({
    default: {
        study: {
            findMany: (...args: unknown[]) => studyFindManyMock(...args),
            findFirst: (...args: unknown[]) => studyFindFirstMock(...args),
        },
    },
}));

vi.mock('@/modules/auth', () => ({
    ROLE_NAMES: {
        PATIENT: 'PATIENT',
    },
}));

import { getAnalysisByIdController, getMyAnalysisController } from './patientController';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Partial<Request>) {
    return {
        params: {},
        query: {},
        user: {
            id: 10,
            role: { name: 'PATIENT' },
        } as Request['user'],
        tenantId: 77,
        log: {
            error: vi.fn(),
        },
        ...partial,
    } as unknown as Request;
}

describe('patientController tenant scoping', () => {
    beforeEach(() => {
        studyFindManyMock.mockReset();
        studyFindFirstMock.mockReset();
    });

    test('getMyAnalysisController filtra por userId y tenantId', async () => {
        studyFindManyMock.mockResolvedValue([]);
        const req = createReq();
        const res = createRes();

        await getMyAnalysisController(req, res);

        const call = studyFindManyMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(call.where).toMatchObject({ userId: 10, tenantId: 77 });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('getAnalysisByIdController filtra por id, userId y tenantId', async () => {
        studyFindFirstMock.mockResolvedValue(null);
        const req = createReq({ params: { id: '345' } as Request['params'] });
        const res = createRes();

        await getAnalysisByIdController(req, res);

        const call = studyFindFirstMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(call.where).toMatchObject({ id: 345, userId: 10, tenantId: 77 });
        expect(res.status).toHaveBeenCalledWith(404);
    });
});
