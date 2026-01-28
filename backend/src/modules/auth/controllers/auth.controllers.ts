import { Request, Response } from 'express';
import { validateLogin } from '../validators/validators';
import { comparePassword, generateToken, generatePasswordRecoveryToken, verifyPasswordRecoveryToken, hashPassword } from '../services/auth.services';
import { enviarCorreoRecuperacion } from '../services/emailService';
import { PrismaClient } from '@prisma/client';
import { validateDoctor, validatePatient } from '../validators/validators';


const prisma = new PrismaClient();

export async function loginController(req: Request, res: Response) {
    try {
        const validationResult = validateLogin(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada invalidos'
            })
        }
        const validatedData = validationResult.value;
        const dni: string = validatedData.dni;
        const password: string | undefined = validatedData.password;

        const user = await prisma.user.findUnique({
            where: { dni },
            include: { profile: true, role: true }
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        } else {
            switch (user.role.name) {
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
                case 'BIOCHEMIST':
                    if (!password) {
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
                    if (!passwordVerify) {
                        return res.status(401).json({
                            success: false,
                            message: 'Error en la contraseñá'
                        })
                    } else {
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
        if (validationResultDoctor.error) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada invalidos'
            })
        }
        const validatedData = validationResultDoctor.value;
        const firstName: string = validatedData.firstName;
        const lastName: string = validatedData.lastName;
        const dni: string = validatedData.dni;
        const license: string = validatedData.license;
        const email: string = validatedData.email;
        const password: string = validatedData.password;

        const existingUserByDni = await prisma.user.findUnique({
            where: { dni }
        });
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUserByDni) {
            return res.status(409).json({
                success: false,
                message: 'DNI/CURP ya registrado'
            })
        }
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email ya registrado'
            })
        }
        const hashedPassword = await hashPassword(password);
        const doctorRole = await prisma.role.findUnique({
            where: { name: 'BIOCHEMIST' }
        })
        if (!doctorRole) {
            return res.status(500).json({
                success: false,
                message: 'Rol BIOCHEMIST no encontrado'
            })
        }
        const result = await prisma.$transaction(async (tx: any) => {
            const newUser = await tx.user.create({
                data: {
                    dni,
                    email,
                    password: hashedPassword,
                    license,
                    roleId: doctorRole.id
                }
            });
            const newProfile = await tx.profile.create({
                data: {
                    firstName,
                    lastName,
                    userId: newUser.id
                }
            });
            return { user: newUser, profile: newProfile }
        });
        const tokenGenerated = await generateToken({
            userId: result.user.id,
            dni: result.user.dni,
            roleId: result.user.roleId,
            roleName: doctorRole.name
        });
        return res.status(201).json({
            success: true,
            message: 'BIOCHEMIST registrado exitosamente',
            data: {
                id: result.user.id,
                dni: result.user.dni,
                email: result.user.email,
                role: 'BIOCHEMIST',
                profile: {
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
export async function registerPatientController(req: Request, res: Response) {
    try {
        const validationResultPatient = validatePatient(req.body)
        if (validationResultPatient.error) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada invalidos'
            })
        }
        const validatedData = validationResultPatient.value;
        const firstName: string = validatedData.firstName;
        const lastName: string = validatedData.lastName;
        const dni: string = validatedData.dni;
        const birthDate: string = validatedData.birthDate;

        const existingPatientByDni = await prisma.user.findUnique({
            where: { dni }
        });
        if (existingPatientByDni) {
            return res.status(409).json({
                success: false,
                message: 'DNI/CURP ya registrado'
            })
        }
        const patientRole = await prisma.role.findUnique({
            where: { name: 'PATIENT' }
        });
        if (!patientRole) {
            return res.status(500).json({
                success: false,
                message: 'Rol PATIENT no encontrado'
            })
        }
        const result = await prisma.$transaction(async (tx: any) => {
            const newPatientUser = await tx.user.create({
                data: {
                    dni,
                    roleId: patientRole?.id
                }
            });
            const newPatientProfile = await tx.profile.create({
                data: {
                    firstName,
                    lastName,
                    birthDate,
                    userId: newPatientUser.id
                }
            });
            return { user: newPatientUser, profile: newPatientProfile }
        });
        return res.status(201).json({
            success: true,
            message: 'Paciente registrado exitosamente',
            data: {
                id: result.user.id,
                role: 'PATIENT',
                profile: {
                    firstName: result.profile.firstName,
                    lastName: result.profile.lastName,
                    birthDate: result.profile.birthDate
                }
            },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });

    }
}

/**
 * Controlador para solicitar recuperación de contraseña
 * POST /api/auth/request-password-recovery
 */
export async function requestPasswordRecoveryController(req: Request, res: Response) {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true, role: true }
        });

        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.status(200).json({
                success: true,
                message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
            });
        }

        // Generar token de recuperación
        const recoveryToken = await generatePasswordRecoveryToken(user.id, user.dni);

        // Enviar correo con el token
        await enviarCorreoRecuperacion(email, recoveryToken);

        return res.status(200).json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email'
        });

    } catch (error) {
        console.error('Error en solicitud de recuperación de contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud'
        });
    }
}

/**
 * Controlador para restablecer contraseña con token
 * POST /api/auth/reset-password
 */
export async function resetPasswordController(req: Request, res: Response) {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // Validar campos
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token, contraseña y confirmación son requeridas'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Verificar token
        let decodedToken;
        try {
            decodedToken = await verifyPasswordRecoveryToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Hash de la nueva contraseña
        const hashedPassword = await hashPassword(newPassword);

        // Actualizar contraseña en base de datos
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return res.status(200).json({
            success: true,
            message: 'Contraseña restablecida exitosamente. Por favor, inicia sesión con tu nueva contraseña.'
        });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al restablecer la contraseña'
        });
    }
}