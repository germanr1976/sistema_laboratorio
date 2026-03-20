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

---

## Controles de hardening (Semana 7)

### Bootstrap de platform admin

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PLATFORM_BOOTSTRAP_ENABLED` | `true` en dev / `false` en prod | Habilita o bloquea `POST /api/platform/bootstrap-admin` |
| `ALLOW_PLATFORM_BOOTSTRAP_OVERRIDE` | `false` | Permite forzar re-bootstrap aunque ya exista PLATFORM_ADMIN |

Recomendado en producción:

```env
PLATFORM_BOOTSTRAP_ENABLED=false
ALLOW_PLATFORM_BOOTSTRAP_OVERRIDE=false
```

### Autoregistro de bioquímico

| Variable | Default | Descripción |
|----------|---------|-------------|
| `BIOCHEMIST_SELF_REGISTER_ENABLED` | `true` en dev / `false` en prod | Controla si `POST /api/auth/register-biochemist` acepta registro libre |

Recomendado en producción:

```env
BIOCHEMIST_SELF_REGISTER_ENABLED=false
```

---

## Rate Limiting (Semana 3 – Hardening de autenticación)

El backend aplica rate limiting por IP en los endpoints sensibles usando `express-rate-limit`.
Cada perfil es configurable por variable de entorno. Si la variable no se define, se usa el valor por defecto.
En `NODE_ENV=test` los límites se relajan automáticamente (×100) para no interferir con pruebas.

### Perfil: login
| Variable | Default | Descripción |
|----------|---------|-------------|
| `RATE_LIMIT_LOGIN_WINDOW_MS` | `900000` (15 min) | Ventana de tiempo en milisegundos |
| `RATE_LIMIT_LOGIN_MAX` | `10` | Máximo de intentos fallidos por IP en la ventana |

### Perfil: recuperación de contraseña
| Variable | Default | Descripción |
|----------|---------|-------------|
| `RATE_LIMIT_RECOVERY_WINDOW_MS` | `3600000` (60 min) | Ventana de tiempo en milisegundos |
| `RATE_LIMIT_RECOVERY_MAX` | `5` | Máximo de solicitudes por IP en la ventana |

### Perfil: reset de contraseña
| Variable | Default | Descripción |
|----------|---------|-------------|
| `RATE_LIMIT_RESET_WINDOW_MS` | `3600000` (60 min) | Ventana de tiempo en milisegundos |
| `RATE_LIMIT_RESET_MAX` | `5` | Máximo de intentos por IP en la ventana |

### Perfil: registro público
| Variable | Default | Descripción |
|----------|---------|-------------|
| `RATE_LIMIT_REGISTER_WINDOW_MS` | `3600000` (60 min) | Ventana de tiempo en milisegundos |
| `RATE_LIMIT_REGISTER_MAX` | `10` | Máximo de registros por IP en la ventana |

### Perfil: acciones administrativas (bootstrap, cambio de rol, operaciones de plataforma mutantes)
| Variable | Default | Descripción |
|----------|---------|-------------|
| `RATE_LIMIT_ADMIN_WINDOW_MS` | `900000` (15 min) | Ventana de tiempo en milisegundos |
| `RATE_LIMIT_ADMIN_MAX` | `30` | Máximo de acciones por IP en la ventana |

### Configuración recomendada por entorno

```env
# Desarrollo local (valores relajados para no interrumpir trabajo)
RATE_LIMIT_LOGIN_MAX=100
RATE_LIMIT_RECOVERY_MAX=50
RATE_LIMIT_RESET_MAX=50
RATE_LIMIT_REGISTER_MAX=50
RATE_LIMIT_ADMIN_MAX=200

# QA / Staging (valores de producción para poder testear)
# No definir las variables → usan los defaults de producción

# Producción (no definir las variables → defaults activos)
```

---

## Observabilidad Runtime (Semana 5)

El backend expone métricas técnicas runtime para plataforma en:
- `GET /api/platform/metrics/runtime` (requiere `PLATFORM_ADMIN`)

Healthcheck básico:
- `GET /api/health`

### Variables de umbral para alertas automáticas

| Variable | Default | Descripción |
|----------|---------|-------------|
| `OBS_ALERT_MIN_REQUESTS` | `20` | Mínimo de requests para evaluar alertas por porcentaje |
| `OBS_ALERT_5XX_RATE_PERCENT` | `5` | Umbral de alerta alta para % de errores 5xx |
| `OBS_ALERT_4XX_RATE_PERCENT` | `25` | Umbral de alerta media para % de errores 4xx |
| `OBS_ALERT_429_COUNT` | `20` | Umbral de alerta media por volumen de respuestas 429 |
| `OBS_ALERT_AVG_LATENCY_MS` | `1000` | Umbral de alerta alta por latencia promedio de ruta |
| `OBS_ALERT_MAX_LATENCY_MS` | `3000` | Umbral de alerta media por pico de latencia |

Ejemplo recomendado para QA:

```env
OBS_ALERT_MIN_REQUESTS=10
OBS_ALERT_5XX_RATE_PERCENT=3
OBS_ALERT_4XX_RATE_PERCENT=20
OBS_ALERT_429_COUNT=10
OBS_ALERT_AVG_LATENCY_MS=800
OBS_ALERT_MAX_LATENCY_MS=2000
```

---

Email SMTP (producción/local):

- Mínimo requerido:
	- EMAIL_USER
	- EMAIL_PASSWORD
	- EMAIL_FROM (usar un remitente del mismo mailbox/dominio autenticado)
- Configuración por servicio (ej: Gmail):
	- EMAIL_SERVICE=gmail
	- EMAIL_USER=tu-correo@gmail.com
	- EMAIL_PASSWORD=app-password-de-16-caracteres
- Configuración por host SMTP (opcional):
	- SMTP_HOST=smtp.tu-proveedor.com
	- SMTP_PORT=587
	- SMTP_SECURE=false
	- SMTP_TIMEOUT_MS=20000

Notas de formato:
	- No incluir protocolo en SMTP_HOST (usar `smtp.gmail.com`, no `https://smtp.gmail.com`).
	- Si cargás `SMTP_HOST` con puerto (ej: `smtp.gmail.com:587`), el backend ahora lo normaliza automáticamente.

Recomendado en Render con Gmail:

	- EMAIL_SERVICE=gmail
	- EMAIL_USER=tu-correo@gmail.com
	- EMAIL_PASSWORD=app-password-de-16-caracteres
	- SMTP_HOST=smtp.gmail.com
	- SMTP_PORT=587
	- SMTP_SECURE=false

Si EMAIL_USER o EMAIL_PASSWORD están vacíos, el backend no podrá enviar emails de recuperación.

Fallback de recuperación (útil si SMTP está bloqueado en el proveedor):

	- ALLOW_RECOVERY_DEBUG_LINK=true

Con ese valor, si falla el envío de correo, el endpoint `POST /api/auth/request-password-recovery`
devolverá `debugRecoveryLink` incluso en producción para no bloquear el reseteo de contraseña.

Configuración recomendada por entorno:

- Desarrollo local (sin SMTP real):
	- ALLOW_RECOVERY_DEBUG_LINK=true
	- EMAIL_USER y EMAIL_PASSWORD pueden quedar vacíos
- Deploy / producción:
	- ALLOW_RECOVERY_DEBUG_LINK=false
	- Configurar EMAIL_USER, EMAIL_PASSWORD y EMAIL_FROM válidos

Legacy pacientes sin credenciales completas:

```
npm run backfill:patients
```

Este comando marca pacientes antiguos sin email con un email interno `@pending.local` para forzar que completen registro (email + contraseña) desde el frontend de paciente.

---

## Smoke tests post-deploy

Script local/manual:

```bash
SMOKE_BASE_URL=https://tu-entorno.example.com npm run smoke:api
```

Workflow en GitHub Actions:
- `.github/workflows/post-deploy-smoke.yml`
- Ejecutar por `workflow_dispatch` y pasar `base_url` del entorno desplegado.
