import { Request, Response } from 'express';
import prisma from '@/config/prisma';
import { hashPassword } from '@/modules/auth/services/auth.services';
import { AUDIT_EVENT_TYPES, recordAuditEvent } from '@/modules/audit/services/audit.services';
import {
    createTenantUserSchema,
    setRolePermissionsSchema,
    updateTenantSettingsSchema,
    updateTenantUserSchema,
} from '@/modules/tenant-admin/validators/tenantAdmin.validators';

export async function listTenantUsersController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const users = await prisma.user.findMany({
            where: {
                tenantId,
                role: {
                    name: {
                        in: ['ADMIN', 'BIOCHEMIST', 'PATIENT'],
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }],
            include: {
                role: { select: { id: true, name: true } },
                profile: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: users,
            count: users.length,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error listando usuarios del tenant');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function createTenantUserController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const { error, value } = createTenantUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.details });
        }

        const role = await prisma.role.findUnique({ where: { name: value.roleName } });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Rol no encontrado' });
        }

        const existingByDni = await prisma.user.findFirst({ where: { dni: value.dni, tenantId } });
        if (existingByDni) {
            return res.status(409).json({ success: false, message: 'DNI ya registrado en este tenant' });
        }

        const existingByEmail = await prisma.user.findUnique({ where: { email: value.email } });
        if (existingByEmail) {
            return res.status(409).json({ success: false, message: 'Email ya registrado' });
        }

        const password = await hashPassword(value.password);
        const created = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    tenantId,
                    roleId: role.id,
                    dni: value.dni,
                    email: value.email,
                    password,
                    license: value.license || null,
                },
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
                role: value.roleName,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                id: created.user.id,
                dni: created.user.dni,
                email: created.user.email,
                role: value.roleName,
                profile: created.profile,
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error creando usuario del tenant');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function updateTenantUserController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const userId = Number(req.params.userId);
        if (!Number.isFinite(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'userId inválido' });
        }

        const { error, value } = updateTenantUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.details });
        }

        const targetUser = await prisma.user.findFirst({
            where: { id: userId, tenantId },
            include: { role: true, profile: true },
        });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const userData: {
            email?: string;
            roleId?: number;
            license?: string | null;
            password?: string;
        } = {};

        if (value.email && value.email !== targetUser.email) {
            const existingByEmail = await prisma.user.findUnique({ where: { email: value.email } });
            if (existingByEmail) {
                return res.status(409).json({ success: false, message: 'Email ya registrado' });
            }
            userData.email = value.email;
        }

        if (typeof value.license !== 'undefined') {
            userData.license = value.license || null;
        }

        if (value.password) {
            userData.password = await hashPassword(value.password);
        }

        if (value.roleName && value.roleName !== targetUser.role.name) {
            const role = await prisma.role.findUnique({ where: { name: value.roleName } });
            if (!role) {
                return res.status(404).json({ success: false, message: 'Rol no encontrado' });
            }
            userData.roleId = role.id;
        }

        const profileData: {
            firstName?: string;
            lastName?: string;
            birthDate?: Date | null;
        } = {};

        if (value.firstName) profileData.firstName = value.firstName;
        if (value.lastName) profileData.lastName = value.lastName;
        if (typeof value.birthDate !== 'undefined') profileData.birthDate = value.birthDate || null;

        const updated = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: targetUser.id },
                data: userData,
                include: { role: true },
            });

            let profile = targetUser.profile;
            if (Object.keys(profileData).length > 0) {
                if (targetUser.profile) {
                    profile = await tx.profile.update({ where: { userId: targetUser.id }, data: profileData });
                } else {
                    profile = await tx.profile.create({
                        data: {
                            userId: targetUser.id,
                            firstName: profileData.firstName || 'Sin nombre',
                            lastName: profileData.lastName || 'Sin apellido',
                            birthDate: profileData.birthDate || null,
                        },
                    });
                }
            }

            return { user, profile };
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.USER_UPDATED,
            tenantId,
            targetUserId: targetUser.id,
            metadata: {
                fieldsUpdated: Object.keys(value),
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                id: updated.user.id,
                dni: updated.user.dni,
                email: updated.user.email,
                role: updated.user.role.name,
                license: updated.user.license,
                profile: updated.profile,
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error actualizando usuario del tenant');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function deleteTenantUserController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const userId = Number(req.params.userId);
        if (!Number.isFinite(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'userId inválido' });
        }

        if (req.user?.id === userId) {
            return res.status(409).json({ success: false, message: 'No puedes eliminar tu propio usuario' });
        }

        const targetUser = await prisma.user.findFirst({ where: { id: userId, tenantId } });
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const [patientStudies, assignedStudies, validatedRequests] = await Promise.all([
            prisma.study.count({ where: { userId: targetUser.id } }),
            prisma.study.count({ where: { biochemistId: targetUser.id } }),
            prisma.studyRequest.count({ where: { validatedByUserId: targetUser.id } }),
        ]);

        if (patientStudies > 0 || assignedStudies > 0 || validatedRequests > 0) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el usuario porque tiene datos operativos asociados',
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.profile.deleteMany({ where: { userId: targetUser.id } });
            await tx.user.delete({ where: { id: targetUser.id } });
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.USER_DELETED,
            tenantId,
            targetUserId: targetUser.id,
            metadata: {
                dni: targetUser.dni,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente',
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error eliminando usuario del tenant');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function getTenantSettingsController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant no encontrado' });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                suspended: tenant.suspended,
                contactEmail: tenant.contactEmail,
                supportPhone: tenant.supportPhone,
                address: tenant.address,
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error obteniendo configuración del tenant');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function updateTenantSettingsController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const { error, value } = updateTenantSettingsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.details });
        }

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(value.name ? { name: value.name } : {}),
                ...(typeof value.contactEmail !== 'undefined' ? { contactEmail: value.contactEmail || null } : {}),
                ...(typeof value.supportPhone !== 'undefined' ? { supportPhone: value.supportPhone || null } : {}),
                ...(typeof value.address !== 'undefined' ? { address: value.address || null } : {}),
            },
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.TENANT_SETTINGS_UPDATED,
            tenantId,
            metadata: {
                fieldsUpdated: Object.keys(value),
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Configuración actualizada',
            data: updated,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error actualizando configuración del tenant');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function getTenantPlanStatusController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const subscription = await prisma.tenantSubscription.findUnique({
            where: { tenantId },
            include: {
                plan: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error obteniendo estado del plan del tenant');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function listRolePermissionsController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const roles = await prisma.role.findMany({
            include: {
                rolePermissions: {
                    include: {
                        permission: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return res.status(200).json({
            success: true,
            data: roles.map((role) => ({
                id: role.id,
                name: role.name,
                permissions: role.rolePermissions.map((rp) => rp.permission.key),
            })),
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error listando permisos por rol');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

export async function setRolePermissionsController(req: Request, res: Response): Promise<Response> {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Contexto de tenant no disponible' });
        }

        const { error, value } = setRolePermissionsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.details });
        }

        const role = await prisma.role.findUnique({ where: { name: value.roleName } });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Rol no encontrado' });
        }

        const permissions = await prisma.permission.findMany({
            where: {
                key: {
                    in: value.permissionKeys,
                },
            },
        });

        const foundKeys = new Set(permissions.map((p) => p.key));
        const missingKeys = value.permissionKeys.filter((key: string) => !foundKeys.has(key));
        if (missingKeys.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Algunos permisos no existen',
                data: { missingKeys },
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
            if (permissions.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissions.map((permission) => ({
                        roleId: role.id,
                        permissionId: permission.id,
                    })),
                });
            }
        });

        await recordAuditEvent({
            req,
            eventType: AUDIT_EVENT_TYPES.PERMISSION_CHANGED,
            tenantId,
            metadata: {
                roleName: value.roleName,
                permissionKeys: value.permissionKeys,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Permisos actualizados exitosamente',
            data: {
                roleName: value.roleName,
                permissionKeys: value.permissionKeys,
            },
        });
    } catch (error) {
        req.log.error({ err: error }, 'Error actualizando permisos de rol');
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}
