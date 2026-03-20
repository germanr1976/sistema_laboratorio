import { beforeEach, describe, expect, test, vi } from 'vitest';

const studyFindManyMock = vi.fn();
const studyFindFirstMock = vi.fn();
const studyCountMock = vi.fn();
const studyGroupByMock = vi.fn();
const statusFindManyMock = vi.fn();
const transactionArrayMock = vi.fn();

vi.mock('@/config/prisma', () => ({
    default: {
        study: {
            findMany: (...args: unknown[]) => studyFindManyMock(...args),
            findFirst: (...args: unknown[]) => studyFindFirstMock(...args),
            count: (...args: unknown[]) => studyCountMock(...args),
            groupBy: (...args: unknown[]) => studyGroupByMock(...args),
        },
        status: {
            findMany: (...args: unknown[]) => statusFindManyMock(...args),
        },
        $transaction: (...args: unknown[]) => transactionArrayMock(...args),
    },
}));

import {
    getAllStudies,
    getStudiesByBiochemist,
    getStudiesByPatient,
    getStudyById,
} from './study.services';

describe('study.services tenant scoping', () => {
    beforeEach(() => {
        studyFindManyMock.mockReset();
        studyFindFirstMock.mockReset();
        studyCountMock.mockReset();
        studyGroupByMock.mockReset();
        statusFindManyMock.mockReset();
        transactionArrayMock.mockReset();

        transactionArrayMock.mockImplementation(async (operations: unknown[]) => {
            const results = await Promise.all(operations as Promise<unknown>[]);
            return results;
        });
    });

    test('getAllStudies filtra por tenantId', async () => {
        studyFindManyMock.mockResolvedValue([]);

        await getAllStudies(13);

        const firstCall = studyFindManyMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(firstCall.where).toMatchObject({ tenantId: 13 });
    });

    test('getStudiesByBiochemist filtra por biochemistId y tenantId', async () => {
        studyFindManyMock.mockResolvedValue([]);

        await getStudiesByBiochemist(21, 8);

        const firstCall = studyFindManyMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(firstCall.where).toMatchObject({ biochemistId: 21, tenantId: 8 });
    });

    test('getStudyById filtra por id y tenantId', async () => {
        studyFindFirstMock.mockResolvedValue(null);

        await getStudyById(99, 2);

        const firstCall = studyFindFirstMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        expect(firstCall.where).toMatchObject({ id: 99, tenantId: 2 });
    });

    test('getStudiesByPatient aplica tenantId en lista, count y groupBy', async () => {
        studyFindManyMock.mockResolvedValue([]);
        studyCountMock.mockResolvedValue(0);
        studyGroupByMock.mockResolvedValue([]);
        statusFindManyMock.mockResolvedValue([]);

        await getStudiesByPatient(44, 7, 1, 10);

        const listCall = studyFindManyMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        const countCall = studyCountMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };
        const groupCall = studyGroupByMock.mock.calls[0]?.[0] as { where: Record<string, unknown> };

        expect(listCall.where).toMatchObject({ userId: 44, tenantId: 7 });
        expect(countCall.where).toMatchObject({ userId: 44, tenantId: 7 });
        expect(groupCall.where).toMatchObject({ userId: 44, tenantId: 7 });
    });
});
