import { NextFunction, Request, Response } from 'express';
import prisma from '@/config/prisma';

export function requireTenantPermission(permissionKey: string) {
    return async function tenantPermissionGuard(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
            }

            const rolePermission = await prisma.rolePermission.findFirst({
                where: {
                    roleId: req.user.roleId,
                    permission: {
                        key: permissionKey,
                    },
                },
                select: { id: true },
            });

            if (!rolePermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. No tiene permisos suficientes para esta acción',
                });
            }

            return next();
        } catch (error) {
            req.log.error({ err: error, permissionKey }, 'Error validando permiso granular');
            return res.status(500).json({
                success: false,
                message: 'Error interno validando permisos',
            });
        }
    };
}
