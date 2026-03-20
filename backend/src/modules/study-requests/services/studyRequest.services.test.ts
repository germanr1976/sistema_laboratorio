import { beforeEach, describe, expect, test, vi } from 'vitest';

const userFindFirstMock = vi.fn();
const studyRequestCreateMock = vi.fn();
const studyRequestFindManyMock = vi.fn();
const studyRequestFindFirstMock = vi.fn();
const studyRequestUpdateManyMock = vi.fn();

const txStudyRequestFindFirstMock = vi.fn();
const txStudyRequestUpdateManyMock = vi.fn();
const txStatusFindUniqueMock = vi.fn();
const txStudyFindFirstMock = vi.fn();
const txStudyUpdateMock = vi.fn();
const txStudyCreateMock = vi.fn();

const transactionMock = vi.fn();

vi.mock('@/config/prisma', () => ({
    default: {
        user: {
            findFirst: (...args: unknown[]) => userFindFirstMock(...args),
        },
        studyRequest: {
            create: (...args: unknown[]) => studyRequestCreateMock(...args),
            findMany: (...args: unknown[]) => studyRequestFindManyMock(...args),
            findFirst: (...args: unknown[]) => studyRequestFindFirstMock(...args),
            updateMany: (...args: unknown[]) => studyRequestUpdateManyMock(...args),
        },
        $transaction: (...args: unknown[]) => transactionMock(...args),
    },
}));

import {
    convertStudyRequestToStudy,
    getStudyRequestById,
    listStudyRequestsForProfessional,
    rejectStudyRequest,
} from './studyRequest.services';

function expectTenantScope(where: Record<string, unknown>, tenantId: number) {
    expect(where).toMatchObject({
        OR: [
            { patient: { tenantId } },
            { convertedStudy: { tenantId } },
        ],
    });
}

describe('studyRequest.services tenant scoping', () => {
    beforeEach(() => {
        userFindFirstMock.mockReset();
        studyRequestCreateMock.mockReset();
        studyRequestFindManyMock.mockReset();
        studyRequestFindFirstMock.mockReset();
        studyRequestUpdateManyMock.mockReset();

        txStudyRequestFindFirstMock.mockReset();
        txStudyRequestUpdateManyMock.mockReset();
        txStatusFindUniqueMock.mockReset();
        txStudyFindFirstMock.mockReset();
        txStudyUpdateMock.mockReset();
        txStudyCreateMock.mockReset();
        transactionMock.mockReset();

        transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
                studyRequest: {
                    findFirst: (...args: unknown[]) => txStudyRequestFindFirstMock(...args),
                    updateMany: (...args: unknown[]) => txStudyRequestUpdateManyMock(...args),
                },
                status: {
                    findUnique: (...args: unknown[]) => txStatusFindUniqueMock(...args),
                },
                study: {
                    findFirst: (...args: unknown[]) => txStudyFindFirstMock(...args),
                    update: (...args: unknown[]) => txStudyUpdateMock(...args),
                    create: (...args: unknown[]) => txStudyCreateMock(...args),
                },
            };
            return callback(tx);
        });
    });

    test('aplica tenant scope en listado profesional', async () => {
        studyRequestFindManyMock.mockResolvedValue([]);

        await listStudyRequestsForProfessional(99, { status: 'PENDING' });

        const firstCall = studyRequestFindManyMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(firstCall).toBeTruthy();
        expectTenantScope(firstCall.where, 99);
    });

    test('aplica tenant scope en búsqueda por id', async () => {
        studyRequestFindFirstMock.mockResolvedValue(null);

        await getStudyRequestById(12, 77);

        const firstCall = studyRequestFindFirstMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(firstCall).toBeTruthy();
        expect(firstCall.where.id).toBe(12);
        expectTenantScope(firstCall.where, 77);
    });

    test('reject usa updateMany con tenant scope y devuelve entidad refrescada', async () => {
        studyRequestFindFirstMock
            .mockResolvedValueOnce({ id: 10, status: 'PENDING' })
            .mockResolvedValueOnce({ id: 10, status: 'REJECTED' });
        studyRequestUpdateManyMock.mockResolvedValue({ count: 1 });

        const result = await rejectStudyRequest(10, 55, 123, 'motivo');

        const updateCall = studyRequestUpdateManyMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(updateCall.where.id).toBe(10);
        expectTenantScope(updateCall.where, 55);
        expect(result).toMatchObject({ id: 10, status: 'REJECTED' });
    });

    test('convert en transacción usa scope de tenant para leer y actualizar solicitud', async () => {
        txStudyRequestFindFirstMock
            .mockResolvedValueOnce({
                id: 15,
                patientId: 8,
                requestedDate: new Date('2026-03-19T00:00:00.000Z'),
                insuranceName: 'OS',
                doctorName: 'Dr',
                status: 'VALIDATED',
                convertedStudyId: null,
            })
            .mockResolvedValueOnce({ id: 15, status: 'CONVERTED', convertedStudyId: 999 });
        txStatusFindUniqueMock.mockResolvedValue({ id: 2, name: 'IN_PROGRESS' });
        txStudyCreateMock.mockResolvedValue({ id: 999 });
        txStudyRequestUpdateManyMock.mockResolvedValue({ count: 1 });

        await convertStudyRequestToStudy(15, 44, 500);

        const readCall = txStudyRequestFindFirstMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(readCall.where.id).toBe(15);
        expectTenantScope(readCall.where, 44);

        const updateCall = txStudyRequestUpdateManyMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(updateCall.where.id).toBe(15);
        expectTenantScope(updateCall.where, 44);
    });
});
