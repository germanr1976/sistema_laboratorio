"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarCorreoRecuperacion = enviarCorreoRecuperacion;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
/**
 * Envía correo de recuperación de contraseña
 * @param destinatario - Email del usuario
 * @param token - Token de recuperación para generar el link
 */
async function enviarCorreoRecuperacion(destinatario, token) {
    try {
        // Construir URL completamente segura sin caracteres especiales
        const baseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3001';
        const encodedToken = encodeURIComponent(token);
        const linkRecuperacion = `${baseUrl}/recuperar-contrasena?token=${encodedToken}`;
        console.log("Intentando enviar correo a:", destinatario);
        console.log("Link de recuperación:", linkRecuperacion);
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"LabManager" <noreply@labmanager.com>',
            to: destinatario,
            subject: "Recupera tu contraseña - LabManager",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Recuperación de Contraseña</h2>
                    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                    <a href="${linkRecuperacion}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                        Restablecer Contraseña
                    </a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        Si no solicitaste este correo, ignóralo. El enlace expirará en 1 hora.
                    </p>
                    <p style="margin-top: 20px; font-size: 12px; color: #999; word-break: break-all;">
                        O copia y pega este enlace en tu navegador: ${linkRecuperacion}
                    </p>
                </div>
            `
        });
        console.log("Correo enviado correctamente:", info.response);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error("Error enviando el correo:", error);
        throw new Error(`Error al enviar correo de recuperación: ${error}`);
    }
}
//# sourceMappingURL=emailService.js.map