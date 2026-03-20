import { Request, Response } from 'express';
import prisma from '@/config/prisma';
import { getRuntimeMetricsSnapshot } from '@/config/runtimeMetrics';
import { AUDIT_EVENT_TYPES, recordAuditEvent } from '@/modules/audit/services/audit.services';
import { hashPassword } from '@/modules/auth/services/auth.services';
import {
    assignTenantPlanSchema,
    bootstrapPlatformAdminSchema,
    createTenantAdminSchema,
    createTenantSchema,
    updateTenantSchema,
    setTenantSuspendedByPlatformSchema,
} from '@/modules/platform/validators/platform.validators';

export async function bootstrapPlatformAdminController(req: Request, res: Response): Promise<Response> {
    try {
        const bootstrapEnabledRaw = String(process.env.PLATFORM_BOOTSTRAP_ENABLED || '').trim().toLowerCase();
        const bootstrapEnabled = bootstrapEnabledRaw
            ? bootstrapEnabledRaw === 'true'
            : process.env.NODE_ENV !== 'production';

        if (!bootstrapEnabled) {
            return res.status(410).json({
                success: false,
                message: 'Bootstrap de platform admin deshabilitado en este entorno',
            });
        }

        const providedSecret = String(req.headers['x-platform-bootstrap-secret'] || '').trim();
        const expectedSecret = String(process.env.PLATFORM_BOOTSTRAP_SECRET || '').trim();

        if (!expectedSecret) {
            return res.status(500).json({
                success: false,
                message: 'PLATFORM_BOOTSTRAP_SECRET no está configurado',
            });
        }

        if (!providedSecret || providedSecret !== expectedSecret) {
            return res.status(403).json({
                success: false,
                message: 'Secret de bootstrap inválido',
            });
        }

        const existingPlatformAdmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { role: { name: 'PLATFORM_ADMIN' } },
                    { isPlatformAdmin: true },
                ],
            },
            select: { id: true, dni: true, email: true },
        });

        const allowOverride = String(process.env.ALLOW_PLATFORM_BOOTSTRAP_OVERRIDE || '').toLowerCase() === 'true';
        if (existingPlatformAdmin && !allowOverride) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un platform admin. Setea ALLOW_PLATFORM_BOOTSTRAP_OVERRIDE=true para forzar override.',
                data: {
                    id: existingPlatformAdmin.id,
                    dni: existingPlatformAdmin.dni,
                    email: existingPlatformAdmin.email,
                },
            });
        }

        const { error, value } = bootstrapPlatformAdminSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: error.details,
            });
        }

        const target = await prisma.user.findFirst({
            where: {
                OR: [
                    ...(typeof value.userId === 'number' ? [{ id: value.userId }] : []),
                    ...(value.dni ? [{ dni: value.dni }] : []),
                    ...(value.email ? [{ email: value.email }] : []),
                ],
            },
            include: {
                role: true,
            },
        });

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Usuario objetivo no encontrado',
            });
        }

        if (target.role.name !== 'ADMIN' && target.role.name !== 'PLATFORM_ADMIN') {
            return res.status(409).json({
                success: false,
                message: 'El usuario debe tener rol ADMIN para ser platform admin',
            });
        }

        const platformRole = await prisma.role.findUnique({ where: { name: 'PLATFORM_ADMIN' } });
        if (!platformRole) {
            return res.status(500).json({
                success: false,
                message: 'Rol PLATFORM_ADMIN no encontrado. Ejecuta migraciones y seed de roles.',
            });
        }

        const updated = await prisma.user.update({
            where: { id: target.id },
            data: {
                roleId: platformRole.id,
                isPlatformAdmin: true,
            },
            include: { role: true },
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.PERMISSION_CHANGED,
            tenantId: updated.tenantId,
            targetUserId: updated.id,
            metadata: {
                action: 'bootstrap_platform_admin',
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Usuario promovido a platform admin',
            data: {
                id: updated.id,
                dni: updated.dni,
                email: updated.email,
                role: updated.role.name,
                isPlatformAdmin: updated.role.name === 'PLATFORM_ADMIN' || updated.isPlatformAdmin,
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error en bootstrap de platform admin');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function listTenantsController(_req: Request, res: Response): Promise<Response> {
    try {
        const tenants = await prisma.tenant.findMany({
            orderBy: [{ createdAt: 'desc' }],
            include: {
                subscriptions: {
                    include: {
                        plan: {
                            select: {
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        users: true,
                        studies: true,
                        auditEvents: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Tenants obtenidos exitosamente',
            data: tenants,
            count: tenants.length,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function createTenantController(req: Request, res: Response): Promise<Response> {
    try {
        const { error, value } = createTenantSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: error.details,
            });
        }

        const plan = await prisma.plan.findUnique({ where: { code: value.initialPlanCode } });
        if (!plan || !plan.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Plan inicial no encontrado o inactivo',
            });
        }

        const tenant = await prisma.tenant.create({
            data: {
                name: value.name,
                slug: value.slug,
                contactEmail: value.contactEmail || null,
                supportPhone: value.supportPhone || null,
                address: value.address || null,
            },
        });

        const subscription = await prisma.tenantSubscription.create({
            data: {
                tenantId: tenant.id,
                planId: plan.id,
                status: 'ACTIVE',
            },
            include: {
                plan: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.PLATFORM_TENANT_CREATED,
            tenantId: tenant.id,
            metadata: {
                tenantSlug: tenant.slug,
                initialPlan: plan.code,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Tenant creado exitosamente',
            data: {
                tenant,
                subscription,
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error creando tenant desde plataforma');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function createTenantAdminController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = Number(req.params.tenantId);
        if (!Number.isFinite(tenantId) || tenantId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'tenantId inválido',
            });
        }

        const { error, value } = createTenantAdminSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: error.details,
            });
        }

        const [tenant, adminRole] = await Promise.all([
            prisma.tenant.findUnique({ where: { id: tenantId } }),
            prisma.role.findUnique({ where: { name: 'ADMIN' } }),
        ]);

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant no encontrado' });
        }

        if (!adminRole) {
            return res.status(500).json({ success: false, message: 'Rol ADMIN no encontrado' });
        }

        const existingByDni = await prisma.user.findFirst({
            where: { tenantId, dni: value.dni },
            select: { id: true },
        });
        if (existingByDni) {
            return res.status(409).json({ success: false, message: 'DNI ya registrado en este tenant' });
        }

        const existingByEmail = await prisma.user.findUnique({
            where: { email: value.email },
            select: { id: true },
        });
        if (existingByEmail) {
            return res.status(409).json({ success: false, message: 'Email ya registrado' });
        }

        const password = await hashPassword(value.password);
        const created = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    tenantId,
                    roleId: adminRole.id,
                    dni: value.dni,
                    email: value.email,
                    password,
                    license: value.license || null,
                },
                include: { role: true },
            });

            const profile = await tx.profile.create({
                data: {
                    userId: user.id,
                    firstName: value.firstName,
                    lastName: value.lastName,
                    birthDate: value.birthDate || null,
                },
            });

            return { user, profile };
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.USER_CREATED,
            tenantId,
            targetUserId: created.user.id,
            metadata: {
                source: 'platform-admin',
                role: created.user.role.name,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Administrador del tenant creado exitosamente',
            data: {
                id: created.user.id,
                dni: created.user.dni,
                email: created.user.email,
                role: created.user.role.name,
                tenantId: created.user.tenantId,
                profile: created.profile,
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error creando administrador de tenant desde plataforma');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function updateTenantController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = Number(req.params.tenantId);
        if (!Number.isFinite(tenantId) || tenantId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'tenantId inválido',
            });
        }

        const { error, value } = updateTenantSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: error.details,
            });
        }

        const previous = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, slug: true },
        });

        if (!previous) {
            return res.status(404).json({
                success: false,
                message: 'Tenant no encontrado',
            });
        }

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: value.name,
                slug: value.slug,
                contactEmail: value.contactEmail || null,
                supportPhone: value.supportPhone || null,
                address: value.address || null,
            },
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.TENANT_SETTINGS_UPDATED,
            tenantId: updated.id,
            metadata: {
                action: 'platform_tenant_updated',
                before: {
                    name: previous.name,
                    slug: previous.slug,
                },
                after: {
                    name: updated.name,
                    slug: updated.slug,
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Tenant actualizado correctamente',
            data: updated,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error actualizando tenant desde plataforma');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function deleteTenantController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = Number(req.params.tenantId);
        if (!Number.isFinite(tenantId) || tenantId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'tenantId inválido',
            });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                _count: {
                    select: {
                        users: true,
                        studies: true,
                        studyAttachments: true,
                        auditEvents: true,
                    },
                },
            },
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant no encontrado',
            });
        }

        const hasRelatedData =
            tenant._count.users > 0 ||
            tenant._count.studies > 0 ||
            tenant._count.studyAttachments > 0 ||
            tenant._count.auditEvents > 0;

        if (hasRelatedData) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el tenant porque tiene datos asociados. Suspendelo o vacialo primero.',
                data: {
                    users: tenant._count.users,
                    studies: tenant._count.studies,
                    attachments: tenant._count.studyAttachments,
                    auditEvents: tenant._count.auditEvents,
                },
            });
        }

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.TENANT_SETTINGS_UPDATED,
            tenantId,
            metadata: {
                action: 'platform_tenant_deleted',
                tenant: {
                    id: tenant.id,
                    slug: tenant.slug,
                    name: tenant.name,
                },
            },
        });

        await prisma.tenant.delete({ where: { id: tenantId } });

        return res.status(200).json({
            success: true,
            message: 'Tenant eliminado correctamente',
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error eliminando tenant desde plataforma');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function setTenantSuspendedByPlatformController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = Number(req.params.tenantId);
        if (!Number.isFinite(tenantId) || tenantId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'tenantId inválido',
            });
        }

        const { error, value } = setTenantSuspendedByPlatformSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: error.details,
            });
        }

        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { suspended: value.suspended },
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.TENANT_SUSPENDED,
            tenantId: tenant.id,
            metadata: {
                suspended: tenant.suspended,
                source: 'platform-admin',
            },
        });

        return res.status(200).json({
            success: true,
            message: tenant.suspended ? 'Tenant suspendido' : 'Tenant reactivado',
            data: tenant,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error actualizando estado de tenant desde plataforma');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function assignTenantPlanController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = Number(req.params.tenantId);
        if (!Number.isFinite(tenantId) || tenantId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'tenantId inválido',
            });
        }

        const { error, value } = assignTenantPlanSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: error.details,
            });
        }

        const plan = await prisma.plan.findUnique({ where: { code: value.planCode } });
        if (!plan || !plan.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Plan no encontrado o inactivo',
            });
        }

        const subscription = await prisma.tenantSubscription.upsert({
            where: { tenantId },
            create: {
                tenantId,
                planId: plan.id,
                status: value.status,
                endsAt: value.endsAt || null,
            },
            update: {
                planId: plan.id,
                status: value.status,
                endsAt: value.endsAt || null,
            },
            include: {
                plan: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.PLATFORM_PLAN_ASSIGNED,
            tenantId,
            metadata: {
                planCode: plan.code,
                status: subscription.status,
                endsAt: subscription.endsAt,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Plan asignado correctamente',
            data: subscription,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error asignando plan desde plataforma');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function getGlobalMetricsController(_req: Request, res: Response): Promise<Response> {
    try {
        const [tenantTotal, tenantSuspended, userTotal, studyTotal, auditTotal, activeSubscriptions] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { suspended: true } }),
            prisma.user.count(),
            prisma.study.count(),
            prisma.auditEvent.count(),
            prisma.tenantSubscription.count({ where: { status: 'ACTIVE' } }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                tenantTotal,
                tenantSuspended,
                userTotal,
                studyTotal,
                auditTotal,
                activeSubscriptions,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}

export async function getRuntimeMetricsController(req: Request, res: Response): Promise<Response> {
    try {
        return res.status(200).json({
            success: true,
            message: 'Métricas runtime obtenidas exitosamente',
            requestId: req.id,
            data: getRuntimeMetricsSnapshot(),
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error obteniendo métricas runtime');
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            requestId: req.id,
        });
    }
}
