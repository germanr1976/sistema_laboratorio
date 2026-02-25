# Backend env setup

1. Copy the example file:

```
cp .env.example .env
```

2. Fill in required values:
- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- EMAIL_USER / EMAIL_PASSWORD (if using email)
- APP_FRONTEND_URL (URL pública del frontend)

3. Start the server:

```
npm run dev
```

Notes:
- Do not commit .env to git.
- In Render, set these values in the Environment section.

Email SMTP (producción/local):

- Mínimo requerido:
	- EMAIL_USER
	- EMAIL_PASSWORD
	- EMAIL_FROM
- Configuración por servicio (ej: Gmail):
	- EMAIL_SERVICE=gmail
	- EMAIL_USER=tu-correo@gmail.com
	- EMAIL_PASSWORD=app-password-de-16-caracteres
- Configuración por host SMTP (opcional):
	- SMTP_HOST=smtp.tu-proveedor.com
	- SMTP_PORT=587
	- SMTP_SECURE=false

Si EMAIL_USER o EMAIL_PASSWORD están vacíos, el backend no podrá enviar emails de recuperación.

Legacy pacientes sin credenciales completas:

```
npm run backfill:patients
```

Este comando marca pacientes antiguos sin email con un email interno `@pending.local` para forzar que completen registro (email + contraseña) desde el frontend de paciente.
