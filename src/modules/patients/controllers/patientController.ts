import { Request, Response } from 'express';
import prisma from '@/config/prisma';
import { ROLE_NAMES } from '@/modules/auth';



export async function getMyAnalysisController (req: Request, res: Response) {
    const userId = req.user?.id;
    const userRole = req.user?.role.name;
    if (!userId) {
    return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.'
    });
}
    if(userRole !== ROLE_NAMES.PATIENT){
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Este recurso es solo para pacientes'
        })
    }

    try{
       const analyses = await prisma.study.findMany({
            where: {
                userId: userId
            },
            select:{
                id:true, 
                studyName: true,
                pdfUrl: true,
                status:{
                    select:{
                        name: true
                    }
                }
            },
            orderBy:{
                studyDate: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Análisis recuperados exitosamente',
            data: analyses
        });

    }catch(error){
        console.error('Error al obtener los análisis del paciente', error)
        return res.status(500).json({
            succes: false, 
            message: 'Error interno del servidor al obtener los análisis'
        });
    }
}