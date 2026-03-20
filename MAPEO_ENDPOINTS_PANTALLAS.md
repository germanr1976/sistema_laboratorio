# MAPEO DE ENDPOINTS Y PANTALLAS CRÍTICAS POR ROL

**Semana 1 – Acción: Backend + Frontend: mapear endpoints y pantallas críticas por rol**
Fecha: 18 de marzo de 2026
Estado: COMPLETADO

---

## 1. Roles del sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `PATIENT` | Paciente que solicita estudios y consulta resultados | Público / autoregistro |
| `BIOCHEMIST` | Bioquímico que crea y gestiona estudios | Profesional registrado |
| `ADMIN` | Administrador del tenant (laboratorio local) | Asignado por ADMIN existente |
| `PLATFORM_ADMIN` | Administrador de la plataforma SaaS | Bootstrap o asignado por PLATFORM_ADMIN |

Los roles se almacenan en la tabla `Role` de la base de datos. El campo `User.isPlatformAdmin` es una segunda vía de validación para PLATFORM_ADMIN (flag booleano).

---

## 2. Endpoints backend por módulo y rol

### 2.1 Auth (`/api/auth`)

| Método | Endpoint | Rol permitido | Middleware crítico |
|--------|----------|---------------|--------------------|
| POST | `/api/auth/login` | Todos (público) | — |
| POST | `/api/auth/register-biochemist` | Público | — |
| POST | `/api/auth/register-patient` | Público | — |
| POST | `/api/auth/request-password-recovery` | Público | — |
| POST | `/api/auth/reset-password` | Público | — |
| PATCH | `/api/auth/users/:userId/role` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| PATCH | `/api/auth/tenant/suspended` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |

### 2.2 Studies (`/api/studies`)

| Método | Endpoint | Rol permitido | Middleware crítico |
|--------|----------|---------------|--------------------|
| POST | `/api/studies` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist`, upload |
| GET | `/api/studies/biochemist/me` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| GET | `/api/studies/all` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| GET | `/api/studies/patient/me` | PATIENT, BIOCHEMIST, ADMIN | `authMiddleware`, `tenantContext` |
| GET | `/api/studies/patient/:dni` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| GET | `/api/studies/:id` | BIOCHEMIST, PATIENT, ADMIN | `authMiddleware`, `tenantContext` |
| GET | `/api/studies/:id/download` | BIOCHEMIST, PATIENT, ADMIN | `authMiddleware`, `tenantContext` |
| PATCH | `/api/studies/:id` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| PATCH | `/api/studies/:id/status` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| PATCH | `/api/studies/:id/pdf` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist`, upload |
| DELETE | `/api/studies/:studyId/attachments/:attachmentId` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| POST | `/api/studies/:id/cancel` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |

> **⚠ Observación:** `GET /api/studies/patient/me` y `GET /api/studies/:id` no tienen middleware de rol específico. El control de acceso depende solo de la lógica del controlador. **Candidatos a reforzar en Semana 7.**

### 2.3 Study Requests (`/api/study-requests`)

| Método | Endpoint | Rol permitido | Middleware crítico |
|--------|----------|---------------|--------------------|
| POST | `/api/study-requests` | PATIENT | `authMiddleware`, `tenantContext`, `isPatient` |
| GET | `/api/study-requests/mine` | PATIENT | `authMiddleware`, `tenantContext`, `isPatient` |
| GET | `/api/study-requests` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| PATCH | `/api/study-requests/:id/validate` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| PATCH | `/api/study-requests/:id/reject` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |
| POST | `/api/study-requests/:id/convert` | BIOCHEMIST | `authMiddleware`, `tenantContext`, `isBiochemist` |

### 2.4 Tenant Admin (`/api/tenant-admin`)

| Método | Endpoint | Rol permitido | Middleware crítico |
|--------|----------|---------------|--------------------|
| GET | `/api/tenant-admin/users` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| POST | `/api/tenant-admin/users` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| PATCH | `/api/tenant-admin/users/:userId` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| DELETE | `/api/tenant-admin/users/:userId` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| GET | `/api/tenant-admin/settings` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| PATCH | `/api/tenant-admin/settings` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| GET | `/api/tenant-admin/plan-status` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| GET | `/api/tenant-admin/permissions` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |
| PUT | `/api/tenant-admin/permissions` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |

### 2.5 Audit del Tenant (`/api/audit`)

| Método | Endpoint | Rol permitido | Middleware crítico |
|--------|----------|---------------|--------------------|
| GET | `/api/audit` | ADMIN | `authMiddleware`, `tenantContext`, `isAdmin` |

### 2.6 Platform Admin (`/api/platform`)

| Método | Endpoint | Rol permitido | Middleware crítico |
|--------|----------|---------------|--------------------|
| POST | `/api/platform/bootstrap-admin` | Uso único (sin auth) | — |
| GET | `/api/platform/tenants` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| POST | `/api/platform/tenants` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| PATCH | `/api/platform/tenants/:tenantId` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| DELETE | `/api/platform/tenants/:tenantId` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| POST | `/api/platform/tenants/:tenantId/admins` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| PATCH | `/api/platform/tenants/:tenantId/suspended` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| PATCH | `/api/platform/tenants/:tenantId/plan` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| GET | `/api/platform/metrics/global` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |
| GET | `/api/platform/audit/events` | PLATFORM_ADMIN | `authMiddleware`, `isPlatformAdmin` |

> **⚠ Observación:** `POST /api/platform/bootstrap-admin` no tiene autenticación. Debe estar protegido por flag de uso único o desactivado en producción una vez ejecutado.

### 2.7 Patients (`/api/patients`)

| Método | Endpoint | Rol permitido | Middleware crítico |
|--------|----------|---------------|--------------------|
| GET | `/api/patients/analysis` | PATIENT | `authMiddleware`, `tenantContext` |
| GET | `/api/patients/analysis/:id` | PATIENT | `authMiddleware`, `tenantContext` |

> **⚠ Observación:** Sin middleware de rol explícito (`isPatient`). El acceso solo se filtra por `tenantContext`. **Candidato a reforzar.**

---

## 3. Pantallas frontend por rol

### 3.1 Pantallas públicas (sin autenticación)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `frontend/src/app/page.tsx` | Home – selector paciente / profesional |
| `/login-profesional` | `frontend/src/app/login-profesional/page.tsx` | Login BIOCHEMIST y ADMIN |
| `/login-paciente` | `frontend/src/app/login-paciente/page.tsx` | Login PATIENT |
| `/registro-profesional` | `frontend/src/app/registro-profesional/page.tsx` | Autoregistro BIOCHEMIST |
| `/registro` | `frontend/src/app/registro/page.tsx` | Autoregistro PATIENT |
| `/recuperar-contrasena` | `frontend/src/app/recuperar-contrasena/page.tsx` | Recuperación de contraseña |
| `/logout` | `frontend/src/app/logout/page.tsx` | Cierre de sesión |

### 3.2 Pantallas PLATFORM_ADMIN (`/platform`)

| Ruta | Archivo | Acción principal |
|------|---------|-----------------|
| `/platform/login` | `frontend/src/app/platform/login/page.tsx` | Login exclusivo PLATFORM_ADMIN |
| `/platform` | `frontend/src/app/platform/(app)/page.tsx` | Dashboard de plataforma |
| `/platform/tenants` | `frontend/src/app/platform/(app)/tenants/page.tsx` | Gestión de tenants |
| `/platform/metricas` | `frontend/src/app/platform/(app)/metricas/page.tsx` | Métricas globales |
| `/platform/auditoria` | `frontend/src/app/platform/(app)/auditoria/page.tsx` | Auditoría global |

### 3.3 Pantallas BIOCHEMIST (layout `(protected)`)

| Ruta | Archivo | Acción principal |
|------|---------|-----------------|
| `/dashboard` | `frontend/src/app/(protected)/dashboard/page.tsx` | Dashboard bioquímico |
| `/estudios/proceso` | `frontend/src/app/(protected)/estudios/proceso/page.tsx` | Estudios en proceso |
| `/estudios/parciales` | `frontend/src/app/(protected)/estudios/parciales/page.tsx` | Estudios parciales |
| `/estudios/completados` | `frontend/src/app/(protected)/estudios/completados/page.tsx` | Estudios completados |
| `/cargar-nuevo` | `frontend/src/app/(protected)/cargar-nuevo/page.tsx` | Cargar nuevo estudio |
| `/solicitudes` | `frontend/src/app/(protected)/solicitudes/page.tsx` | Solicitudes pendientes |
| `/historial` | `frontend/src/app/(protected)/historial/page.tsx` | Historial |
| `/configuraciones` | `frontend/src/app/(protected)/configuraciones/page.tsx` | Configuraciones personales |
| `/ayuda` | `frontend/src/app/(protected)/ayuda/page.tsx` | Ayuda |

### 3.4 Pantallas ADMIN (layout `(protected)`)

| Ruta | Archivo | Acción principal |
|------|---------|-----------------|
| `/tenant-admin` | `frontend/src/app/(protected)/tenant-admin/page.tsx` | Gestión usuarios, permisos, auditoría del tenant |

> **Redirecciones de layout:** ADMIN → `/dashboard` redirige a `/tenant-admin`. BIOCHEMIST → `/tenant-admin` redirige a `/dashboard`.

### 3.5 Pantallas PATIENT (`/paciente`)

| Ruta | Archivo | Acción principal |
|------|---------|-----------------|
| `/paciente` | `frontend/src/app/paciente/page.tsx` | Landing / redirect |
| `/paciente/dashboard` | `frontend/src/app/paciente/dashboard/page.tsx` | Dashboard paciente |
| `/paciente/historial` | `frontend/src/app/paciente/historial/page.tsx` | Historial de estudios |
| `/paciente/solicitar-estudio` | `frontend/src/app/paciente/solicitar-estudio/page.tsx` | Crear solicitud de estudio |
| `/paciente/configuraciones` | `frontend/src/app/paciente/configuraciones/page.tsx` | Configuraciones |
| `/paciente/ayuda` | `frontend/src/app/paciente/ayuda/page.tsx` | Ayuda |
| `/paciente/logout` | `frontend/src/app/paciente/logout/page.tsx` | Cierre de sesión |

---

## 4. Resumen: rol → endpoints y pantallas

### PATIENT
**Endpoints backend:**
- POST `/api/auth/login`, `/api/auth/register-patient`, `/api/auth/request-password-recovery`, `/api/auth/reset-password`
- GET `/api/studies/patient/me`, `/api/studies/:id`, `/api/studies/:id/download`
- POST `/api/study-requests`
- GET `/api/study-requests/mine`
- GET `/api/patients/analysis`, `/api/patients/analysis/:id`

**Pantallas:** `/login-paciente`, `/registro`, `/recuperar-contrasena`, `/paciente/*`

---

### BIOCHEMIST
**Endpoints backend:**
- POST `/api/auth/login`, `/api/auth/register-biochemist`, `/api/auth/request-password-recovery`, `/api/auth/reset-password`
- POST `/api/studies`, PATCH `/api/studies/:id`, PATCH `/api/studies/:id/status`, PATCH `/api/studies/:id/pdf`, POST `/api/studies/:id/cancel`
- GET `/api/studies/biochemist/me`, `/api/studies/patient/:dni`, `/api/studies/:id`, `/api/studies/:id/download`
- DELETE `/api/studies/:studyId/attachments/:attachmentId`
- GET `/api/study-requests`, POST `/api/study-requests/:id/convert`
- PATCH `/api/study-requests/:id/validate`, `/api/study-requests/:id/reject`

**Pantallas:** `/login-profesional`, `/registro-profesional`, `/recuperar-contrasena`, `/dashboard`, `/estudios/*`, `/cargar-nuevo`, `/solicitudes`, `/historial`, `/configuraciones`, `/ayuda`

---

### ADMIN (Tenant)
**Endpoints backend:**
- POST `/api/auth/login`
- PATCH `/api/auth/users/:userId/role`, `/api/auth/tenant/suspended`
- GET `/api/studies/all`, `/api/studies/:id`, `/api/studies/:id/download`
- GET/POST/PATCH/DELETE `/api/tenant-admin/users`
- GET/PATCH `/api/tenant-admin/settings`
- GET `/api/tenant-admin/plan-status`, `/api/tenant-admin/permissions`
- PUT `/api/tenant-admin/permissions`
- GET `/api/audit`

**Pantallas:** `/login-profesional`, `/tenant-admin`

---

### PLATFORM_ADMIN
**Endpoints backend:**
- GET/POST/PATCH/DELETE `/api/platform/tenants`
- POST `/api/platform/tenants/:tenantId/admins`
- PATCH `/api/platform/tenants/:tenantId/suspended`, `/api/platform/tenants/:tenantId/plan`
- GET `/api/platform/metrics/global`, `/api/platform/audit/events`

**Pantallas:** `/platform/login`, `/platform`, `/platform/tenants`, `/platform/metricas`, `/platform/auditoria`

---

## 5. Observaciones críticas (input para Semana 2 y 3)

> Estas observaciones son el insumo directo para las próximas semanas del plan.

### 5.1 Endpoints con control de rol insuficiente (candidatos Semana 7)
| Endpoint | Problema | Acción recomendada |
|----------|----------|--------------------|
| GET `/api/studies/patient/me` | Sin `isPatient` explícito; cualquier autenticado puede intentar llamarlo | Agregar validación por rol en controlador o middleware |
| GET `/api/studies/:id` | Sin middleware de rol; depende de lógica interna | Verificar que solo retorne datos del usuario correcto según rol |
| GET `/api/patients/analysis` | Sin `isPatient` explícito | Agregar middleware `isPatient` o validación en controlador |
| GET `/api/patients/analysis/:id` | Sin `isPatient` explícito | Igual que el anterior |
| POST `/api/platform/bootstrap-admin` | Sin autenticación | Verificar que esté desactivado o protegido en producción |

### 5.2 Rutas frontend con posible inconsistencia UI/Backend (candidatos Semana 2)
| Pantalla | Problema potencial |
|----------|--------------------|
| `/tenant-admin` (ADMIN) | Verificar que todas las acciones visibles (usuarios, permisos, auditoría) pasen validación de permisos granulares en backend |
| `/solicitudes` (BIOCHEMIST) | Verificar que no sea accesible para PATIENT desde navegación directa |
| Layout `(protected)` | Redirección por rol en layout es suficiente, pero frontend no debería exponer rutas de otros roles aunque sean redireccionadas |

### 5.3 Eventos de auditoría cubiertos
Los siguientes eventos ya están instrumentados en backend:
`LOGIN_SUCCESS`, `LOGIN_FAILED`, `STUDY_CREATED`, `STUDY_STATUS_CHANGED`, `STUDY_EDITED`, `STUDY_DOWNLOADED`, `ROLE_CHANGED`, `TENANT_SUSPENDED`, `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `TENANT_SETTINGS_UPDATED`, `PLATFORM_TENANT_CREATED`, `PLATFORM_PLAN_ASSIGNED`, `PERMISSION_CHANGED`

---

## 6. Próximos pasos (Semana 1 → Semana 2)

Con este mapeo completado, la Semana 2 puede arrancar con:
1. **Backend:** inventario fino de qué endpoints tienen validación de tenant isolation (que usuario A de tenant 1 no pueda ver datos de tenant 2), especialmente en `GET /api/studies/:id` y variantes.
2. **Frontend:** relevamiento de qué acciones están visibles en UI para un rol dado pero que el backend rechaza por diseño.
3. **Producto:** validar con este documento el comportamiento esperado por rol y marcarlo como aprobado o requiere corrección.
