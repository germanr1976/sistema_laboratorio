import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import prisma from '@/config/prisma';

export const AUDIT_EVENT_TYPES = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    STUDY_CREATED: 'STUDY_CREATED',
    STUDY_STATUS_CHANGED: 'STUDY_STATUS_CHANGED',
    STUDY_EDITED: 'STUDY_EDITED',
    STUDY_DOWNLOADED: 'STUDY_DOWNLOADED',
    ROLE_CHANGED: 'ROLE_CHANGED',
    TENANT_SUSPENDED: 'TENANT_SUSPENDED',
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    TENANT_SETTINGS_UPDATED: 'TENANT_SETTINGS_UPDATED',
    PLATFORM_TENANT_CREATED: 'PLATFORM_TENANT_CREATED',
    PLATFORM_PLAN_ASSIGNED: 'PLATFORM_PLAN_ASSIGNED',
    PERMISSION_CHANGED: 'PERMISSION_CHANGED',
} as const;

export type AuditEventName = (typeof AUDIT_EVENT_TYPES)[keyof typeof AUDIT_EVENT_TYPES];

interface AuditInput {
    req?: Request;
    eventType: AuditEventName;
    tenantId?: number | null;
    actorUserId?: number | null;
    targetUserId?: number | null;
    studyId?: number | null;
    metadata?: Record<string, unknown>;
}

function getIpAddress(req?: Request): string | null {
    if (!req) return null;
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0]?.trim() || null;
    }
    return req.ip || null;
}

export async function recordAuditEvent(input: AuditInput): Promise<void> {
    try {
        const userAgentHeader = input.req?.headers['user-agent'];
        const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : null;

        const data: Prisma.AuditEventCreateInput = {
            eventType: input.eventType,
            requestId: input.req?.id ?? null,
            ipAddress: getIpAddress(input.req),
            userAgent,
            ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
            ...(input.tenantId ?? input.req?.tenantId ? { tenant: { connect: { id: (input.tenantId ?? input.req?.tenantId)! } } } : {}),
            ...(input.actorUserId ?? input.req?.user?.id ? { actorUser: { connect: { id: (input.actorUserId ?? input.req?.user?.id)! } } } : {}),
            ...(input.targetUserId ? { targetUser: { connect: { id: input.targetUserId } } } : {}),
            ...(input.studyId ? { study: { connect: { id: input.studyId } } } : {}),
        };

        await prisma.auditEvent.create({
            data,
        });
    } catch (error) {
        input.req?.log?.error({ err: error, eventType: input.eventType }, 'No se pudo registrar evento de auditoria');
    }
}
