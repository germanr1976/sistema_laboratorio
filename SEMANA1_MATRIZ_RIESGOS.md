# SEMANA 1 – MATRIZ DE RIESGOS Y CASOS DE PRUEBA CRÍTICOS

Fecha: 19 de marzo de 2026
Acción: Seguridad/QA – definir matriz de riesgos y casos de prueba críticos
Entregable verificable: matriz de riesgos base publicada

---

## Convenciones de severidad y probabilidad

| Nivel | Severidad | Descripción |
|-------|-----------|-------------|
| CRÍTICO | C | Exploitable directamente; pérdida de datos o acceso sin autenticación |
| ALTO | A | Requiere autenticación pero puede cruzar limits de tenant/rol |
| MEDIO | M | Requiere condiciones específicas; impacto parcial o reversible |
| BAJO | B | Cosmético, UX, o requiere acceso físico/admin previo |

| Nivel | Probabilidad | Descripción |
|-------|-------------|-------------|
| Alta | P3 | Explotable con conocimiento básico del sistema |
| Media | P2 | Requiere conocimiento del sistema o situación específica |
| Baja | P1 | Requiere acceso privilegiado o condición muy particular |

**Riesgo compuesto = Severidad × Probabilidad** (referencia orientativa, no bloquea trabajo)

---

## 1. Matriz de riesgos – Seguridad

### R-SEC-01 · Sin rate limiting en endpoints de autenticación
- **Módulo:** auth
- **Endpoints:** `POST /api/auth/login`, `POST /api/auth/request-password-recovery`, `POST /api/auth/reset-password`
- **Severidad:** ALTO
- **Probabilidad:** Alta (P3)
- **Descripción:** No existe límite de intentos. Un atacante puede hacer fuerza bruta contra credenciales o agotar tokens de recuperación con peticiones automatizadas.
- **Código revisado:** No se encontró middleware de rate limiting en `auth.routes.ts`.
- **Impacto:** Compromiso de cuentas de usuarios; abuso de flujo de recuperación de contraseña.
- **Acción implementada:** Rate limiting activo y validado en `login`, `request-password-recovery`, `reset-password` y endpoints sensibles administrativos.
- **Estado:** CERRADO (controles activos + cobertura automatizada)

---

### R-SEC-02 · Control de rol en controller, no en middleware (patients/analysis)
- **Módulo:** patients
- **Endpoints:** `GET /api/patients/analysis`, `GET /api/patients/analysis/:id`
- **Severidad:** MEDIO
- **Probabilidad:** Media (P2)
- **Descripción:** La ruta no usa middleware `isPatient`. La validación de rol se hace dentro del controlador (`userRole !== ROLE_NAMES.PATIENT`). Si en una refactorización se reutiliza la ruta sin ese controller o se agrega un bypass, el control se pierde.
- **Código revisado:** Controlador verifica `userRole !== ROLE_NAMES.PATIENT` → 403. Correcto pero frágil.
- **Impacto:** Bajo impacto real hoy; riesgo futuro de regresión silenciosa.
- **Acción implementada:** Se agregó middleware `isPatient` en rutas de análisis de pacientes y en `GET /api/studies/patient/me`, más cobertura de rutas para denegación por rol incorrecto.
- **Estado:** CERRADO (defensa en profundidad + tests automatizados)

---

### R-SEC-03 · Lógica de permisos inline en getStudyById
- **Módulo:** studies
- **Endpoint:** `GET /api/studies/:id`
- **Severidad:** MEDIO
- **Probabilidad:** Media (P2)
- **Descripción:** El access control (¿puede este usuario ver este estudio?) está implementado inline en el controlador. La lógica es correcta hoy pero depende de condiciones múltiples: `study.userId === req.user.id`, `role === ADMIN`, `biochemistId === null || biochemistId === req.user.id`. Esta complejidad inline es una fuente de bugs y difícil de testear de forma exhaustiva.
- **Código revisado:** Se verificó lógica completa en `getStudyById`. Cubre los tres casos conocidos.
- **Impacto:** Potencial de acceso cruzado si se agrega un nuevo caso edge (ej. estudio compartido entre bioquímicos).
- **Acción implementada:** Se extrajo policy `canAccessStudy(user, study)` y se reutilizó en `getStudyById` y `downloadStudy`; además se agregó cobertura de servicio/controlador y casos CP-TENANT de acceso.
- **Estado:** CERRADO (control centralizado + tests automatizados)

---

### R-SEC-04 · bootstrap-admin protegido por secret pero sin flags de desactivación explícitos en prod
- **Módulo:** platform
- **Endpoint:** `POST /api/platform/bootstrap-admin`
- **Severidad:** MEDIO
- **Probabilidad:** Baja (P1)
- **Descripción:** El endpoint valida `x-platform-bootstrap-secret` contra `PLATFORM_BOOTSTRAP_SECRET` de env. Si el secret está vacío o no configurado, el endpoint devuelve 500. Si está configurado, tiene protección razonable. El riesgo es que el secret quede en un `.env` con valor débil o por defecto en ambientes de staging/producción.
- **Código revisado:** Se verifica `!expectedSecret → 500` y comparación de strings. También tiene `ALLOW_PLATFORM_BOOTSTRAP_OVERRIDE` para controlar si se puede sobreescribir.
- **Impacto:** Si se adivina o filtra el secret, se puede crear un PLATFORM_ADMIN no autorizado.
- **Acción implementada:** Se agregó flag explícito `PLATFORM_BOOTSTRAP_ENABLED` (por defecto deshabilitado en producción), test dedicado de bloqueo cuando está apagado y documentación de checklist de despliegue.
- **Estado:** CERRADO (flag de desactivación + tests automatizados)

---

### R-SEC-05 · Tenant isolation: validación de tenantId en queries sensibles
- **Módulo:** studies, patients, study-requests
- **Endpoints:** Múltiples
- **Severidad:** ALTO
- **Probabilidad:** Media (P2)
- **Descripción:** Las queries Prisma en los módulos operativos incluyen `tenantId` en el `where`. Si un endpoint omite el filtro por `tenantId` en alguna query específica (paginación, búsqueda, join), un usuario autenticado en tenant A podría ver datos de tenant B.
- **Código revisado:** Se validó `tenantId` en `study-requests`, `studies` y `patients`, incluyendo mutaciones tenant-aware (`updateMany` scoped), lecturas por id/listados y acceso por controlador.
- **Impacto:** CRÍTICO si ocurre: fuga de datos de pacientes entre laboratorios.
- **Acción implementada:** Auditoría y hardening ejecutados en módulos operativos críticos con cobertura automatizada en servicios y controladores (incluye CP-TENANT-01 y CP-TENANT-02).
- **Estado:** CERRADO (aislamiento tenant validado con tests)

---

### R-SEC-06 · Registro de bioquímico sin aprobación
- **Módulo:** auth
- **Endpoint:** `POST /api/auth/register-biochemist`
- **Severidad:** MEDIO
- **Probabilidad:** Alta (P3)
- **Descripción:** Cualquier persona puede registrarse como bioquímico sin aprobación de un ADMIN del tenant. Podría usarse para obtener acceso a datos operativos de un tenant.
- **Nota:** Depende de si la intención de negocio es que el registro sea libre o aprobado. Requiere confirmación con Producto.
- **Impacto:** Acceso no autorizado a funciones de bioquímico dentro de un tenant.
- **Acción implementada:** Se agregó control por entorno `BIOCHEMIST_SELF_REGISTER_ENABLED` (por defecto deshabilitado en producción) con test dedicado de denegación cuando está apagado.
- **Estado:** MITIGADO (pendiente decisión final de Producto para onboarding)

---

### R-SEC-07 · Tokens JWT almacenados en localStorage
- **Módulo:** frontend / auth
- **Descripción:** Los tokens se almacenan en `localStorage` del browser. Esto los expone a ataques XSS: cualquier script inyectado en la página puede leer el token.
- **Severidad:** ALTO
- **Probabilidad:** Baja (P1) – depende de si hay XSS explotable en el frontend.
- **Impacto:** Robo de sesión; acceso al sistema como el usuario comprometido.
- **Acción implementada:** Se agregaron headers de seguridad en frontend (incluye `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`) para reducir superficie XSS/clickjacking.
- **Estado:** MITIGADO PARCIALMENTE (pendiente decisión de migración a `httpOnly cookies`)

---

### R-SEC-08 · Sin CSRF protection documentada
- **Módulo:** backend / frontend
- **Descripción:** Si se migra a cookies, se requiere protección CSRF. Si se mantiene localStorage + Bearer token, el riesgo CSRF es bajo (el header no se envía automáticamente por el browser en ataques cross-site).
- **Severidad:** BAJO (con Bearer tokens en header)
- **Probabilidad:** Baja (P1)
- **Acción implementada:** Se documentó explícitamente que el modelo actual usa Bearer token en header y se reforzaron headers de seguridad frontend; se mantiene evaluación condicionada a una futura migración a cookies.
- **Estado:** MITIGADO PARCIALMENTE (condicional a migración de sesión)

---

## 2. Matriz de riesgos – Confiabilidad

### R-REL-01 · Cobertura de tests casi nula
- **Área:** Backend + Frontend
- **Severidad:** ALTO
- **Probabilidad:** Alta (P3)
- **Descripción:** No existe suite de tests automatizados que cubra los flujos core. Cualquier cambio puede introducir regresiones no detectadas.
- **Impacto:** Regresiones en producción; tiempo de detección y resolución alto.
- **Acción implementada:** Suite crítica backend/frontend activa con gate de CI bloqueante (`npm run ci`) y regresión de autorización dedicada.
- **Estado:** CERRADO (base de testing automatizado operativa)

---

### R-REL-02 · Sin smoke tests post-despliegue
- **Área:** DevOps
- **Severidad:** MEDIO
- **Probabilidad:** Media (P2)
- **Descripción:** No hay validación automática inmediata tras un deploy de que el sistema funciona.
- **Acción implementada:** Se agregó script `smoke:api` y workflow `post-deploy-smoke.yml` ejecutable por `workflow_dispatch` con `base_url` para validar `health` y guard de autenticación en endpoint crítico.
- **Estado:** CERRADO (smoke tests operativos post-deploy)

---

## 3. Matriz de riesgos – Observabilidad

### R-OBS-01 · Logs no estructurados en todos los módulos
- **Área:** Backend
- **Severidad:** MEDIO
- **Probabilidad:** Alta (P3)
- **Descripción:** No todos los módulos utilizan `req.log` con campos estructurados consistentes. Dificulta correlación de trazas en incidentes.
- **Acción implementada:** Logging estructurado por request + correlación por `requestId` y endpoint de métricas runtime operativo.
- **Estado:** CERRADO (observabilidad mínima operativa)

---

### R-OBS-02 · Sin alertas operativas
- **Área:** DevOps / Infraestructura
- **Severidad:** MEDIO
- **Probabilidad:** Alta (P3)
- **Descripción:** No hay alertas definidas para error rate, latencia alta o fallos de autenticación masivos.
- **Acción implementada:** Alertas runtime por umbral (5xx, 4xx, 429, latencia) y visualización en dashboard de plataforma.
- **Estado:** CERRADO (alertas mínimas activas)

---

## 4. Resumen priorizado de riesgos

| ID | Área | Título | Sev | Prob | Semana de cierre |
|----|------|--------|-----|------|-----------------|
| R-SEC-01 | Seguridad | Sin rate limiting en auth | A | P3 | **3 ✅** |
| R-SEC-07 | Seguridad | JWT en localStorage | A | P1 | **3 (mitigado parcial)** |
| R-SEC-05 | Seguridad | Tenant isolation en queries | A | P2 | **6 ✅** |
| R-REL-01 | Confiabilidad | Sin tests automatizados | A | P3 | **4 ✅** |
| R-SEC-06 | Seguridad | Registro libre de bioquímico | M | P3 | **1 (mitigado / decisión)** |
| R-SEC-02 | Seguridad | Rol en controller, no middleware | M | P2 | **7 ✅** |
| R-SEC-03 | Seguridad | Permisos inline en getStudyById | M | P2 | **7 ✅** |
| R-SEC-04 | Seguridad | bootstrap-admin secret débil en prod | M | P1 | **7 ✅** |
| R-OBS-01 | Observabilidad | Logs no estructurados | M | P3 | **5 ✅** |
| R-REL-02 | Confiabilidad | Sin smoke tests post-deploy | M | P2 | **7 ✅** |
| R-OBS-02 | Observabilidad | Sin alertas operativas | M | P3 | **5 ✅** |
| R-SEC-08 | Seguridad | CSRF (condicional) | B | P1 | **3 (mitigado parcial)** |

---

## 5. Casos de prueba críticos

> Estos son los casos que deben estar cubiertos **antes de cualquier release a producción**. Se organizan por módulo y rol. Están escritos en formato Dado/Cuando/Entonces (Given/When/Then) para que sean directamente convertibles a tests de integración.

---

### Módulo: auth

#### CP-AUTH-01 · Login exitoso por rol
- **Dado:** usuario registrado con rol PATIENT, BIOCHEMIST, ADMIN o PLATFORM_ADMIN
- **Cuando:** hace POST `/api/auth/login` con credenciales correctas
- **Entonces:** recibe JWT válido con `userId`, `tenantId` y `roleName` correctos
- **Prioridad:** CRÍTICA

#### CP-AUTH-02 · Login con credenciales incorrectas
- **Dado:** usuario registrado
- **Cuando:** hace POST `/api/auth/login` con contraseña incorrecta
- **Entonces:** recibe 401; no recibe token
- **Prioridad:** CRÍTICA

#### CP-AUTH-03 · Acceso a endpoint protegido sin token
- **Dado:** ningún token en el request
- **Cuando:** hace GET `/api/studies/biochemist/me`
- **Entonces:** recibe 401
- **Prioridad:** CRÍTICA

#### CP-AUTH-04 · Acceso a endpoint protegido con token de rol incorrecto
- **Dado:** usuario PATIENT con token válido
- **Cuando:** hace POST `/api/studies` (requiere BIOCHEMIST)
- **Entonces:** recibe 403
- **Prioridad:** CRÍTICA

#### CP-AUTH-05 · Rate limiting en login (futuro – post Semana 3)
- **Dado:** IP o usuario realiza 10 intentos fallidos en 1 minuto
- **Cuando:** intenta login número 11
- **Entonces:** recibe 429 Too Many Requests
- **Prioridad:** ALTA (implementar en Semana 3)

#### CP-AUTH-06 · Recuperación de contraseña válida
- **Dado:** usuario con email registrado
- **Cuando:** hace POST `/api/auth/request-password-recovery` y luego POST `/api/auth/reset-password` con token recibido
- **Entonces:** contraseña cambia exitosamente; token queda inválido
- **Prioridad:** ALTA

#### CP-AUTH-07 · Token de recuperación no reutilizable
- **Dado:** token de recuperación ya usado
- **Cuando:** intenta usar el mismo token nuevamente
- **Entonces:** recibe error y contraseña no cambia
- **Prioridad:** ALTA

---

### Módulo: tenant isolation

#### CP-TENANT-01 · Usuario de tenant A no accede a estudios de tenant B
- **Dado:** usuario BIOCHEMIST del tenant A con token válido
- **Cuando:** hace GET `/api/studies/:id` con el ID de un estudio del tenant B
- **Entonces:** recibe 404 o 403; nunca recibe datos del tenant B
- **Prioridad:** CRÍTICA

#### CP-TENANT-02 · Usuario de tenant A no puede listar estudios de tenant B
- **Dado:** usuario ADMIN del tenant A
- **Cuando:** hace GET `/api/studies/all`
- **Entonces:** solo recibe estudios cuyo `tenantId` coincide con el suyo
- **Prioridad:** CRÍTICA

#### CP-TENANT-03 · Tenant suspendido no puede operar
- **Dado:** tenant marcado como `suspended = true`
- **Cuando:** cualquier usuario de ese tenant realiza cualquier request
- **Entonces:** recibe 423 (Locked) con mensaje claro
- **Prioridad:** ALTA

---

### Módulo: studies

#### CP-STUDY-01 · Paciente solo ve sus propios estudios
- **Dado:** paciente A con estudios propios; paciente B con otros estudios
- **Cuando:** paciente A hace GET `/api/studies/patient/me`
- **Entonces:** solo recibe estudios de paciente A; nunca estudios de paciente B
- **Prioridad:** CRÍTICA

#### CP-STUDY-02 · Paciente no puede ver estudio ajeno por ID
- **Dado:** paciente A intenta acceder al estudio de paciente B (mismo tenant)
- **Cuando:** hace GET `/api/studies/:id` con el ID del estudio de B
- **Entonces:** recibe 403
- **Prioridad:** CRÍTICA

#### CP-STUDY-03 · Bioquímico solo ve estudios asignados a él
- **Dado:** bioquímico con `biochemistId` específico
- **Cuando:** hace GET `/api/studies/biochemist/me`
- **Entonces:** solo recibe estudios donde `biochemistId` coincide con su ID
- **Prioridad:** ALTA

#### CP-STUDY-04 · ADMIN puede ver todos los estudios de su tenant
- **Dado:** admin del tenant A
- **Cuando:** hace GET `/api/studies/all`
- **Entonces:** recibe todos los estudios del tenant A
- **Prioridad:** ALTA

#### CP-STUDY-05 · Creación de estudio válida por bioquímico
- **Dado:** bioquímico autenticado con datos válidos y PDF adjunto
- **Cuando:** hace POST `/api/studies`
- **Entonces:** estudio creado con `tenantId` correcto; recibe 201
- **Prioridad:** ALTA

#### CP-STUDY-06 · Paciente no puede crear estudio directamente
- **Dado:** usuario PATIENT con token válido
- **Cuando:** hace POST `/api/studies`
- **Entonces:** recibe 403
- **Prioridad:** CRÍTICA

---

### Módulo: study-requests

#### CP-SREQ-01 · Paciente solo ve sus propias solicitudes
- **Dado:** paciente A con solicitudes; paciente B con otras solicitudes
- **Cuando:** paciente A hace GET `/api/study-requests/mine`
- **Entonces:** solo recibe solicitudes de paciente A
- **Prioridad:** CRÍTICA

#### CP-SREQ-02 · Bioquímico puede ver solicitudes pendientes
- **Dado:** bioquímico con token válido
- **Cuando:** hace GET `/api/study-requests`
- **Entonces:** recibe solicitudes del tenant; puede validar, rechazar, convertir
- **Prioridad:** ALTA

#### CP-SREQ-03 · Solo bioquímico puede convertir solicitud a estudio
- **Dado:** usuario PATIENT o ADMIN con token válido
- **Cuando:** hace POST `/api/study-requests/:id/convert`
- **Entonces:** recibe 403
- **Prioridad:** CRÍTICA

---

### Módulo: tenant-admin

#### CP-TADM-01 · ADMIN puede crear usuarios en su tenant
- **Dado:** usuario ADMIN del tenant A
- **Cuando:** hace POST `/api/tenant-admin/users` con datos válidos
- **Entonces:** usuario creado con `tenantId` del admin (no de otro tenant)
- **Prioridad:** ALTA

#### CP-TADM-02 · BIOCHEMIST no accede a tenant-admin
- **Dado:** usuario BIOCHEMIST con token válido
- **Cuando:** hace GET `/api/tenant-admin/users`
- **Entonces:** recibe 403
- **Prioridad:** CRÍTICA

#### CP-TADM-03 · ADMIN no puede eliminar su propio usuario
- **Dado:** admin intenta eliminarse a sí mismo
- **Cuando:** hace DELETE `/api/tenant-admin/users/:userId` con su propio ID
- **Entonces:** recibe error o 403 (según regla de negocio)
- **Prioridad:** ALTA

---

### Módulo: platform

#### CP-PLAT-01 · Solo PLATFORM_ADMIN accede a rutas de plataforma
- **Dado:** usuario ADMIN de tenant con token válido
- **Cuando:** hace GET `/api/platform/tenants`
- **Entonces:** recibe 403
- **Prioridad:** CRÍTICA

#### CP-PLAT-02 · PLATFORM_ADMIN puede crear tenant
- **Dado:** PLATFORM_ADMIN con token válido y datos válidos
- **Cuando:** hace POST `/api/platform/tenants`
- **Entonces:** tenant creado; recibe 201 con datos del tenant
- **Prioridad:** ALTA

#### CP-PLAT-03 · bootstrap-admin requiere secret correcto
- **Dado:** request sin header `x-platform-bootstrap-secret` o con valor incorrecto
- **Cuando:** hace POST `/api/platform/bootstrap-admin`
- **Entonces:** recibe 403; no se crea PLATFORM_ADMIN
- **Prioridad:** ALTA

#### CP-PLAT-04 · Métricas globales solo para PLATFORM_ADMIN
- **Dado:** usuario BIOCHEMIST o ADMIN con token válido
- **Cuando:** hace GET `/api/platform/metrics/global`
- **Entonces:** recibe 403
- **Prioridad:** CRÍTICA

---

## 6. Estado de cobertura actual vs requerido

| Módulo | Casos críticos definidos | Tests existentes | Brecha |
|--------|--------------------------|-----------------|--------|
| auth | CP-AUTH-01 al 07 | `auth.routes.test.ts`, `auth.middleware.test.ts`, `auth.recovery.test.ts` | BAJA |
| tenant isolation | CP-TENANT-01 al 03 | `study.controllers.access.test.ts`, `study.services.test.ts`, `studyRequest.services.test.ts`, `patientController.test.ts` | MEDIA |
| studies | CP-STUDY-01 al 06 | `study.routes.test.ts`, `studyAuthorization.service.test.ts`, `study.controllers.access.test.ts` | MEDIA |
| study-requests | CP-SREQ-01 al 03 | `studyRequest.routes.test.ts`, `studyRequest.services.test.ts` | BAJA |
| tenant-admin | CP-TADM-01 al 03 | `tenantAdmin.routes.test.ts`, `tenantAdmin.controllers.test.ts` | BAJA |
| platform | CP-PLAT-01 al 04 | `platform.routes.test.ts`, `platform.bootstrap.test.ts` | BAJA |

**Total: 26 casos críticos definidos, con cobertura automatizada activa en backend y regresión ejecutada en CI.**
**Estado actual: mapeo 1:1 completo (`26/26`) entre caso crítico y test automatizado nombrado.**

### 6.1 Trazabilidad QA 1:1 (CP -> test automatizado)

| Caso crítico | Test automatizado | Estado |
|---|---|---|
| CP-AUTH-01 | `auth.login.test.ts` (login exitoso parametrizado por rol PATIENT/BIOCHEMIST/ADMIN/PLATFORM_ADMIN) | CUBIERTO |
| CP-AUTH-02 | `auth.routes.test.ts` (login inválido -> 401) | CUBIERTO |
| CP-AUTH-03 | `auth.middleware.test.ts` (401 sin Authorization) | CUBIERTO |
| CP-AUTH-04 | `study.routes.test.ts` (PATIENT no crea estudio) | CUBIERTO |
| CP-AUTH-05 | `auth.routes.test.ts` (rate limit login -> 429) | CUBIERTO |
| CP-AUTH-06 | `auth.recovery.test.ts` (flujo request+reset exitoso) | CUBIERTO |
| CP-AUTH-07 | `auth.recovery.test.ts` (token no reutilizable tras cambio de password) | CUBIERTO |
| CP-TENANT-01 | `study.controllers.access.test.ts` (CP-TENANT-01) | CUBIERTO |
| CP-TENANT-02 | `study.controllers.access.test.ts` (CP-TENANT-02) | CUBIERTO |
| CP-TENANT-03 | `tenantContext.middleware.test.ts` (tenant suspendido -> 423) | CUBIERTO |
| CP-STUDY-01 | `study.routes.test.ts` (`/patient/me` solo PATIENT) | CUBIERTO |
| CP-STUDY-02 | `study.controllers.access.test.ts` (403 acceso no autorizado) | CUBIERTO |
| CP-STUDY-03 | `study.controllers.access.test.ts` (CP-STUDY-03: `getMyStudies` usa `user.id` + `tenantId` para listado asignado) | CUBIERTO |
| CP-STUDY-04 | `study.routes.test.ts` (`/all` solo ADMIN) | CUBIERTO |
| CP-STUDY-05 | `study.routes.test.ts` (BIOCHEMIST crea estudio -> 201) | CUBIERTO |
| CP-STUDY-06 | `study.routes.test.ts` (PATIENT no crea estudio -> 403) | CUBIERTO |
| CP-SREQ-01 | `studyRequest.routes.test.ts` (`/mine` solo PATIENT) | CUBIERTO |
| CP-SREQ-02 | `studyRequest.controllers.test.ts` (CP-SREQ-02: BIOCHEMIST lista pendientes con scope tenant) | CUBIERTO |
| CP-SREQ-03 | `studyRequest.routes.test.ts` (solo BIOCHEMIST convierte) | CUBIERTO |
| CP-TADM-01 | `tenantAdmin.controllers.test.ts` (create user forzado a tenantId del request) | CUBIERTO |
| CP-TADM-02 | `tenantAdmin.routes.test.ts` (BIOCHEMIST denegado) | CUBIERTO |
| CP-TADM-03 | `tenantAdmin.controllers.test.ts` (autodelete ADMIN denegado) | CUBIERTO |
| CP-PLAT-01 | `platform.routes.test.ts` (CP-PLAT-01/04) | CUBIERTO |
| CP-PLAT-02 | `platform.routes.test.ts` (`POST /tenants` con permiso -> 201) | CUBIERTO |
| CP-PLAT-03 | `platform.bootstrap.test.ts` (secret inválido -> 403) | CUBIERTO |
| CP-PLAT-04 | `platform.routes.test.ts` (CP-PLAT-01/04) | CUBIERTO |

**Resumen trazabilidad:**
- `CUBIERTO`: 26
- `PARCIAL`: 0
- `PENDIENTE`: 0

---

## 7. Próximos pasos

- Mantener cobertura 1:1 completa (`26/26`) y exigirla como criterio mínimo de release.
- Mantener regression suite de autorización como gate obligatorio en CI.
- Resolver riesgos aún abiertos: R-SEC-04, R-SEC-07, R-SEC-08, R-SEC-06 y R-REL-02.
