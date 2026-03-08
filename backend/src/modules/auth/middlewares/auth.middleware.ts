import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.services';
import prisma from '@/config/prisma';

type TokenPayload = {
    userId: number;
    tenantId: number;
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).json({
                success: false, 
                message: 'Token no proporcionado'

            });
        }
        if(!authHeader.startsWith('Bearer ')){
            return res.status(401).json({
                success: false,
                message: 'Formato de token invalido'
            })
        }
        const token = authHeader.substring(7); 
        const tokenverify = await verifyToken(token) as TokenPayload | null;
        if(!tokenverify || !tokenverify.userId || !tokenverify.tenantId){
            return res.status(401).json({
                success: false, 
                message: 'Token expirado'
            }); 
        }
        const user = await prisma.user.findUnique({
            where:{id: tokenverify.userId},
            include:{profile: true, role:true, tenant: true}
        })
        if(!user){
            return res.status(401).json({
                success: false,
                message:'usuario no encontrado' 
            })
        }

        if (user.tenantId !== tokenverify.tenantId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido para este tenant',
            });
        }

        req.tenantId = user.tenantId;
        req.tenant = {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            suspended: user.tenant.suspended,
        };
        req.user = user
       return  next()
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
}

// Middleware para verificar si el usuario es administrador
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (req.user.role.name !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador'
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de administrador'
        });
    }
}

// Middleware para verificar si el usuario es bioquímico
export async function isBiochemist(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (req.user.role.name !== 'BIOCHEMIST') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de bioquímico'
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de bioquímico'
        });
    }
}

// Middleware para verificar si el usuario es paciente
export async function isPatient(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (req.user.role.name !== 'PATIENT') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de paciente'
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de paciente'
        });
    }
}