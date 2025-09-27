# Auth Module - Sistema de Autenticación JWT

## Descripción General
Sistema de autenticación completo con JWT para LabManager que maneja dos tipos de usuarios: **Pacientes** (autenticación solo con DNI) y **Bioquímicos** (autenticación con DNI + contraseña). Implementa registro diferenciado, login con roles y middleware de protección de rutas.

## Stack Tecnológico
- **Node.js + Express + TypeScript**
- **Prisma ORM** con PostgreSQL (Supabase)
- **JWT** para autenticación stateless
- **bcrypt** para hash de contraseñas
- **Joi** para validación de datos

## Arquitectura Implementada

```
src/modules/auth/
├── controllers/auth.controllers.ts    # Lógica HTTP y orquestación
├── services/auth.services.ts          # Funciones puras (JWT, bcrypt)
├── validators/                        # Validación Joi por entidad
├── middlewares/auth.middleware.ts     # Protección de rutas JWT
├── routes/auth.routes.ts             # Definición endpoints
├── types/express.d.ts               # Extensión tipos Express
└── index.ts                         # Interfaces y constantes
```

## Funcionalidades Core

### 🔐 Autenticación Diferenciada
```typescript
// PACIENTES: Solo DNI
POST /api/auth/login { "dni": "12345678" }

// BIOQUÍMICOS: DNI + Password
POST /api/auth/login { "dni": "12345678", "password": "secret123" }
```

### 🛡️ Servicios de Seguridad
- **`hashPassword()`**: bcrypt con salt 12 configurable
- **`comparePassword()`**: Verificación segura de contraseñas
- **`generateToken()`**: JWT con payload completo del usuario
- **`verifyToken()`**: Validación y decodificación de tokens

### 🎯 Middleware de Protección
```typescript
// Aplica automáticamente a rutas protegidas
router.get('/protected', authMiddleware, controller);

// req.user disponible con datos completos
req.user.id, req.user.dni, req.user.role.name, req.user.profile
```

## API Endpoints

### POST /api/auth/register-biochemist
```json
{
  "firstName": "Dr. Juan",
  "lastName": "Pérez",
  "dni": "12345678",
  "license": "BQ123456", 
  "email": "juan@lab.com",
  "password": "12345678"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "BIOCHEMIST registrado exitosamente",
  "data": {
    "id": 1,
    "dni": "12345678",
    "role": "BIOCHEMIST",
    "profile": { "firstName": "Dr. Juan", "lastName": "Pérez" }
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /api/auth/register-patient
```json
{
  "firstName": "María",
  "lastName": "González",
  "dni": "87654321",
  "birthDate": "1990-05-15"
}
```

**Response (201):** Sin token, solo confirmación de registro.

### POST /api/auth/login
```json
// Bioquímico
{ "dni": "12345678", "password": "12345678" }

// Paciente  
{ "dni": "87654321" }
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "dni": "12345678", 
      "role": "BIOCHEMIST",
      "profile": { "firstName": "Dr. Juan", "lastName": "Pérez" }
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Setup y Configuración

### Variables de Entorno (.env)
```bash
# JWT Configuration
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Security  
BCRYPT_SALT_ROUNDS="12"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="5"

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### Prerequisitos de Base de Datos
```sql
-- Roles requeridos en tabla Role
INSERT INTO "Role" (name) VALUES 
('PATIENT'), ('BIOCHEMIST'), ('ADMIN');
```

### Instalación y Pruebas
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Prisma
npx prisma generate
npx prisma db push

# 3. Levantar servidor
npm run dev

# 4. Crear roles en Prisma Studio
npx prisma studio
```

## Testing con Cliente HTTP

### Thunder Client / Postman
**Base URL:** `http://localhost:3000/api/auth`

#### 1. Registrar Bioquímico
```http
POST /register-biochemist
Content-Type: application/json

{
  "firstName": "Dr. Carlos",
  "lastName": "López", 
  "dni": "11111111",
  "license": "BQ001", 
  "email": "carlos@lab.com",
  "password": "password123"
}
```

#### 2. Registrar Paciente
```http
POST /register-patient
Content-Type: application/json

{
  "firstName": "Ana",
  "lastName": "Martín",
  "dni": "22222222",
  "birthDate": "1985-03-20"
}
```

#### 3. Login y obtener JWT
```http
POST /login
Content-Type: application/json

// Bioquímico
{ "dni": "11111111", "password": "password123" }

// Paciente
{ "dni": "22222222" }
```

## Integración Frontend

### Manejo de Tokens
```javascript
// 1. Guardar token después del login
localStorage.setItem('authToken', response.data.token);

// 2. Incluir en requests posteriores
const token = localStorage.getItem('authToken');
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// 3. Interceptor para requests automáticos
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Estados de Usuario
```javascript
// Decodificar JWT para obtener datos del usuario
const getUserFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      dni: payload.dni,
      role: payload.roleName
    };
  } catch (error) {
    return null;
  }
};
```

### Manejo de Errores
```javascript
const handleAuthErrors = (error) => {
  switch (error.response?.status) {
    case 401:
      // Token inválido/expirado - redirect a login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      break;
    case 409:
      // DNI/Email duplicado
      showError('Usuario ya registrado');
      break;
    case 400:
      // Datos inválidos
      showError('Revisa los datos ingresados');
      break;
  }
};
```

### Rutas Protegidas (React Router)
```javascript
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('authToken');
  const user = getUserFromToken(token);
  
  if (!token || !user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Uso
<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['BIOCHEMIST']}>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Validaciones Implementadas

### Joi Schemas
- **Login**: DNI (8-18 chars, alphanum) + password opcional
- **Bioquímico**: Todos los campos requeridos + email válido + password min 8 chars
- **Paciente**: Datos básicos + birthDate formato ISO

### Middleware de Protección
- Extrae JWT del header `Authorization: Bearer <token>`
- Verifica validez y decodifica payload
- Busca usuario en BD con relaciones (Profile, Role)
- Inyecta `req.user` completo para controladores
- Maneja errores: missing, invalid, expired tokens

## Códigos de Estado HTTP
- **200**: Login exitoso
- **201**: Registro exitoso
- **400**: Datos inválidos
- **401**: No autorizado (token/credenciales inválidas)
- **404**: Usuario no encontrado
- **409**: DNI/Email duplicado
- **500**: Error interno del servidor

## Consideraciones de Seguridad
- Contraseñas hasheadas con bcrypt salt 12
- JWT con expiración configurable (24h por defecto)
- Validación robusta previene inyecciones SQL
- Transacciones atómicas para consistencia de datos
- Verificación de unicidad en DNI y email
- Headers CORS configurados en Express



---

**Desarrollado con arquitectura limpia, separación de responsabilidades y mejores prácticas de seguridad Node.js.**