# Semana 11 — Playbooks de Incidentes

**Fecha:** 19 de marzo de 2026  
**Proyecto:** Sistema de Laboratorio Clínico (SaaS Multi-tenant)  
**Versión del documento:** 1.0

---

## 1. Propósito

Este documento define los playbooks operativos para los tres escenarios de incidente más críticos del sistema. Cada playbook incluye:

- Señales de detección (cómo sabemos que ocurrió)
- Impacto estimado
- Pasos de diagnóstico
- Acciones de mitigación
- Criterio de resolución
- Responsable / escalamiento

---

## 2. Playbooks

### 2.1 Backend no responde (instancia caída)

**Severidad:** CRÍTICA  
**Tiempo objetivo de respuesta (RTO):** < 15 min  

#### Señales de detección
- `GET /api/health` → timeout o `ECONNREFUSED`
- Script `npm run incident:drill` → SCENARIO-1 pasa, SCENARIO-2 falla con error de conexión
- Monitoreo externo (UptimeRobot / BetterStack) publica alerta "DOWN"

#### Impacto
- Todos los tenants sin servicio
- Frontend muestra errores de red
- Nuevos estudios no pueden cargarse

#### Pasos de diagnóstico

```bash
# 1. Verificar conectividad básica
curl -v https://TU_BACKEND_URL/api/health

# 2. Revisar logs del proceso en la plataforma (Render / Railway)
#    → Buscar: OOM Killer, crash loop, puerto en uso

# 3. Ejecutar simulacro local
npm run incident:drill
```

#### Acciones de mitigación

| Paso | Acción | Herramienta |
|------|--------|-------------|
| 1 | Reiniciar el servicio web | Panel de Render → Manual Deploy |
| 2 | Verificar que la variable `DATABASE_URL` está seteada | Render → Environment |
| 3 | Correr `npm run rollback:drill` contra la URL previa si el reinicio no resuelve | Terminal |
| 4 | Si la DB es el problema → ver Playbook 2.2 | — |

#### Criterio de resolución
`GET /api/health` devuelve `200 { success: true }` y `npm run incident:drill` pasa SCENARIO-2 y SCENARIO-3.

---

### 2.2 Base de datos degradada o inaccesible

**Severidad:** CRÍTICA  
**Tiempo objetivo de respuesta (RTO):** < 20 min  

#### Señales de detección
- `GET /api/health` responde 200 pero queries lentas (p95 > 2000ms en `npm run perf:baseline`)
- Logs de backend muestran `P1001: Can't reach database server` o `P1017: Server closed the connection`
- `npm run incident:drill` → SCENARIO-2 falla (health OK pero uptime anómalo)

#### Impacto
- Tiempo de respuesta degradado o errores 500 en operaciones de lectura/escritura
- Posible pérdida de datos si la DB es PostgreSQL en Neon/Supabase con pausa automática

#### Pasos de diagnóstico

```bash
# 1. Verificar que la DB acepta conexiones (desde máquina local con acceso)
psql "$DATABASE_URL" -c "SELECT 1;"

# 2. Verificar migraciones pendientes
cd backend && npx prisma migrate status

# 3. Verificar uso de conexiones (pool)
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity WHERE state='active';"
```

#### Acciones de mitigación

| Situación | Acción |
|-----------|--------|
| DB pausada (Neon/Supabase free tier) | Entrar al panel y reanudar manualmente |
| Migración pendiente | `cd backend && npx prisma migrate deploy` |
| Pool de conexiones agotado | Reiniciar el servicio web para liberar conexiones |
| `DATABASE_URL` incorrecta o expirada | Actualizar env var en la plataforma y redes de conexión |

#### Criterio de resolución
`psql $DATABASE_URL -c "SELECT 1;"` devuelve `1` y `npm run perf:baseline` muestra p95 < 400ms en `/api/health`.

---

### 2.3 Brecha de autenticación / endpoint expuesto sin token

**Severidad:** ALTA  
**Tiempo objetivo de respuesta (RTO):** < 10 min (acción inmediata)  

#### Señales de detección
- `npm run incident:drill` → SCENARIO-3 falla (HTTP 200 en lugar de 401/403)
- Logs muestran requests sin `Authorization` header llegando a endpoints protegidos
- Revisión de código detecta middleware `authMiddleware` omitido en una ruta

#### Impacto
- Exposición de datos clínicos de pacientes
- Incumplimiento regulatorio
- Posible violación de privacidad

#### Pasos de diagnóstico

```bash
# 1. Verificar que el endpoint rechaza requests sin token
curl -v https://TU_BACKEND_URL/api/studies/biochemist/me
# Esperado: 401

# 2. Revisar las rutas registradas
grep -r "router\." backend/src/modules --include="*.routes.ts" | grep -v "authMiddleware"

# 3. Ejecutar suite de tests de autorización
npm run test:authz:backend
```

#### Acciones de mitigación

| Paso | Acción |
|------|--------|
| 1 | Identificar la ruta expuesta comparando grep con rutas que sí tienen `authMiddleware` |
| 2 | Agregar `authMiddleware` y el guard de rol correcto en la ruta afectada |
| 3 | Agregar test de autorización para ese endpoint (`CP-STUDY-XX`) |
| 4 | Deploy de emergencia con la corrección |
| 5 | Verificar con `npm run incident:drill` que SCENARIO-3 pasa |

#### Criterio de resolución
`GET /api/studies/biochemist/me` sin token → `401`. `npm run incident:drill` pasa los 3 escenarios críticos. `npm run test:authz:backend` en verde.

---

## 3. Simulacro ejecutable

El script `scripts/incident-drill.mjs` ejecuta los tres escenarios de forma automatizada:

```bash
# Contra el backend local
npm run incident:drill

# Contra staging (cuando haya URL)
DRILL_BASE_URL=https://TU_BACKEND_URL npm run incident:drill
```

### Resultado esperado con backend levantado

```
══════════════════════════════════════════
  SIMULACRO DE INCIDENTES — Semana 11
  Target: http://localhost:3000
══════════════════════════════════════════

── SCENARIO-1: Backend no responde / timeout
  ✔ Detectado correctamente: conexión fallida

── SCENARIO-2: Health check del backend
  ✔ HTTP 200
  ✔ body.success === true
  ✔ body.uptimeSeconds presente
  ✔ body.timestamp presente

── SCENARIO-3: Guard de autenticación activo
  ✔ HTTP 401 (esperado 401/403)
  ✔ No expone datos sin token (≠ 200)

══════════════════════════════════════════
  RESULTADO: 3/3 escenarios OK
══════════════════════════════════════════
```

> **Nota:** SCENARIO-1 pasa cuando el backend **sí** está levantado (porque detecta correctamente que el puerto alternativo no responde). Exit code 0 si SCENARIO-2 y SCENARIO-3 pasan. Exit code 1 si alguno de los dos críticos falla.

---

## 4. Escalamiento

| Nivel | Condición | Contacto |
|-------|-----------|----------|
| L1 — Autoresolución | Reinicio de instancia resuelve en < 5 min | — |
| L2 — Equipo técnico | Problema de DB, migración o código | Dev responsable de guardia |
| L3 — Plataforma | Fallo en Render/Railway/Neon (fuera de nuestro control) | Abrir ticket en la plataforma + comunicar a tenants |

---

## 5. Checklists post-incidente

Luego de resolver cualquier incidente Severo/Crítico:

- [ ] Guardar reporte del drill (`reports/incidents/incident-drill-*.json`)
- [ ] Documentar causa raíz en `PROGRESO_EJECUCION.md`
- [ ] Verificar que el CI (`npm run ci`) sigue en verde
- [ ] Evaluar si el incidente desvela un riesgo no cubierto en `SEMANA1_MATRIZ_RIESGOS.md`
- [ ] Actualizar este playbook si los pasos resultaron insuficientes
