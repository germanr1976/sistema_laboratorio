import { Request, Response } from 'express';
import { validateLogin } from '../validators/validators';
import { comparePassword, generateToken } from '../services/auth.services';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function loginController(req: Request, res: Response) {
    try {
        const validationResult = validateLogin(req.body);
        if(validationResult.error){
            return res.status(400).json({
                success:false,
                message: 'Datos de entrada invalidos'})
        }
        const validatedData = validationResult.value; 
        const dni: string = validatedData.dni;
        const password: string | undefined = validatedData.password;

        const user = await prisma.user.findUnique({
            where:{dni},
            include:{profile:true, role:true}
        })
        if(!user){
            return res.status(404).json({
                success:false,
                message: 'Usuario no encontrado'})
        }else{
            switch(user.role.name){
                case 'PATIENT': 
                    const tokenGenerated = await generateToken({
                        userId: user.id,
                        dni: user.dni,
                        roleId: user.roleId,
                        roleName: user.role.name    
                    });
                    return res.status(200).json({
                        success: true,
                        message: 'Login exitoso',
                        data: {
                            user: {
                                id: user.id,
                                dni: user.dni,
                                role: user.role.name,
                                profile: {
                                    firstName: user.profile?.firstName,
                                    lastName: user.profile?.lastName
                                }
                            },
                            token: tokenGenerated
                        }
                    });
                case 'DOCTOR':
                case 'BIOCHEMIST':
                    if(!password){
                        return res.status(400).json({
                            success: false,
                            message: 'Password requerida'
                        });
                    }

                    if (!user.password) {
                        return res.status(500).json({
                            success: false,
                            message: 'Usuario sin contraseña configurada'
                        });
                    }

                    const passwordVerify = await comparePassword(password, user.password)
                    if(!passwordVerify){
                        return res.status(401).json({
                            success: false,
                            message: 'Error en la contraseñá'
                        })
                    }else{
                        const tokenGenerated = await generateToken({
                        userId: user.id,
                        dni: user.dni,
                        roleId: user.roleId,
                        roleName: user.role.name    
                    });
                    return res.status(200).json({
                        success: true,
                        message: 'Login exitoso',
                        data: {
                            user: {
                                id: user.id,
                                dni: user.dni,
                                role: user.role.name,
                                profile: {
                                    firstName: user.profile?.firstName,
                                    lastName: user.profile?.lastName
                                }
                            },
                            token: tokenGenerated
                        }
                    });
                    }

                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Rol de usuario no válido'
                    });
            }
        }


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}