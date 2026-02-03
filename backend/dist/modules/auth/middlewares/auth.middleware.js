"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.isAdmin = isAdmin;
exports.isBiochemist = isBiochemist;
exports.isPatient = isPatient;
const auth_services_1 = require("../services/auth.services");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Formato de token invalido'
            });
        }
        const token = authHeader.substring(7);
        const tokenverify = await (0, auth_services_1.verifyToken)(token);
        if (!tokenverify) {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: tokenverify.userId },
            include: { profile: true, role: true }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'usuario no encontrado'
            });
        }
        req.user = user;
        return next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
}
// Middleware para verificar si el usuario es administrador
async function isAdmin(req, res, next) {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de administrador'
        });
    }
}
// Middleware para verificar si el usuario es bioquímico
async function isBiochemist(req, res, next) {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de bioquímico'
        });
    }
}
// Middleware para verificar si el usuario es paciente
async function isPatient(req, res, next) {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de paciente'
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map