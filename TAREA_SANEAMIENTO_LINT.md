# TAREA ESPECÍFICA – SANEAMIENTO DE LINT

Fecha de apertura: 18 de marzo de 2026
Estado: ABIERTA
Prioridad: ALTA
Motivo: el frontend ya tiene configuración ESLint v9 operativa, pero mantiene una deuda previa que impide convertir lint en quality gate bloqueante.

---

## Objetivo

Reducir el ruido de lint heredado hasta dejar `npm run lint -w frontend` en verde y luego incorporarlo al pipeline de CI como compuerta obligatoria.

---

## Estado actual

Comando actual:
- `npm run lint -w frontend`

Resultado:
- Falla por errores históricos no relacionados con la Semana 4.

Tipos de errores detectados:
- `@typescript-eslint/no-explicit-any`
- `react-hooks/set-state-in-effect`
- `react-hooks/exhaustive-deps`
- `react/no-unescaped-entities`
- `@typescript-eslint/no-unused-vars`
- `import/no-anonymous-default-export`

---

## Alcance sugerido

### Fase 1 – Desbloqueo rápido
- Reemplazar `any` en pantallas de login, historial, solicitudes y dashboard paciente.
- Corregir `setState` dentro de `useEffect` en layouts y pantallas de entrada.
- Eliminar imports y variables sin uso.
- Corregir strings con comillas no escapadas.

### Fase 2 – Estabilización
- Revisar dependencias faltantes en hooks (`exhaustive-deps`) y convertir efectos a patrones más correctos.
- Unificar helpers de auth para evitar duplicación entre áreas pública, paciente y plataforma.
- Tipar respuestas API repetidas en frontend.

### Fase 3 – Quality gate
- Ejecutar `npm run lint -w frontend` en verde.
- Agregar el paso de lint al workflow [ .github/workflows/ci.yml ](.github/workflows/ci.yml).
- Bloquear merge si falla lint.

---

## Archivos prioritarios

1. [frontend/src/app/(protected)/layout.tsx](frontend/src/app/(protected)/layout.tsx)
2. [frontend/src/app/paciente/layout.tsx](frontend/src/app/paciente/layout.tsx)
3. [frontend/src/app/platform/(app)/layout.tsx](frontend/src/app/platform/(app)/layout.tsx)
4. [frontend/src/app/(protected)/solicitudes/page.tsx](frontend/src/app/(protected)/solicitudes/page.tsx)
5. [frontend/src/app/(protected)/historial/page.tsx](frontend/src/app/(protected)/historial/page.tsx)
6. [frontend/src/app/login-paciente/page.tsx](frontend/src/app/login-paciente/page.tsx)
7. [frontend/src/app/login-profesional/page.tsx](frontend/src/app/login-profesional/page.tsx)
8. [frontend/src/app/recuperar-contrasena/page.tsx](frontend/src/app/recuperar-contrasena/page.tsx)
9. [frontend/src/app/page.tsx](frontend/src/app/page.tsx)
10. [frontend/src/app/paciente/src/componentes/PatientStudiesBoard.tsx](frontend/src/app/paciente/src/componentes/PatientStudiesBoard.tsx)

---

## Criterio de cierre

La tarea se considera cerrada cuando se cumplan estos 3 puntos:
1. `npm run lint -w frontend` devuelve exit code 0.
2. El workflow de CI vuelve a incluir lint como paso obligatorio.
3. No se introducen `eslint-disable` globales para ocultar deuda sin resolver.
