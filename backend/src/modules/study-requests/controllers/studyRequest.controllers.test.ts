import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { listStudyRequestsForProfessionalMock } = vi.hoisted(() => ({
    listStudyRequestsForProfessionalMock: vi.fn(),
}));

vi.mock('../services/studyRequest.services', async () => {
    const actual = await vi.importActual<typeof import('../services/studyRequest.services')>('../services/studyRequest.services');
    return {
        ...actual,
        listStudyRequestsForProfessional: (tenantId: number, filters: { dni?: string; status?: string }) =>
            listStudyRequestsForProfessionalMock(tenantId, filters),
    };
});

import { listStudyRequestsForProfessional } from './studyRequest.controllers';

function createRes() {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createReq(partial?: Record<string, unknown>) {
    return {
        query: {},
        tenantId: 9,
        user: {
            id: 40,
            role: { name: 'BIOCHEMIST' },
        } as Request['user'],
        log: {
            error: vi.fn(),
            debug: vi.fn(),
        },
        ...partial,
    } as unknown as Request;
}

describe('studyRequest controller professional list', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('CP-SREQ-02: BIOCHEMIST obtiene solicitudes pendientes de su tenant', async () => {
        listStudyRequestsForProfessionalMock.mockResolvedValue([
            { id: 1, status: 'PENDING', patient: { tenantId: 9 } },
            { id: 2, status: 'PENDING', patient: { tenantId: 9 } },
        ]);

        const req = createReq({ query: { status: 'PENDING' } });
        const res = createRes();

        await listStudyRequestsForProfessional(req, res);

        expect(listStudyRequestsForProfessionalMock).toHaveBeenCalledWith(9, {
            dni: undefined,
            status: 'PENDING',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            count: 2,
            data: expect.arrayContaining([
                expect.objectContaining({ status: 'PENDING' }),
            ]),
        }));
    });
});
