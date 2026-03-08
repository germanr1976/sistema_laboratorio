# Sistema Laboratorio (Monorepo)

Este repositorio contiene dos aplicaciones activas:

- `backend/`: API Express + Prisma
- `frontend/`: Aplicación Next.js

## Estructura activa

- `backend/src`: código fuente del backend
- `backend/prisma`: schema y migraciones activas
- `frontend/src`: código fuente del frontend

## Desarrollo local

Desde la raíz:

```bash
npm run dev
```

Comandos útiles:

```bash
npm run dev:backend
npm run dev:frontend
```

## Notas de orden del repositorio

Se eliminaron carpetas legacy duplicadas para evitar confusión:

- `src/` en raíz (backend antiguo)
- `prisma/` en raíz (migraciones/schema antiguos)
- `frontend/src/app/paciente/src/` (subárbol duplicado)

Usar únicamente los paths activos indicados en este documento.
