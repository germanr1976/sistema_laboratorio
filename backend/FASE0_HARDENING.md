# FASE 0 – Hardening del Backend

## Qué se implementó

### 1. Logger estructurado con Pino (`src/config/logger.ts`)

Se instaló `pino` y `pino-pretty` (dev) para reemplazar todos los `console.log/error/warn` del backend.

- **Producción** (`NODE_ENV=production`): salida en formato JSON, nivel `info`
- **Desarrollo** (cualquier otro valor): salida legible con `pino-pretty`, nivel `debug`
- Nombre del logger: `laboratorio-backend`
- Incluye timestamp ISO en cada entrada

### 2. RequestId por request (`src/middlewares/requestId.middleware.ts`)

Cada request HTTP recibe un identificador único:

- Se genera un UUID v4 via `crypto.randomUUID()` (nativo de Node.js, sin dependencias)
- Se agrega a `req.id` y al header de respuesta `X-Request-Id`
- Se crea un child logger con `{ requestId }` y se asigna a `req.log`
- Registrado antes de cualquier otra ruta en `app.ts`

### 3. Console.log eliminados

Todos los `console.log`, `console.error` y `console.warn` en `backend/src/` fueron reemplazados por el logger estructurado:

| Archivo | Antes | Después |
|---------|-------|---------|
| `server.ts` | `console.log/error` | `logger.info/error` |
| `app.ts` | `console.warn` | `logger.warn` |
| `modules/auth/controllers/auth.controllers.ts` | `console.log/error/warn` | `req.log.info/error/warn` |
| `modules/auth/services/auth.services.ts` | `console.error` | `logger.error` |
| `modules/auth/services/emailService.ts` | `console.log/error` | `logger.info/error/debug` |
| `modules/studies/controllers/study.controllers.ts` | `console.log/error` | `req.log.info/debug/error` |
| `modules/studies/controllers/deleteAttachment.ts` | `console.error` | `req.log.error` |
| `modules/study-requests/controllers/studyRequest.controllers.ts` | `console.log/error` | `req.log.info/debug/error` |
| `modules/patients/controllers/patientController.ts` | `console.error` | `req.log.error` |
| `seed.ts` | `console.log/error` | `logger.info/error` |

### 4. Manejo centralizado de errores (`src/middlewares/errorHandler.middleware.ts`)

Middleware global de Express `(err, req, res, next)` registrado al final de `app.ts`.

Errores manejados:
- **Joi `ValidationError`**: → 400 con detalles de validación
- **`Prisma.PrismaClientKnownRequestError`**: → 409 (conflicto en unique constraint) o error genérico de BD
- **`Prisma.PrismaClientValidationError`**: → 400
- **`multer.MulterError`**: → 400 con mensaje descriptivo
- **`TokenExpiredError`**: → 401
- **`JsonWebTokenError`**: → 401
- **Errores desconocidos**: → 500 genérico, con stack logeado

Formato de respuesta consistente:
```json
{
  "success": false,
  "message": "Descripción del error",
  "requestId": "uuid-del-request",
  "error": "detalles solo en desarrollo"
}
```

### 5. Middleware de validación (`src/middlewares/validate.middleware.ts`)

Factory de middlewares para validar requests con Joi:

```typescript
import { validateBody, validateParams, validateQuery } from '@/middlewares/validate.middleware';

router.post('/endpoint', validateBody(miSchema), handler);
router.get('/endpoint/:id', validateParams(idSchema), handler);
router.get('/endpoint', validateQuery(querySchema), handler);
```

### 6. Redirección HTTPS en producción (`src/middlewares/httpsRedirect.middleware.ts`)

- En producción: detecta `x-forwarded-proto` (Render, Heroku, etc.) y redirige HTTP → HTTPS (301)
- En desarrollo: pasa sin acción (no-op)

### 7. Helmet con HSTS (`app.ts`)

Se añadió Helmet con HSTS habilitado:

```typescript
app.use(helmet({
  hsts: {
    maxAge: 31536000,        // 1 año
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 8. Tipos extendidos de Express (`src/types/express.d.ts`)

Se agregaron `id` y `log` al tipo `Request` de Express:

```typescript
declare global {
  namespace Express {
    interface Request {
      id: string;       // requestId UUID
      log: Logger;      // child logger de Pino con requestId
    }
  }
}
```

---

## Cómo usar el logger

### En controladores (con acceso a `req`)

```typescript
// Info
req.log.info({ userId: user.id }, 'Usuario autenticado');

// Debug (solo en desarrollo)
req.log.debug({ body: req.body }, 'Datos recibidos');

// Error con contexto
req.log.error({ err: error }, 'Error al procesar request');

// Warn
req.log.warn({ origin }, 'Origin no reconocido');
```

### En servicios o archivos sin acceso a `req`

```typescript
import logger from '@/config/logger';

logger.info('Servidor iniciado');
logger.error({ err }, 'Error de conexión');
```

---

## Cómo funciona el requestId

1. El middleware `requestIdMiddleware` se registra **primero** en `app.ts`
2. Para cada request genera un UUID via `crypto.randomUUID()`
3. Lo almacena en `req.id`
4. Lo envía al cliente en el header `X-Request-Id`
5. Crea `req.log = logger.child({ requestId: id })` para que todos los logs de ese request incluyan el `requestId`

Para rastrear un request de punta a punta, el cliente puede:
- Leer el header `X-Request-Id` de la respuesta
- Buscar ese UUID en los logs del servidor

---

## Cómo funciona el error handler

El `errorHandler` está registrado **al final** de `app.ts`, después del handler de multer existente.

Para propagar errores al handler centralizado desde un controlador:

```typescript
// Opción 1: lanzar el error (no recomendado en controladores con try/catch)
throw new ValidationError('mensaje');

// Opción 2: usar next(err) en middleware
export const miMiddleware = (req, res, next) => {
  try {
    // lógica
  } catch (err) {
    next(err); // el errorHandler lo captura
  }
};
```

Los errores Prisma, Joi, JWT y Multer son detectados automáticamente por tipo (instanceof).

---

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución. En `production`: JSON logs + HTTPS redirect + errores sin detalle | `undefined` (dev) |
| `PORT` | Puerto del servidor | `3000` |
| `ALLOWED_ORIGINS` | CORS origins permitidos (separados por coma) | `http://localhost:3001` |
| `JWT_SECRET` | Secreto para firmar JWT | `fallback-secret` |
| `DATABASE_URL` | URL de conexión a la base de datos | — |
| `EMAIL_USER` | Usuario SMTP | — |
| `EMAIL_PASSWORD` | Contraseña SMTP | — |
| `APP_FRONTEND_URL` | URL base del frontend para links en emails | `http://localhost:3001` |

> **Nota**: Siempre configurar `NODE_ENV=production` en el servidor de producción para activar logs JSON, HTTPS redirect y el formato de errores seguro.
