import { NextFunction, Request, Response } from 'express';
import prisma from '@/config/prisma';

export async function tenantContext(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user?.tenantId ?? req.tenantId;

        if (!tenantId) {
            return res.status(403).json({
                success: false,
                message: 'Contexto de tenant no disponible',
                requestId: req.id,
            });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                slug: true,
                suspended: true,
            },
        });

        if (!tenant) {
            return res.status(403).json({
                success: false,
                message: 'Tenant no encontrado',
                requestId: req.id,
            });
        }

        if (tenant.suspended) {
            return res.status(423).json({
                success: false,
                message: 'El tenant está suspendido',
                requestId: req.id,
            });
        }

        req.tenantId = tenant.id;
        req.tenant = tenant;
        return next();
    } catch (error) {
        req.log.error({ err: error }, 'Error resolviendo contexto de tenant');
        return res.status(500).json({
            success: false,
            message: 'Error interno validando tenant',
            requestId: req.id,
        });
    }
}
