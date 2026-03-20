# SEMANA 8 - PERFORMANCE BASELINE Y TUNING INICIAL

Fecha: 19 de marzo de 2026
Estado: EN EJECUCION

---

## 1. Baseline local validado

Comando ejecutado:
- `npm run perf:baseline`

Artefacto generado:
- `reports/performance/baseline-2026-03-19T20-27-42-438Z.json`

Resultados destacados:

| Endpoint | p95 | p99 | Avg | RPS | Success rate |
|---|---:|---:|---:|---:|---:|
| `/api/health` | 123.49 ms | 146.66 ms | 34.42 ms | 467.47 | 100% |
| `/api` | 35.17 ms | 36.78 ms | 17.85 ms | 1092.67 | 100% |

Lectura inicial:
- No se observaron alertas criticas de latencia ni errores en el baseline local.
- El sistema responde dentro del objetivo semanal de referencia (`p95 <= 400 ms`) para los endpoints medidos.

---

## 2. Tuning inicial aplicado

Se agregaron indices compuestos alineados a patrones reales de consulta multi-tenant:

### Studies
- `(tenantId, biochemistId, createdAt)`
- `(tenantId, userId, createdAt)`
- `(tenantId, userId, studyDate)`

Justificacion:
- listados por bioquimico con orden descendente por fecha de creacion,
- historial del paciente con filtros por tenant/usuario y ordenacion,
- consultas de analisis del paciente ordenadas por fecha de estudio.

### StudyRequest
- `(patientId, createdAt)`
- `(status, createdAt)`
- `(validatedByUserId, createdAt)`

Justificacion:
- historial de solicitudes del paciente,
- listados operativos filtrados por estado,
- trazabilidad de validaciones por profesional.

### TenantSubscription
- `(status, updatedAt)`

Justificacion:
- prepara consultas operativas por estado de suscripcion y futuras tareas de control por plan.

---

## 3. Evidencia tecnica

Archivos involucrados:
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260319204000_week8_performance_indexes/migration.sql`
- `scripts/perf-baseline.mjs`

Ejecucion aplicada:
- `npx prisma migrate deploy --schema prisma/schema.prisma` -> OK sobre base local configurada (`lab_local`).

Baseline post-migracion:
- `reports/performance/baseline-2026-03-19T20-45-21-818Z.json`

Resultados destacados post-migracion:

| Endpoint | p95 | p99 | Avg | RPS | Success rate |
|---|---:|---:|---:|---:|---:|
| `/api/health` | 78.83 ms | 103.60 ms | 29.35 ms | 525.80 | 100% |
| `/api` | 24.51 ms | 26.68 ms | 17.79 ms | 1082.99 | 100% |

---

## 4. Proximo paso recomendado

1. Ejecutar esta misma baseline contra staging.
2. Aplicar migracion de indices en staging.
3. Repetir baseline post-migracion y comparar p95/p99.
4. Si aparecen endpoints > 400 ms, perfilar query especifica y reducir payload/joins en listados.