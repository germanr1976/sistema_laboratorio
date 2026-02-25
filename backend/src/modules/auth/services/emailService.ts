import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

function toBoolean(value: string | undefined, fallback = false): boolean {
    if (!value) return fallback;
    return String(value).trim().toLowerCase() === 'true';
}

function parsePort(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeHost(value: string): string {
    return value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function parseSmtpHostAndPort(rawHost: string, rawPort: string | undefined, fallbackPort: number) {
    let host = sanitizeHost(rawHost);
    let port = parsePort(rawPort, fallbackPort);

    if (!host) {
        return { host: '', port };
    }

    const withoutPath = host.split('/')[0];
    const lastColonIndex = withoutPath.lastIndexOf(':');

    if (lastColonIndex > -1 && withoutPath.indexOf(']') === -1) {
        const maybeHost = withoutPath.slice(0, lastColonIndex).trim();
        const maybePort = withoutPath.slice(lastColonIndex + 1).trim();

        if (/^\d+$/.test(maybePort) && maybeHost) {
            host = maybeHost;
            port = Number(maybePort);
        } else {
            host = withoutPath;
        }
    } else {
        host = withoutPath;
    }

    return { host, port };
}

function buildTransporter() {
    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPassword = (process.env.EMAIL_PASSWORD || '').trim();

    if (!emailUser || !emailPassword) {
        throw new Error('SMTP no configurado: faltan EMAIL_USER y/o EMAIL_PASSWORD');
    }

    const emailService = (process.env.EMAIL_SERVICE || 'gmail').trim().toLowerCase();
    const smtpEndpoint = parseSmtpHostAndPort((process.env.SMTP_HOST || '').trim(), process.env.SMTP_PORT, 587);
    const smtpHost = smtpEndpoint.host;
    const smtpPort = smtpEndpoint.port;
    const smtpSecure = toBoolean(process.env.SMTP_SECURE, false);
    const timeoutMs = parsePort(process.env.SMTP_TIMEOUT_MS, 20000);

    const common = {
        auth: {
            user: emailUser,
            pass: emailPassword,
        },
        connectionTimeout: timeoutMs,
        greetingTimeout: timeoutMs,
        socketTimeout: timeoutMs,
    };

    if (smtpHost) {
        console.log(`[email] SMTP host configurado: ${smtpHost}:${smtpPort} (secure=${smtpSecure})`);
        return nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            ...common,
        });
    }

    if (emailService === 'gmail') {
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            ...common,
        });
    }

    return nodemailer.createTransport({
        service: emailService,
        ...common,
    });
}

/**
 * Envía correo de recuperación de contraseña
 * @param destinatario - Email del usuario
 * @param token - Token de recuperación para generar el link
 */
export async function enviarCorreoRecuperacion(destinatario: string, token: string) {
    try {
        const transporter = buildTransporter();

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
    } catch (error) {
        console.error("Error enviando el correo:", error);
        throw new Error(`Error al enviar correo de recuperación: ${error}`);
    }
}