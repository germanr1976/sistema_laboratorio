# 📊 ANÁLISIS DEL SISTEMA - ENFOQUE AUDITORÍA + ADMINISTRACIÓN (SaaS)

**Fecha:** 22 de febrero de 2026  
**Versión:** 2.0  
**Objetivo:** preparar el sistema para ser alquilado de forma segura, auditable y administrable.

---

## 1) Resumen ejecutivo

El sistema actual ya tiene una base sólida para operación clínica (autenticación JWT, roles, gestión de estudios y adjuntos), pero **todavía no está listo para un modelo de alquiler multi-cliente**.

Para alquilarlo de manera profesional necesitás incorporar tres capacidades estructurales:

1. **Aislamiento por cliente (tenant)** para separar datos y operación entre laboratorios.
2. **Auditoría inmutable** para trazabilidad legal y operativa.
3. **Módulo de administración** para gobierno del sistema (usuarios, permisos, configuración y facturación/plan).

Sin estas tres capas, existe riesgo alto de mezcla de datos entre clientes, dificultad para investigar incidentes y poca gobernanza comercial.

---

## 2) Estado actual (base existente)

### Fortalezas técnicas detectadas
- Backend modular con Express + Prisma y separación por dominio (`auth`, `patients`, `studies`).
- JWT con roles principales (`PATIENT`, `BIOCHEMIST`, `ADMIN`).
- Modelo de estudios funcional con adjuntos (`StudyAttachment`) y estados.
- Frontend Next.js con rutas protegidas y flujo operativo ya usable.

### Brechas críticas para alquilarlo
- No hay concepto de **tenant** en el esquema (usuarios y estudios no están particionados por cliente).
- No hay tabla/servicio de **eventos de auditoría**.
- `ADMIN` es global y limitado (no hay permisos granulares por módulo/acción).
- No hay módulo de **suscripción/plan/licenciamiento**.
- Logging actual basado en `console.log`, insuficiente para soporte comercial y cumplimiento.

---

## 3) Requisitos del nuevo escenario (alquiler)

### Requisitos funcionales mínimos
1. Alta de laboratorio/cliente (tenant).
2. Alta/baja/modificación de usuarios por tenant.
3. Control de acceso por roles + permisos granulares.
4. Registro de auditoría de acciones críticas.
5. Panel de administración con métricas operativas.
6. Estado comercial por tenant (plan, vencimiento, límites, suspensión).

### Requisitos no funcionales mínimos
1. Trazabilidad completa (quién, qué, cuándo, dónde, resultado).
2. Aislamiento de datos entre tenants a nivel consulta y escritura.
3. Observabilidad (logs estructurados, métricas, correlación por request).
4. Escalabilidad para múltiples laboratorios concurrentes.
5. Políticas de retención y exportación de auditoría.

---

## 4) Diseño objetivo recomendado

## 4.1 Dominio multi-tenant

Agregar entidad `Tenant` y vincularla a los datos de negocio:

- `User.tenantId` (excepto superadmin de plataforma si aplica).
- `Study.tenantId`.
- `StudyAttachment` heredando tenant por relación con estudio.
- Índices compuestos recomendados:
  - `(tenantId, id)`
  - `(tenantId, createdAt)`
  - `(tenantId, statusId)`

**Regla de oro:** toda query de negocio debe filtrar por `tenantId`.

## 4.2 Módulo de auditoría

Agregar entidad `AuditEvent` (inmutable):

- `id`, `tenantId`, `actorUserId`, `actorRole`
- `action` (ej: `STUDY_STATUS_UPDATED`)
- `entityType` (`Study`, `User`, `Tenant`, etc.)
- `entityId`
- `before` (JSON), `after` (JSON)
- `result` (`SUCCESS` / `FAILURE`)
- `ip`, `userAgent`, `requestId`
- `createdAt`

Eventos obligatorios iniciales:
- Login/logout/fallo de login.
- Creación/edición/anulación de estudio.
- Descarga/visualización de PDF.
- Cambios de permisos/roles.
- Cambios de plan, suspensión/reactivación de tenant.

## 4.3 Módulo de administración

Separar dos niveles:

1. **Admin de plataforma (tu equipo):**
   - alta de tenants,
   - asignación de plan,
   - suspensión/reactivación,
   - métricas globales.

2. **Admin de tenant (cliente):**
   - gestión de usuarios internos,
   - permisos,
   - parámetros del laboratorio,
   - lectura de auditoría de su tenant.

---

## 5) Modelo de permisos sugerido (RBAC + permisos)

Mantener roles base pero agregar permisos por acción:

- `studies.read`, `studies.create`, `studies.update`, `studies.cancel`
- `patients.read`, `patients.manage`
- `users.read`, `users.manage`
- `audit.read`, `audit.export`
- `tenant.settings.manage`
- `billing.read`, `billing.manage`

Esto evita depender solo del nombre del rol y permite vender planes con capacidades diferentes.

---

## 6) Riesgos actuales si se alquila sin estos cambios

1. **Riesgo de mezcla de datos** entre clientes (crítico).
2. **Riesgo legal/compliance** por falta de trazabilidad robusta.
3. **Riesgo operativo**: soporte lento ante incidentes sin eventos auditables.
4. **Riesgo comercial**: sin plan/límites no hay monetización controlada.

---

## 7) Roadmap propuesto (implementación incremental)

## Fase 1 (7-10 días) — Fundaciones SaaS
- Incorporar `Tenant` en Prisma y migrar entidades clave (`User`, `Study`).
- Resolver tenant desde JWT/middleware.
- Aplicar filtro obligatorio por tenant en servicios.
- Agregar seed de tenant inicial + superadmin.

**Resultado:** aislamiento de datos operativo.

## Fase 2 (7-10 días) — Auditoría mínima viable
- Crear `AuditEvent` + servicio de escritura central.
- Instrumentar eventos críticos de auth y studies.
- Endpoint de consulta de auditoría con paginación y filtros.

**Resultado:** trazabilidad base para producción.

## Fase 3 (10-14 días) — Administración
- CRUD de usuarios y roles por tenant.
- Panel admin tenant (frontend) para gestión y auditoría.
- Gestión de estado de tenant (activo/suspendido).

**Resultado:** operación delegable al cliente.

## Fase 4 (5-8 días) — Comercialización
- Modelo de plan/suscripción y límites.
- Bloqueos por cuota (usuarios, almacenamiento, etc.).
- Métricas de uso para facturación.

**Resultado:** base de negocio para alquiler recurrente.

---

## 8) Cambios técnicos concretos por capa

### Backend
- Nuevo módulo `admin` y nuevo módulo `audit`.
- Middleware `tenantContext` + `permissionGuard`.
- Logger estructurado (pino/winston) con `requestId`.
- Validaciones Joi para acciones administrativas.

### Base de datos (Prisma)
- Nuevos modelos sugeridos:
  - `Tenant`
  - `AuditEvent`
  - `Permission`
  - `RolePermission` (si avanzás a RBAC granular)
  - `Subscription` / `Plan`

### Frontend
- Sección `/admin` separada por rol y permisos.
- Pantallas iniciales:
  - Gestión de usuarios
  - Configuración tenant
  - Auditoría (tabla + filtros)
  - Estado del plan

---

## 9) KPI para validar que está listo para alquilar

1. 100% de lecturas/escrituras con contexto de `tenantId`.
2. 100% de acciones críticas registradas en `AuditEvent`.
3. 0 endpoints administrativos sin control de permisos granulares.
4. Consulta de auditoría paginada < 400 ms para 50k eventos/tenant.
5. Capacidad de suspender un tenant y bloquear acceso en tiempo real.

---

## 10) Recomendación final

Tu sistema está **maduro para evolucionar a SaaS**, pero no para alquilarse hoy sin riesgo.

La decisión correcta es ejecutar primero **multi-tenant + auditoría + administración** como bloque fundacional. Con eso, pasás de un producto funcional interno a una plataforma comercializable, con control operativo, trazabilidad y base para escalar ventas por suscripción.

---

## 11) Próximo paso sugerido

Comenzar por una **implementación MVP** de 30 días enfocada en:
- `Tenant` + aislamiento de datos,
- `AuditEvent` de eventos críticos,
- Panel admin mínimo (usuarios + auditoría + estado del tenant).

Con ese alcance ya podés iniciar pilotos de alquiler con riesgo significativamente menor.