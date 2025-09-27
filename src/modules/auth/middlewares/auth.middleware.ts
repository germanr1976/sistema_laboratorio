import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.services';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

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
        // 2. Verificar token
        const tokenverify = await verifyToken(token);
        if(!tokenverify){
            return res.status(401).json({
                success: false, 
                message: 'Token expirado'
            }); 
        }
        // 3. Buscar usuario en BD
        const user = await prisma.user.findUnique({
            where:{id: tokenverify.userId},
            include:{profile: true, role:true}
        })
        if(!user){
            return res.status(401).json({
                success: false,
                message:'usuario no encontrado' 
            })
        }
        req.user = user
       return  next()
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
}