import { AuditEventType } from '@prisma/client';
import { Request, Response } from 'express';
import { listAuditEventsByTenant, listAuditEventsGlobal } from '@/modules/audit/services/audit.query.services';
import { listAuditEventsQuerySchema } from '@/modules/audit/validators/audit.validators';

function parseOptionalDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }

    return parsed;
}

export async function listAuditEvents(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;

        if (!tenantId) {
            return res.status(403).json({
                success: false,
                message: 'Contexto de tenant no disponible',
                requestId: req.id,
            });
        }

        const { error, value } = listAuditEventsQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros de búsqueda inválidos',
                errors: error.details,
                requestId: req.id,
            });
        }

        const dateFrom = parseOptionalDate(value.dateFrom);
        const dateTo = parseOptionalDate(value.dateTo);

        if (dateFrom && dateTo && dateFrom > dateTo) {
            return res.status(400).json({
                success: false,
                message: 'Rango de fechas inválido: dateFrom no puede ser mayor que dateTo',
                requestId: req.id,
            });
        }

        const filters = {
            ...(value.eventType ? { eventType: value.eventType as AuditEventType } : {}),
            ...(typeof value.actorUserId === 'number' ? { actorUserId: value.actorUserId } : {}),
            ...(typeof value.targetUserId === 'number' ? { targetUserId: value.targetUserId } : {}),
            ...(typeof value.studyId === 'number' ? { studyId: value.studyId } : {}),
            ...(value.requestId ? { requestId: value.requestId } : {}),
            ...(dateFrom ? { dateFrom } : {}),
            ...(dateTo ? { dateTo } : {}),
            page: value.page,
            limit: value.limit,
        };

        const result = await listAuditEventsByTenant(tenantId, filters);

        return res.status(200).json({
            success: true,
            message: 'Eventos de auditoría obtenidos exitosamente',
            data: result.items,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
            requestId: req.id,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error listando eventos de auditoria');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            requestId: req.id,
        });
    }
}

export async function listGlobalAuditEvents(req: Request, res: Response): Promise<Response> {
    try {
        const { error, value } = listAuditEventsQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros de búsqueda inválidos',
                errors: error.details,
                requestId: req.id,
            });
        }

        const dateFrom = parseOptionalDate(value.dateFrom);
        const dateTo = parseOptionalDate(value.dateTo);

        if (dateFrom && dateTo && dateFrom > dateTo) {
            return res.status(400).json({
                success: false,
                message: 'Rango de fechas inválido: dateFrom no puede ser mayor que dateTo',
                requestId: req.id,
            });
        }

        const filters = {
            ...(typeof value.tenantId === 'number' ? { tenantId: value.tenantId } : {}),
            ...(value.eventType ? { eventType: value.eventType as AuditEventType } : {}),
            ...(typeof value.actorUserId === 'number' ? { actorUserId: value.actorUserId } : {}),
            ...(typeof value.targetUserId === 'number' ? { targetUserId: value.targetUserId } : {}),
            ...(typeof value.studyId === 'number' ? { studyId: value.studyId } : {}),
            ...(value.requestId ? { requestId: value.requestId } : {}),
            ...(dateFrom ? { dateFrom } : {}),
            ...(dateTo ? { dateTo } : {}),
            page: value.page,
            limit: value.limit,
        };

        const result = await listAuditEventsGlobal(filters);

        return res.status(200).json({
            success: true,
            message: 'Eventos de auditoría global obtenidos exitosamente',
            data: result.items,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
            requestId: req.id,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error listando eventos de auditoria global');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            requestId: req.id,
        });
    }
}
