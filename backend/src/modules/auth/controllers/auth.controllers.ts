import { Request, Response } from 'express';
import { validateLogin } from '../validators/validators';
import { comparePassword, generateToken, generatePasswordRecoveryToken, verifyPasswordRecoveryToken, hashPassword, verifyToken } from '../services/auth.services';
import { enviarCorreoRecuperacion } from '../services/emailService';
import { PrismaClient } from '@prisma/client';
import { validateDoctor, validatePatient } from '../validators/validators';


const prisma = new PrismaClient();

function normalizeEmail(email: unknown): string | undefined {
    if (typeof email !== 'string') return undefined;
    const value = email.trim().toLowerCase();
    return value.length > 0 ? value : undefined;
}

function getPatientLoginLink(): string {
    const baseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl.replace(/\/$/, '')}/login-paciente`;
}

async function sendPatientAccessLink(
    email: string,
    userId: number,
    dni: string,
    options?: { exposeAccessLink?: boolean }
): Promise<{
    inviteEmailSent: boolean;
    debugRecoveryLink?: string;
    activationLink?: string;
}> {
    const allowRecoveryDebugLink = String(process.env.ALLOW_RECOVERY_DEBUG_LINK || '').toLowerCase() === 'true';
    const baseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3001';
    const exposeAccessLink = options?.exposeAccessLink === true;

    const recoveryToken = await generatePasswordRecoveryToken(userId, dni);
    const recoveryLink = `${baseUrl}/recuperar-contrasena?token=${encodeURIComponent(recoveryToken)}`;

    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPassword = (process.env.EMAIL_PASSWORD || '').trim();
    const smtpConfigured = Boolean(emailUser && emailPassword);
    const activationPayload = exposeAccessLink ? { activationLink: recoveryLink } : {};

    if (!smtpConfigured) {
        console.warn('SMTP no configurado: faltan EMAIL_USER y/o EMAIL_PASSWORD. Se omite envio de correo.');
        if (allowRecoveryDebugLink) {
            return {
                inviteEmailSent: false,
                debugRecoveryLink: recoveryLink,
                ...activationPayload,
            };
        }
        return {
            inviteEmailSent: false,
            ...activationPayload,
        };
    }

    try {
        await enviarCorreoRecuperacion(email, recoveryToken);
        return {
            inviteEmailSent: true,
            ...activationPayload,
        };
    } catch (error) {
        console.error('No se pudo enviar correo de activación de paciente:', error);
        if (allowRecoveryDebugLink) {
            return {
                inviteEmailSent: false,
                debugRecoveryLink: recoveryLink,
                ...activationPayload,
            };
        }
        return {
            inviteEmailSent: false,
            ...activationPayload,
        };
    }
}

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
                    const patientEmail = user.email ?? '';
                    const hasPendingMarker = patientEmail.endsWith('@pending.local');

                    if (hasPendingMarker || !user.email || !user.password) {
                        return res.status(403).json({
                            success: false,
                            message: 'Debes completar tu registro de paciente para poder iniciar sesión'
                        });
                    }

                    if (!password) {
                        return res.status(400).json({
                            success: false,
                            message: 'Password requerida'
                        });
                    }

                    const patientPasswordVerify = await comparePassword(password, user.password)
                    if (!patientPasswordVerify) {
                        return res.status(401).json({
                            success: false,
                            message: 'Error en la contraseña'
                        })
                    }

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
        console.log('📝 Registro de paciente - Datos recibidos:', JSON.stringify(req.body, null, 2));

        let isBiochemistRequest = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const bearerToken = authHeader.substring(7);
                const decoded = await verifyToken(bearerToken);
                isBiochemistRequest = decoded?.roleName === 'BIOCHEMIST';
            } catch (error) {
                // Si el token no es valido, se ignora y continua como registro publico.
                isBiochemistRequest = false;
            }
        }

        const validationResultPatient = validatePatient(req.body)
        if (validationResultPatient.error) {
            console.error('❌ Error de validación:', validationResultPatient.error.details);
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada invalidos',
                errors: validationResultPatient.error.details
            })
        }
        const validatedData = validationResultPatient.value;
        const firstName: string = validatedData.firstName;
        const lastName: string = validatedData.lastName;
        const dni: string = validatedData.dni;
        const birthDate: string = validatedData.birthDate;
        const email: string | undefined = normalizeEmail(validatedData.email);
        const password: string | undefined = validatedData.password;
        const hasPassword = Boolean(password && password.trim().length > 0);

        if (hasPassword && !email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido cuando se envía contraseña'
            })
        }

        const existingPatientByDni = await prisma.user.findUnique({
            where: { dni },
            include: { profile: true, role: true }
        });
        if (existingPatientByDni) {
            if (existingPatientByDni.role.name !== 'PATIENT') {
                return res.status(409).json({
                    success: false,
                    message: 'DNI/CURP ya registrado'
                })
            }

            if (email || hasPassword) {
                if (!email) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email es requerido para completar o invitar al paciente'
                    })
                }

                if (email !== existingPatientByDni.email) {
                    const existingUserByEmail = await prisma.user.findUnique({
                        where: { email }
                    });

                    if (existingUserByEmail && existingUserByEmail.id !== existingPatientByDni.id) {
                        return res.status(409).json({
                            success: false,
                            message: 'Email ya registrado'
                        })
                    }
                }

                if (hasPassword) {
                    const hashedPassword = await hashPassword(password!);

                    const updated = await prisma.$transaction(async (tx: any) => {
                        const updatedUser = await tx.user.update({
                            where: { id: existingPatientByDni.id },
                            data: {
                                email,
                                password: hashedPassword
                            }
                        });

                        const updatedProfile = await tx.profile.update({
                            where: { userId: existingPatientByDni.id },
                            data: {
                                firstName,
                                lastName,
                                birthDate
                            }
                        });

                        return { user: updatedUser, profile: updatedProfile };
                    });

                    return res.status(200).json({
                        success: true,
                        message: 'Paciente actualizado exitosamente',
                        data: {
                            id: updated.user.id,
                            role: 'PATIENT',
                            email: updated.user.email,
                            profile: {
                                firstName: updated.profile.firstName,
                                lastName: updated.profile.lastName,
                                birthDate: updated.profile.birthDate
                            }
                        },
                    });
                }

                // Flujo de invitación: email sin contraseña para que el paciente complete alta
                const updated = await prisma.$transaction(async (tx: any) => {
                    const updatedUser = await tx.user.update({
                        where: { id: existingPatientByDni.id },
                        data: {
                            email
                        }
                    });

                    const updatedProfile = await tx.profile.update({
                        where: { userId: existingPatientByDni.id },
                        data: {
                            firstName,
                            lastName,
                            birthDate
                        }
                    });

                    return { user: updatedUser, profile: updatedProfile };
                });

                const shouldSendAccessLink = !updated.user.password;
                const inviteResult = shouldSendAccessLink && updated.user.email
                    ? await sendPatientAccessLink(updated.user.email, updated.user.id, updated.user.dni, {
                        exposeAccessLink: isBiochemistRequest,
                    })
                    : { inviteEmailSent: false };

                const responsePayload: any = {
                    success: true,
                    message: shouldSendAccessLink
                        ? (inviteResult.inviteEmailSent
                            ? 'Paciente actualizado y correo de acceso enviado'
                            : 'Paciente actualizado. No se pudo enviar el correo de acceso en este entorno')
                        : 'Paciente actualizado. Ya cuenta con contraseña configurada',
                    data: {
                        id: updated.user.id,
                        role: 'PATIENT',
                        email: updated.user.email,
                        profile: {
                            firstName: updated.profile.firstName,
                            lastName: updated.profile.lastName,
                            birthDate: updated.profile.birthDate
                        }
                    },
                    inviteEmailSent: inviteResult.inviteEmailSent
                };

                if (inviteResult.debugRecoveryLink) {
                    responsePayload.debugRecoveryLink = inviteResult.debugRecoveryLink;
                }
                if (inviteResult.activationLink) {
                    responsePayload.activationLink = inviteResult.activationLink;
                }

                return res.status(200).json(responsePayload);
            }

            return res.status(409).json({
                success: false,
                message: 'DNI/CURP ya registrado'
            })
        }

        if (email) {
            const existingUserByEmail = await prisma.user.findUnique({
                where: { email }
            });
            if (existingUserByEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email ya registrado'
                })
            }
        }

        const hashedPassword = hasPassword ? await hashPassword(password!) : null;

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
                    email,
                    password: hashedPassword,
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
        const inviteResult = email && !hasPassword
            ? await sendPatientAccessLink(email, result.user.id, result.user.dni, {
                exposeAccessLink: isBiochemistRequest,
            })
            : { inviteEmailSent: false };

        const responsePayload: any = {
            success: true,
            message: email && !hasPassword
                ? (inviteResult.inviteEmailSent
                    ? 'Paciente registrado y correo de acceso enviado'
                    : 'Paciente registrado. No se pudo enviar el correo de acceso en este entorno')
                : 'Paciente registrado exitosamente',
            data: {
                id: result.user.id,
                role: 'PATIENT',
                email: result.user.email,
                profile: {
                    firstName: result.profile.firstName,
                    lastName: result.profile.lastName,
                    birthDate: result.profile.birthDate
                }
            },
            inviteEmailSent: inviteResult.inviteEmailSent
        };

        if (inviteResult.debugRecoveryLink) {
            responsePayload.debugRecoveryLink = inviteResult.debugRecoveryLink;
        }
        if (inviteResult.activationLink) {
            responsePayload.activationLink = inviteResult.activationLink;
        }

        return res.status(201).json(responsePayload);

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
        const allowRecoveryDebugLink = String(process.env.ALLOW_RECOVERY_DEBUG_LINK || '').toLowerCase() === 'true';
        let isBiochemistRequest = false;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const bearerToken = authHeader.substring(7);
                const decoded = await verifyToken(bearerToken);
                isBiochemistRequest = decoded?.roleName === 'BIOCHEMIST';
            } catch {
                isBiochemistRequest = false;
            }
        }

        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        const genericMessage = 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación';

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true, role: true }
        });

        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        // Generar token de recuperación
        const recoveryToken = await generatePasswordRecoveryToken(user.id, user.dni);
        const baseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3001';
        const recoveryLink = `${baseUrl}/recuperar-contrasena?token=${encodeURIComponent(recoveryToken)}`;

        // Enviar correo con el token (si falla SMTP no romper el endpoint)
        let emailSent = false;
        const emailUser = (process.env.EMAIL_USER || '').trim();
        const emailPassword = (process.env.EMAIL_PASSWORD || '').trim();
        const smtpConfigured = Boolean(emailUser && emailPassword);

        if (!smtpConfigured) {
            console.warn('SMTP no configurado: faltan EMAIL_USER y/o EMAIL_PASSWORD. Se omite envio de correo.');
        } else {
            try {
                await enviarCorreoRecuperacion(email, recoveryToken);
                emailSent = true;
            } catch (emailError) {
                console.error('No se pudo enviar correo de recuperación:', emailError);
            }
        }

        const responsePayload: any = {
            success: true,
            message: genericMessage
        };

        if (isBiochemistRequest) {
            responsePayload.activationLink = recoveryLink;
        }

        if (!emailSent && allowRecoveryDebugLink) {
            responsePayload.debugRecoveryLink = recoveryLink;
            responsePayload.message = 'No se pudo enviar el correo en este entorno. Usa el link de recuperación de debug.';
        }

        return res.status(200).json(responsePayload);

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

/**
 * Controlador para obtener un link de acceso de paciente desde el módulo profesional.
 * Si el paciente no tiene registro completo, devuelve link de activación (crear contraseña).
 * Si ya está completo, devuelve link de login paciente.
 * POST /api/auth/patient-access-link
 */
export async function patientAccessLinkController(req: Request, res: Response) {
    try {
        const dni = String(req.body?.dni || '').trim();
        const incomingEmail = normalizeEmail(req.body?.email);

        if (!dni) {
            return res.status(400).json({
                success: false,
                message: 'DNI es requerido'
            });
        }

        const patientByDni = await prisma.user.findUnique({
            where: { dni },
            include: { role: true, profile: true }
        });

        if (!patientByDni) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        if (patientByDni.role.name !== 'PATIENT') {
            return res.status(400).json({
                success: false,
                message: 'El DNI ingresado no corresponde a un paciente'
            });
        }

        let patient = patientByDni;
        if (incomingEmail && incomingEmail !== patient.email) {
            const existingByEmail = await prisma.user.findUnique({
                where: { email: incomingEmail }
            });

            if (existingByEmail && existingByEmail.id !== patient.id) {
                return res.status(409).json({
                    success: false,
                    message: 'Email ya registrado'
                });
            }

            patient = await prisma.user.update({
                where: { id: patient.id },
                data: { email: incomingEmail },
                include: { role: true, profile: true }
            });
        }

        const patientEmail = normalizeEmail(patient.email);
        const isPending = !patient.password || !patientEmail || patientEmail.endsWith('@pending.local');

        if (!isPending) {
            return res.status(200).json({
                success: true,
                message: 'Paciente ya registrado. Comparte el acceso al login.',
                accessType: 'login',
                accessLink: getPatientLoginLink(),
                inviteEmailSent: false,
                data: {
                    id: patient.id,
                    dni: patient.dni,
                    email: patient.email,
                    profile: {
                        firstName: patient.profile?.firstName,
                        lastName: patient.profile?.lastName,
                    }
                }
            });
        }

        if (!patientEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email del paciente es requerido para generar el link de activación'
            });
        }

        const inviteResult = await sendPatientAccessLink(patientEmail, patient.id, patient.dni, {
            exposeAccessLink: true,
        });

        const activationLink = inviteResult.activationLink || inviteResult.debugRecoveryLink || null;

        return res.status(200).json({
            success: true,
            message: inviteResult.inviteEmailSent
                ? 'Link de activación generado y correo enviado al paciente'
                : 'Link de activación generado para compartir con el paciente',
            accessType: 'activation',
            accessLink: activationLink,
            activationLink: inviteResult.activationLink,
            debugRecoveryLink: inviteResult.debugRecoveryLink,
            inviteEmailSent: inviteResult.inviteEmailSent,
            data: {
                id: patient.id,
                dni: patient.dni,
                email: patient.email,
                profile: {
                    firstName: patient.profile?.firstName,
                    lastName: patient.profile?.lastName,
                }
            }
        });
    } catch (error) {
        console.error('Error generando link de acceso de paciente:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al generar link de acceso del paciente'
        });
    }
}