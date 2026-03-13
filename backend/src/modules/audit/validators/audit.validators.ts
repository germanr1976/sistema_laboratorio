import Joi from 'joi';

const auditEventTypes = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'STUDY_CREATED',
    'STUDY_STATUS_CHANGED',
    'STUDY_EDITED',
    'STUDY_DOWNLOADED',
    'ROLE_CHANGED',
    'TENANT_SUSPENDED',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'TENANT_SETTINGS_UPDATED',
    'PLATFORM_TENANT_CREATED',
    'PLATFORM_PLAN_ASSIGNED',
    'PERMISSION_CHANGED',
] as const;

export const listAuditEventsQuerySchema = Joi.object({
    tenantId: Joi.number().integer().positive().optional(),
    eventType: Joi.string().valid(...auditEventTypes).optional(),
    actorUserId: Joi.number().integer().positive().optional(),
    targetUserId: Joi.number().integer().positive().optional(),
    studyId: Joi.number().integer().positive().optional(),
    requestId: Joi.string().max(100).optional(),
    dateFrom: Joi.string().isoDate().optional(),
    dateTo: Joi.string().isoDate().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});
