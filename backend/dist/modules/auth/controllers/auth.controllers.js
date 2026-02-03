"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = loginController;
exports.registerDoctorController = registerDoctorController;
exports.registerPatientController = registerPatientController;
exports.requestPasswordRecoveryController = requestPasswordRecoveryController;
exports.resetPasswordController = resetPasswordController;
const validators_1 = require("../validators/validators");
const auth_services_1 = require("../services/auth.services");
const emailService_1 = require("../services/emailService");
const client_1 = require("@prisma/client");
const validators_2 = require("../validators/validators");
const prisma = new client_1.PrismaClient();
async function loginController(req, res) {
    try {
        const validationResult = (0, validators_1.validateLogin)(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada invalidos'
            });
        }
        const validatedData = validationResult.value;
        const dni = validatedData.dni;
        const password = validatedData.password;
        const user = await prisma.user.findUnique({
            where: { dni },
            include: { profile: true, role: true }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        else {
            switch (user.role.name) {
                case 'PATIENT':
                    const tokenGenerated = await (0, auth_services_1.generateToken)({
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
                    const passwordVerify = await (0, auth_services_1.comparePassword)(password, user.password);
                    if (!passwordVerify) {
                        return res.status(401).json({
                            success: false,
                            message: 'Error en la contraseñá'
                        });
                    }
                    else {
                        const tokenGenerated = await (0, auth_services_1.generateToken)({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
async function registerDoctorController(req, res) {
    try {
        const validationResultDoctor = (0, validators_2.validateDoctor)(req.body);
        if (validationResultDoctor.error) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada invalidos'
            });
        }
        const validatedData = validationResultDoctor.value;
        const firstName = validatedData.firstName;
        const lastName = validatedData.lastName;
        const dni = validatedData.dni;
        const license = validatedData.license;
        const email = validatedData.email;
        const password = validatedData.password;
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
            });
        }
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email ya registrado'
            });
        }
        const hashedPassword = await (0, auth_services_1.hashPassword)(password);
        const doctorRole = await prisma.role.findUnique({
            where: { name: 'BIOCHEMIST' }
        });
        if (!doctorRole) {
            return res.status(500).json({
                success: false,
                message: 'Rol BIOCHEMIST no encontrado'
            });
        }
        const result = await prisma.$transaction(async (tx) => {
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
            return { user: newUser, profile: newProfile };
        });
        const tokenGenerated = await (0, auth_services_1.generateToken)({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
async function registerPatientController(req, res) {
    try {
        const validationResultPatient = (0, validators_2.validatePatient)(req.body);
        if (validationResultPatient.error) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada invalidos'
            });
        }
        const validatedData = validationResultPatient.value;
        const firstName = validatedData.firstName;
        const lastName = validatedData.lastName;
        const dni = validatedData.dni;
        const birthDate = validatedData.birthDate;
        const existingPatientByDni = await prisma.user.findUnique({
            where: { dni }
        });
        if (existingPatientByDni) {
            return res.status(409).json({
                success: false,
                message: 'DNI/CURP ya registrado'
            });
        }
        const patientRole = await prisma.role.findUnique({
            where: { name: 'PATIENT' }
        });
        if (!patientRole) {
            return res.status(500).json({
                success: false,
                message: 'Rol PATIENT no encontrado'
            });
        }
        const result = await prisma.$transaction(async (tx) => {
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
            return { user: newPatientUser, profile: newPatientProfile };
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
    }
    catch (error) {
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
async function requestPasswordRecoveryController(req, res) {
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
        const recoveryToken = await (0, auth_services_1.generatePasswordRecoveryToken)(user.id, user.dni);
        // Enviar correo con el token
        await (0, emailService_1.enviarCorreoRecuperacion)(email, recoveryToken);
        return res.status(200).json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email'
        });
    }
    catch (error) {
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
async function resetPasswordController(req, res) {
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
            decodedToken = await (0, auth_services_1.verifyPasswordRecoveryToken)(token);
        }
        catch (error) {
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
        const hashedPassword = await (0, auth_services_1.hashPassword)(newPassword);
        // Actualizar contraseña en base de datos
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        return res.status(200).json({
            success: true,
            message: 'Contraseña restablecida exitosamente. Por favor, inicia sesión con tu nueva contraseña.'
        });
    }
    catch (error) {
        console.error('Error al restablecer contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al restablecer la contraseña'
        });
    }
}
//# sourceMappingURL=auth.controllers.js.map