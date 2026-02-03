# Estructura del Proyecto

Este es un monorepo que contiene:

## Frontend
- **Ubicación:** `./frontend/`
- **Tecnología:** Next.js 16.0.0
- **Puerto:** 3001
- **Comandos:**
  - `cd frontend && npm install` - Instalar dependencias
  - `cd frontend && npm run dev` - Iniciar servidor de desarrollo
  - `cd frontend && npm run build` - Build de producción

## Backend
- **Ubicación:** `./backend/`
- **Tecnología:** Node.js + Express + Prisma
- **Comandos:**
  - `cd backend && npm install` - Instalar dependencias
  - `cd backend && npm run dev` - Iniciar servidor de desarrollo

## Comandos desde la raíz
- `npm run dev:frontend` - Inicia solo el frontend
- `npm run dev:backend` - Inicia solo el backend
- `npm run dev` - Inicia ambos simultáneamente
- `npm run install:all` - Instala todas las dependencias

## Estructura de archivos
```
laboratorio__/
├── frontend/          # Aplicación Next.js
│   ├── src/
│   │   ├── app/       # App Router de Next.js
│   │   ├── componentes/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── public/        # Archivos estáticos
│   ├── package.json
│   └── next.config.ts
├── backend/           # API REST con Prisma
│   ├── src/
│   ├── prisma/
│   └── package.json
└── package.json       # Workspace root
```
