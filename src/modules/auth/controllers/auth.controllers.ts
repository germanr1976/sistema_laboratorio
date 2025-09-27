import { Request, Response } from 'express';
import { validateLogin } from '../validators/validators';
import { comparePassword, generateToken } from '../services/auth.services';
import { PrismaClient } from '@prisma/client';
import { validateDoctor } from '../validators/validators';
import { hashPassword } from '../services/auth.services';

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

export async function registerDoctorController(req: Request, res: Response) {
    try {
        const validationResultDoctor = validateDoctor(req.body); 
        if(validationResultDoctor.error){
            return res.status(400).json({
                success:false,
                message: 'Datos de entrada invalidos'})
        }
        const validatedData = validationResultDoctor.value; 
        const firstName:string = validatedData.firstName;
        const lastName:string = validatedData.lastName;
        const dni: string = validatedData.dni; 
        const license: string = validatedData.license; 
        const email: string = validatedData.email; 
        const password: string= validatedData.password;

       const existingUserByDni = await prisma.user.findUnique({
            where:{ dni }
       });
       const existingUserByEmail = await prisma.user.findUnique({
            where:{email}
       });
       if(existingUserByDni){
            return res.status(409).json({
                success: false,
                message: 'DNI/CURP ya registrado'
            })
       }
       if(existingUserByEmail){
            return res.status(409).json({
                success: false,
                message: 'Email ya registrado'
            })
       }
       const hashedPassword = await hashPassword(password);
       const doctorRole = await prisma.role.findUnique({
            where: {name: 'DOCTOR'}
       })
       if(!doctorRole){
            return res.status(500).json({
                success: false,
                message: 'Rol DOCTOR no encontrado'
            })
       }
       const result = await prisma.$transaction(async(tx:any) => {
            const newUser = await tx.user.create({
                data:{
                    dni,
                    email,
                    password: hashedPassword,
                    license,
                    roleId: doctorRole.id 
                }
            });
            const newProfile = await tx.profile.create({
                data:{
                    firstName,
                    lastName,
                    userId: newUser.id
                }
            });
            return {user:newUser, profile:newProfile}
       });
       const tokenGenerated = await generateToken({
            userId: result.user.id,
            dni: result.user.dni,
            roleId: result.user.roleId,
            roleName: doctorRole.name
       });
       return res.status(201).json({
            success: true,
            message: 'Doctor registrado exitosamente',
            data:{
                id: result.user.id,
                dni: result.user.dni,
                email: result.user.email,
                role: 'DOCTOR',
                profile:{
                    firstName: result.profile.firstName,
                    lastName: result.profile.lastName
                }
            },
            token: tokenGenerated
       });
        
    } catch (error) {
         console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}