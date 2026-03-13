# INSTRUCTIVO MULTITENANT

Fecha: 13 de marzo de 2026

## 1. Objetivo

Este documento describe:

- Como funciona la pagina multitenant del sistema.
- Que puede hacer un Platform Admin y que puede hacer un Admin de Tenant.
- Flujos operativos recomendados para alta de tenant, asignacion de plan y administracion.
- Riesgos actuales detectados y recomendaciones practicas.

## 2. Alcance funcional

El sistema maneja dos niveles administrativos:

- Nivel plataforma (SaaS): administracion global de tenants y planes.
- Nivel tenant (laboratorio): administracion interna de usuarios, permisos y configuracion.

Pantallas principales:

- Frontend plataforma: frontend/src/app/platform/(app)/page.tsx
- Frontend tenant admin: frontend/src/app/(protected)/tenant-admin/page.tsx

## 3. Arquitectura resumida

### 3.1 Backend

Rutas de plataforma (solo PLATFORM_ADMIN):

- GET /api/platform/tenants
- POST /api/platform/tenants
- POST /api/platform/tenants/:tenantId/admins
- PATCH /api/platform/tenants/:tenantId/suspended
- PATCH /api/platform/tenants/:tenantId/plan
- GET /api/platform/metrics/global

Archivo de rutas:

- backend/src/modules/platform/routes/platform.routes.ts

Rutas de admin tenant (solo ADMIN dentro de su tenant):

- GET /api/tenant-admin/users
- POST /api/tenant-admin/users
- PATCH /api/tenant-admin/users/:userId
- DELETE /api/tenant-admin/users/:userId
- GET /api/tenant-admin/settings
- PATCH /api/tenant-admin/settings
- GET /api/tenant-admin/plan-status
- GET /api/tenant-admin/permissions
- PUT /api/tenant-admin/permissions

Archivo de rutas:

- backend/src/modules/tenant-admin/routes/tenantAdmin.routes.ts

### 3.2 Aislamiento multitenant

El aislamiento se sostiene por:

- tenantId dentro del JWT validado por auth middleware.
- tenantContext middleware para resolver tenant y bloquear suspendidos.
- Filtros por tenantId en consultas de admin tenant.

Archivos clave:

- backend/src/modules/auth/middlewares/auth.middleware.ts
- backend/src/middlewares/tenantContext.middleware.ts

### 3.3 Modelo de datos relevante

Entidades base:

- Tenant
- Plan
- TenantSubscription
- User
- Role
- Permission
- RolePermission

Archivo:

- backend/prisma/schema.prisma

## 4. Flujo operativo recomendado

### Paso 1: Ingreso al portal de plataforma

1. Abrir /platform/login.
2. Ingresar con usuario PLATFORM_ADMIN.
3. Verificar acceso al dashboard de plataforma.

Validaciones implementadas:

- Se exige token platformAuthToken en frontend.
- Se verifica rol PLATFORM_ADMIN o bandera legacy isPlatformAdmin.

### Paso 2: Alta de tenant

1. En Admin Plataforma, completar nombre, slug y plan inicial.
2. Crear tenant.
3. Confirmar que aparece en la tabla de tenants.

Reglas:

- Slug en minusculas, numeros y guiones.
- El plan inicial debe existir y estar activo.

### Paso 3: Crear administrador del tenant

1. Seleccionar tenant.
2. Cargar DNI, email, contrasena, nombre y apellido.
3. Crear admin.

Reglas:

- DNI no duplicado dentro del tenant.
- Email unico global.
- Rol asignado ADMIN.

### Paso 4: Gestion de estado y plan

1. Suspender o reactivar tenant segun necesidad.
2. Asignar plan STARTER, PRO o ENTERPRISE.
3. Verificar cambios en tabla y metricas.

### Paso 5: Administracion interna del tenant

Con usuario ADMIN del tenant:

1. Ingresar a /tenant-admin.
2. Gestionar usuarios internos.
3. Ajustar configuracion del laboratorio.
4. Revisar estado del plan.
5. Actualizar permisos por rol.

## 5. Analisis tecnico de la pagina multitenant

### 5.1 Fortalezas actuales

- Separacion clara entre administracion global y administracion por tenant.
- Middleware de tenantContext bloquea acceso cuando el tenant esta suspendido.
- Operaciones sensibles registran auditoria (alta de tenant, cambio de plan, suspension, permisos).
- Validaciones de backend con esquemas Joi en endpoints criticos.

### 5.2 Riesgos y brechas detectadas

1. Superficie de override legacy:
   - El acceso de plataforma todavia acepta isPlatformAdmin ademas de rol.
   - Recomendacion: definir fecha de retiro de bandera legacy.

2. Endpoint de bootstrap:
   - /api/platform/bootstrap-admin es util para puesta en marcha, pero requiere control estricto del secreto.
   - Recomendacion: permitirlo solo en entorno controlado y monitoreado.

3. Token de plataforma en localStorage:
   - Riesgo inherente ante XSS.
   - Recomendacion: migrar a cookie httpOnly si el roadmap lo permite.

4. UX de errores unificada:
   - Hay mensajes, pero no hay catalogo formal de errores funcionales por accion.
   - Recomendacion: documentar codigos y mensajes de referencia para soporte.

### 5.3 Riesgo residual

Con la implementacion actual, el riesgo principal no es el aislamiento SQL por tenant (que esta cubierto en rutas tenant-admin), sino la higiene operacional de credenciales de plataforma y la convivencia temporal de mecanismos legacy.

## 6. Checklist operativo

### 6.1 Alta de nuevo laboratorio

1. Crear tenant con slug valido.
2. Confirmar tenant activo y con plan inicial.
3. Crear admin tenant.
4. Probar login del admin.
5. Verificar acceso a /tenant-admin.

### 6.2 Suspender tenant por incidente

1. Ejecutar suspension desde Admin Plataforma.
2. Validar que rutas tenant-admin y operativas queden bloqueadas por tenantContext.
3. Registrar motivo interno del incidente.
4. Reactivar cuando corresponda.

### 6.3 Cambio de plan

1. Asignar nuevo plan.
2. Verificar estado ACTIVE en suscripcion.
3. Validar en tenant-admin que el estado del plan refleje el cambio.

## 7. Troubleshooting rapido

Problema: No tengo acceso a /platform

- Verificar que exista platformAuthToken y platformUserData.
- Verificar que el usuario tenga rol PLATFORM_ADMIN.
- Revisar respuesta 403 en /api/platform/metrics/global.

Problema: Tenant admin no carga datos

- Confirmar rol ADMIN del usuario.
- Revisar que el tenant no este suspendido.
- Validar token y tenantId en auth middleware.

Problema: No puedo crear admin tenant

- Revisar duplicidad de DNI por tenant.
- Revisar duplicidad de email global.
- Confirmar existencia del rol ADMIN.

## 8. Recomendaciones de corto plazo

1. Definir y ejecutar plan de deprecacion de isPlatformAdmin.
2. Deshabilitar bootstrap-admin fuera de escenarios de inicializacion controlada.
3. Incorporar suite minima de pruebas E2E para:
   - Alta tenant
   - Crear admin tenant
   - Suspender/reactivar tenant
   - Cambio de plan
4. Evaluar migracion de token de plataforma a cookie httpOnly.

## 9. Mapa rapido de archivos

- frontend/src/app/platform/login/page.tsx
- frontend/src/app/platform/(app)/layout.tsx
- frontend/src/app/platform/(app)/page.tsx
- frontend/src/app/(protected)/tenant-admin/page.tsx
- frontend/src/utils/platformAuth.ts
- backend/src/modules/platform/routes/platform.routes.ts
- backend/src/modules/platform/controllers/platform.controllers.ts
- backend/src/modules/tenant-admin/routes/tenantAdmin.routes.ts
- backend/src/modules/tenant-admin/controllers/tenantAdmin.controllers.ts
- backend/src/modules/auth/middlewares/auth.middleware.ts
- backend/src/middlewares/tenantContext.middleware.ts
- backend/prisma/schema.prisma
