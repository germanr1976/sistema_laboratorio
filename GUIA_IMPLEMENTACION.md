# GUIA DE IMPLEMENTACION - TABLERO DE EJECUCION

Fecha: 13 de marzo de 2026
Version: 1.0

Objetivo:
- convertir el plan estrategico en seguimiento operativo semanal,
- alinear a Producto, Backend, Frontend, DevOps y Seguridad/QA,
- y facilitar control de avance, riesgos y decisiones Go/No-Go.

---

## 1. Como usar este tablero

Frecuencia recomendada:
- seguimiento semanal (60 minutos),
- checkpoint de riesgo de 15 minutos a mitad de semana.

Reglas de estado:
- No iniciado: aun no se comenzo.
- En progreso: en ejecucion activa.
- Bloqueado: requiere decision o dependencia externa.
- Completado: cumple criterio de aceptacion acordado.

Campos minimos por item:
- responsable,
- fecha objetivo,
- evidencia (PR, test, dashboard, acta),
- riesgo actual,
- estado.

---

## 2. Tablero maestro (12 semanas)

| Semana | Objetivo | Equipo lider | Entregable verificable | Estado | Riesgo principal |
|---|---|---|---|---|---|
| 1 | Cerrar alcance y riesgos | Producto | Roadmap 90 dias y matriz de riesgo aprobada | No iniciado | Desalineacion de prioridades |
| 2 | Corregir incoherencias de permisos UX/API | Backend + Frontend | 0 acciones visibles no autorizadas por backend | No iniciado | Regresiones por cambios de acceso |
| 3 | Hardening inicial de autenticacion | Backend + Seguridad | Rate limiting activo en login/recovery/admin | No iniciado | Impacto en usuarios legitimos |
| 4 | Base de testing automatizado | QA + Backend + Frontend | Pipeline bloquea merge si fallan tests criticos | No iniciado | Cobertura insuficiente |
| 5 | Observabilidad tecnica minima | DevOps + Backend | Dashboard con error rate, latencia y volumen | No iniciado | Telemetria incompleta |
| 6 | Permisos granulares en administracion | Backend | Enforcement por permission key en admin | No iniciado | Complejidad de migracion de permisos |
| 7 | Permisos granulares en operacion clinica | Backend + Frontend | Matriz de autorizacion validada por pruebas | No iniciado | Casos edge no cubiertos |
| 8 | Performance baseline y tuning inicial | Backend + DevOps | Reporte p95/p99 y mejoras aplicadas | No iniciado | Cuellos de botella en DB |
| 9 | Despliegue seguro y rollback probado | DevOps | Procedimiento de rollback validado en staging | No iniciado | Fallas en release |
| 10 | Reglas de cuota y limites por plan | Producto + Backend | Limites por plan activos y testeados | No iniciado | Impacto comercial no previsto |
| 11 | Playbooks de incidentes | DevOps + Seguridad | Simulacro de incidente ejecutado | No iniciado | Respuesta lenta ante incidentes |
| 12 | Cierre Go/No-Go | Todos | Acta final con decision y plan de rollout | No iniciado | Criterios de salida no cumplidos |

---

## 3. Backlog operativo por frente

## 3.1 Producto

| Item | Criterio de aceptacion | Prioridad | Estado |
|---|---|---|---|
| Matriz de capacidades por plan | Cada plan define limites y permisos claros | Alta | No iniciado |
| Politica de errores al usuario | Mensajes claros y accionables por escenario | Alta | No iniciado |
| Criterios Go/No-Go | Checklist firmado por todos los frentes | Alta | No iniciado |

## 3.2 Backend

| Item | Criterio de aceptacion | Prioridad | Estado |
|---|---|---|---|
| Rate limiting y anti abuso | Login y endpoints sensibles protegidos | Alta | No iniciado |
| Permission guard completo | Endpoints criticos con permisos granulares | Alta | No iniciado |
| Optimizacion de consultas | p95 dentro de umbral definido | Media | No iniciado |

## 3.3 Frontend

| Item | Criterio de aceptacion | Prioridad | Estado |
|---|---|---|---|
| UX por rol consistente | No se muestran acciones sin permiso | Alta | No iniciado |
| Manejo uniforme de errores | Mensajes estandar y comprensibles | Alta | No iniciado |
| Flujos admin completos | Operaciones frecuentes sin friccion | Media | No iniciado |

## 3.4 DevOps

| Item | Criterio de aceptacion | Prioridad | Estado |
|---|---|---|---|
| Pipeline con quality gates | Build + tests + checks obligatorios | Alta | No iniciado |
| Observabilidad y alertas | Dashboard operativo y alertas activas | Alta | No iniciado |
| Runbooks de release/rollback | Procedimiento probado y documentado | Alta | No iniciado |

## 3.5 Seguridad y QA

| Item | Criterio de aceptacion | Prioridad | Estado |
|---|---|---|---|
| Suite de pruebas criticas | Auth, permisos y tenant isolation cubiertos | Alta | No iniciado |
| Validacion de hardening | Sin hallazgos criticos abiertos | Alta | No iniciado |
| Pruebas E2E por rol | Flujos clave pasan sin regresiones | Media | No iniciado |

---

## 4. KPIs de seguimiento semanal

| KPI | Meta objetivo | Frecuencia |
|---|---|---|
| Historias criticas completadas | >= 85% por sprint semanal | Semanal |
| Endpoints criticos con tests | >= 70% al cierre de fase A | Semanal |
| Error rate en staging | <= 1% en escenarios principales | Semanal |
| p95 endpoints principales | <= 400 ms | Semanal |
| Hallazgos criticos de seguridad abiertos | 0 | Semanal |
| MTTR incidentes prioritarios | <= 2 horas | Semanal |

---

## 5. Criterios de avance de fase

Paso de Fase A a Fase B:
- permisos UX/API coherentes,
- hardening inicial activo,
- pipeline con pruebas criticas.

Paso de Fase B a Fase C:
- permisos granulares en modulos clave,
- observabilidad operativa funcionando,
- reporte de seguridad sin criticos abiertos.

Cierre final (Go):
- criterios de ANALISIS_SISTEMA.md cumplidos,
- acta de salida firmada,
- plan de rollout y soporte activo.

---

## 6. Checklist operativo listo para usar

Instruccion de uso:
- duplicar la tabla semanal al inicio de cada semana,
- actualizar estado en tiempo real,
- y adjuntar evidencia concreta por cada item (PR, test, dashboard, acta).

Estados validos:
- No iniciado
- En progreso
- Bloqueado
- Completado

## 6.1 Plantilla semanal (copiar y completar)

| Semana | Item | Responsable | Fecha objetivo | Estado | Evidencia | Riesgo actual | Proximo paso |
|---|---|---|---|---|---|---|---|
| _N_ | _Definir alcance y riesgos_ | _Producto_ | _AAAA-MM-DD_ | No iniciado | _Link PR/Doc_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Permisos UI/backend coherentes_ | _Backend + Frontend_ | _AAAA-MM-DD_ | No iniciado | _Link PR/Test_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Hardening auth (rate limiting)_ | _Backend + Seguridad_ | _AAAA-MM-DD_ | No iniciado | _Link test QA_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Testing automatizado en pipeline_ | _QA + DevOps_ | _AAAA-MM-DD_ | No iniciado | _Link CI_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Observabilidad base (logs + dashboard)_ | _DevOps + Backend_ | _AAAA-MM-DD_ | No iniciado | _Link dashboard_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Permisos granulares admin/clinico_ | _Backend_ | _AAAA-MM-DD_ | No iniciado | _Link PR/Test_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Performance (p95/p99)_ | _Backend + DevOps_ | _AAAA-MM-DD_ | No iniciado | _Link reporte_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Release seguro + rollback_ | _DevOps_ | _AAAA-MM-DD_ | No iniciado | _Link runbook_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Cuotas y limites por plan_ | _Producto + Backend_ | _AAAA-MM-DD_ | No iniciado | _Link validacion_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Playbooks y simulacro_ | _DevOps + Seguridad_ | _AAAA-MM-DD_ | No iniciado | _Link acta_ | _Bajo/Medio/Alto_ | _Accion concreta_ |
| _N_ | _Go/No-Go final_ | _Todos_ | _AAAA-MM-DD_ | No iniciado | _Link acta final_ | _Bajo/Medio/Alto_ | _Accion concreta_ |

## 6.2 Checklist semanal de control (tildable)

- [ ] Se realizo reunion semanal de seguimiento (60 min).
- [ ] Se realizo checkpoint de riesgo de mitad de semana (15 min).
- [ ] Hay responsables y fechas objetivo en todos los items activos.
- [ ] Cada item en progreso tiene evidencia asociada.
- [ ] Se actualizaron bloqueos y dependencias externas.
- [ ] Se revisaron KPIs semanales (cobertura, error rate, p95, hallazgos, MTTR).
- [ ] Se definio accion correctiva para cada KPI fuera de meta.
- [ ] Se validaron criterios de avance de fase vigentes.

## 6.3 Checklist de salida (Semana 12)

- [ ] 100% endpoints criticos con validacion tenant + permisos.
- [ ] Rate limiting activo en auth y acciones sensibles.
- [ ] 0 vulnerabilidades criticas abiertas.
- [ ] Cobertura objetivo alcanzada en modulos core.
- [ ] Pipeline con quality gates obligatorios en rama principal.
- [ ] Dashboards y alertas con responsables definidos.
- [ ] Onboarding de tenant repetible sin intervencion tecnica manual.
- [ ] Acta Go/No-Go firmada y plan de rollout aprobado.
