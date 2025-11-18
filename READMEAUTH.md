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

## Testing con Postman

### 🚀 Setup Inicial

#### Verificar Prerequisitos
```bash
# Verificar que el servidor esté corriendo
npm run dev

# Verificar roles en BD (Prisma Studio)
npx prisma studio
```

#### Roles requeridos en tabla `Role`:
```
| id | name       |
|----|------------|
| 1  | ADMIN      |
| 2  | PATIENT    |
| 3  | BIOCHEMIST |
```

### 📋 Configuración Base en Postman

#### Headers para todas las requests:
```
Content-Type: application/json
Accept: application/json
```

#### Base URL:
```
http://localhost:3000/api/auth
```

### 🧪 Casos de Prueba

#### 1. **Registrar Paciente**
- **Method:** `POST`
- **URL:** `/register-patient`
- **Body:**
```json
{
  "firstName": "Ana",
  "lastName": "García",
  "dni": "87654321",
  "birthDate": "1985-03-20"
}
```
- **Respuesta esperada:** `201 Created`
- **Nota:** No devuelve token (pacientes no necesitan login con password)

#### 2. **Registrar Bioquímico**
- **Method:** `POST`
- **URL:** `/register-biochemist`
- **Body:**
```json
{
  "firstName": "Dr. Carlos",
  "lastName": "López",
  "dni": "12345678",
  "license": "BQ001",
  "email": "carlos@lab.com",
  "password": "password123"
}
```
- **Respuesta esperada:** `201 Created` + **token**
- **Nota:** Devuelve token (auto-login después del registro)

#### 3. **Login Paciente (solo DNI)**
- **Method:** `POST`
- **URL:** `/login`
- **Body:**
```json
{
  "dni": "87654321"
}
```
- **Respuesta esperada:** `200 OK` + **token**

#### 4. **Login Bioquímico (DNI + Password)**
- **Method:** `POST`
- **URL:** `/login`
- **Body:**
```json
{
  "dni": "12345678",
  "password": "password123"
}
```
- **Respuesta esperada:** `200 OK` + **token**

### 🔐 Testing del Middleware (Opcional)

#### Crear ruta de prueba temporal en `auth.routes.ts`:
```typescript
router.get('/me', authMiddleware, (req, res) => {
  res.json({ 
    message: 'Ruta protegida funcionando',
    user: req.user 
  });
});
```

#### Probar ruta protegida:
- **Method:** `GET`
- **URL:** `/me`
- **Headers:**
```
Authorization: Bearer <token-obtenido-del-login>
```
- **Respuesta esperada:** `200 OK` con datos del usuario

### ❌ Casos de Error a Verificar

#### 1. **DNI Duplicado**
```json
{
  "firstName": "Otro",
  "lastName": "Usuario", 
  "dni": "87654321",
  "birthDate": "1990-01-01"
}
```
**Esperado:** `409 Conflict`

#### 2. **Email Duplicado (Bioquímicos)**
```json
{
  "firstName": "Otro",
  "lastName": "Doctor",
  "dni": "99999999",
  "license": "BQ999",
  "email": "carlos@lab.com",
  "password": "123456"
}
```
**Esperado:** `409 Conflict`

#### 3. **Login con Credenciales Incorrectas**
```json
{
  "dni": "12345678",
  "password": "wrongpassword"
}
```
**Esperado:** `401 Unauthorized`

#### 4. **Token Inválido/Expirado**
```
Authorization: Bearer token-invalido-o-expirado
```
**Esperado:** `401 Unauthorized`

### 🔄 Flujo Completo de Testing

#### Orden recomendado:
1. ✅ **Registrar paciente** → Verificar 201
2. ✅ **Registrar bioquímico** → Verificar 201 + token
3. ✅ **Login paciente** → Verificar 200 + token
4. ✅ **Login bioquímico** → Verificar 200 + token
5. ✅ **Probar middleware** (opcional) → Verificar 200 con token
6. ✅ **Casos de error** → Verificar códigos apropiados

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

| Código | Significado | Cuándo aparece |
|--------|-------------|----------------|
| **200** | OK | Login exitoso |
| **201** | Created | Registro exitoso |
| **400** | Bad Request | Datos inválidos/faltantes |
| **401** | Unauthorized | Token inválido, credenciales incorrectas |
| **404** | Not Found | Usuario no encontrado |
| **409** | Conflict | DNI o email duplicado |
| **500** | Internal Error | Error del servidor/BD |

## Consideraciones de Seguridad
- Contraseñas hasheadas con bcrypt salt 12
- JWT con expiración configurable (24h por defecto)
- Validación robusta previene inyecciones SQL
- Transacciones atómicas para consistencia de datos
- Verificación de unicidad en DNI y email
- Headers CORS configurados en Express

## 💡 Tips para Devs

### Automatización con Variables en Postman:
```javascript
// En tab "Tests" del login request:
pm.test("Save token", function () {
    var jsonData = pm.response.json();
    pm.globals.set("authToken", jsonData.data.token);
});

// Usar en headers:
Authorization: Bearer {{authToken}}
```

### Verificar en BD:
Después de cada operación, verificar en Prisma Studio:
- Tabla `User`: Nuevos registros
- Tabla `Profile`: Datos de perfil
- Contraseñas hasheadas en `User.password`

## ✅ Checklist Final

- [ ] Servidor corriendo en puerto 3000
- [ ] Roles creados en BD
- [ ] Headers configurados en Postman
- [ ] Registro de paciente funciona (201)
- [ ] Registro de bioquímico funciona (201 + token)
- [ ] Login de paciente funciona (200 + token)
- [ ] Login de bioquímico funciona (200 + token)
- [ ] Casos de error manejan códigos apropiados
- [ ] Middleware protege rutas correctamente (opcional)

---

**Desarrollado con arquitectura limpia, separación de responsabilidades y mejores prácticas de seguridad Node.js.**



