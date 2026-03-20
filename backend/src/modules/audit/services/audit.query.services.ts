import { AuditEventType, Prisma } from '@prisma/client';
import prisma from '@/config/prisma';

export interface ListAuditEventsFilters {
    tenantId?: number;
    eventType?: AuditEventType;
    actorUserId?: number;
    targetUserId?: number;
    studyId?: number;
    requestId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
}

export interface PaginatedAuditEventsResult {
    items: Prisma.AuditEventGetPayload<{
        include: {
            actorUser: { select: { id: true; dni: true; email: true } };
            targetUser: { select: { id: true; dni: true; email: true } };
            study: { select: { id: true; studyName: true; statusId: true } };
            tenant: { select: { id: true; name: true; slug: true } };
        };
    }>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function listAuditEventsByTenant(
    tenantId: number,
    filters: ListAuditEventsFilters,
): Promise<PaginatedAuditEventsResult> {
    return listAuditEventsGlobal({ ...filters, tenantId });
}

export async function listAuditEventsGlobal(
    filters: ListAuditEventsFilters,
): Promise<PaginatedAuditEventsResult> {
    const createdAtFilter: Prisma.DateTimeFilter = {};

    if (filters.dateFrom) {
        createdAtFilter.gte = filters.dateFrom;
    }

    if (filters.dateTo) {
        createdAtFilter.lte = filters.dateTo;
    }

    const where: Prisma.AuditEventWhereInput = {
        ...(typeof filters.tenantId === 'number' ? { tenantId: filters.tenantId } : {}),
        ...(filters.eventType ? { eventType: filters.eventType } : {}),
        ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
        ...(filters.targetUserId ? { targetUserId: filters.targetUserId } : {}),
        ...(filters.studyId ? { studyId: filters.studyId } : {}),
        ...(filters.requestId ? { requestId: filters.requestId } : {}),
        ...(filters.dateFrom || filters.dateTo ? { createdAt: createdAtFilter } : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
        prisma.auditEvent.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip,
            take: filters.limit,
            include: {
                actorUser: {
                    select: {
                        id: true,
                        dni: true,
                        email: true,
                    },
                },
                targetUser: {
                    select: {
                        id: true,
                        dni: true,
                        email: true,
                    },
                },
                study: {
                    select: {
                        id: true,
                        studyName: true,
                        statusId: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        }),
        prisma.auditEvent.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / filters.limit);

    return {
        items,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
    };
}
