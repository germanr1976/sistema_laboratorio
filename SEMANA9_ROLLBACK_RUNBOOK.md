# SEMANA 9 - RUNBOOK DE ROLLBACK

Fecha: 19 de marzo de 2026
Estado: EN EJECUCION

---

## 1. Objetivo

Validar que una version actual y una version candidata a rollback cumplan chequeos minimos de salud antes de ejecutar o aprobar una reversión en staging/produccion.

---

## 2. Herramientas disponibles

- Script local: `npm run rollback:drill`
- Workflow manual: `.github/workflows/rollback-drill.yml`
- Reportes generados: `reports/rollback/rollback-drill-<timestamp>.json`

---

## 3. Inputs requeridos

- `ROLLBACK_FROM_URL`: URL de la version actualmente desplegada.
- `ROLLBACK_TO_URL`: URL de la version anterior o candidata a rollback.

Ejemplo local:

```powershell
$env:ROLLBACK_FROM_URL='https://lab-staging-v2.example.com'
$env:ROLLBACK_TO_URL='https://lab-staging-v1.example.com'
npm run rollback:drill
```

---

## 4. Checks ejecutados

En ambos entornos:
- `GET /api/health` debe responder `200`
- `GET /api/studies/biochemist/me` sin token debe responder `401`

Razon:
- garantiza salud minima de API,
- valida que el guard de autenticacion siga activo tras el despliegue o rollback.

---

## 5. Criterio de exito

El drill se considera exitoso cuando:
- los dos endpoints responden con el status esperado en ambos entornos,
- se genera reporte JSON con timestamp,
- el resultado queda adjuntado en evidencia de release.

---

## 6. Evidencia minima a adjuntar

1. URL origen evaluada.
2. URL objetivo de rollback evaluada.
3. Salida del workflow o comando.
4. Archivo `reports/rollback/rollback-drill-<timestamp>.json`.
5. Decision final: rollback aprobado / rollback no aprobado.

---

## 7. Proximo endurecimiento recomendado

1. Agregar chequeo de version o build ID en `/api/health`.
2. Incorporar smoke de endpoint critico autenticado con credencial tecnica de staging.
3. Ejecutar drill automatico como paso previo a releases de riesgo alto.