# 📊 Módulo de Estudios - LabManager

## 📋 Descripción

El módulo de **Estudios** permite gestionar estudios médicos de laboratorio, asignándolos a bioquímicos y permitiendo que pacientes y administradores accedan a ellos con diferentes niveles de permisos.

---

## 🏗️ Arquitectura del Módulo

### Estructura de Carpetas

```
studies/
├── controllers/         # Lógica de controladores HTTP
├── services/           # Lógica de negocio y acceso a datos
├── routes/             # Definición de rutas
├── validators/         # Validación con Joi
├── formatters/         # Formateo de respuestas
├── helpers/            # Utilidades reutilizables
│   ├── response.helper.ts       # Respuestas estandarizadas
│   ├── validation.helper.ts     # Validaciones centralizadas
│   └── permission.helper.ts     # Verificación de permisos
└── index.ts            # Exportación del módulo
```

### Principios Aplicados

- ✅ **Single Responsibility Principle** - Cada clase tiene una única responsabilidad
- ✅ **DRY (Don't Repeat Yourself)** - Código reutilizable en helpers
- ✅ **Separation of Concerns** - Separación clara entre capas
- ✅ **Clean Code** - Código legible y mantenible

---

## 🔐 Roles y Permisos

| Rol | Crear Estudio | Ver Todos | Ver Propios (Bioquímico) | Actualizar Estado | Ver por ID |
|-----|---------------|-----------|---------------------------|-------------------|------------|
| **ADMIN** | ❌ | ✅ | N/A | ✅ | ✅ (todos) |
| **BIOCHEMIST** | ✅ | ❌ | ✅ | ✅ (solo propios) | ✅ (solo asignados) |
| **PATIENT** | ❌ | ❌ | N/A | ❌ | ✅ (solo propios) |

---

## 🚀 API Endpoints

### Base URL
```
http://localhost:3000
```

---

### 1️⃣ **Crear Estudio**

Permite a un bioquímico crear un nuevo estudio para un paciente.

> Nota: En la creación inicial (estado IN_PROGRESS), el estudio se guarda **con bioquímico asignado** al usuario autenticado que realiza la carga y **sin fecha**. El campo `doctor` también queda vacío y se completa en los pasos “Parcial” o “Completo”.

**Endpoint:**
```http
POST /api/studies
```

**Headers:**
```json
{
  "Authorization": "Bearer <token_bioquimico>",
  "Content-Type": "application/json"
}
```

**Body (Creación inicial):**
```json
{
  "dni": "12345678",
  "studyName": "Análisis de Sangre Completo",
  "socialInsurance": "OSDE"
}
```

**Campos:**
- `dni` (requerido): DNI del paciente (8 dígitos)
- `studyName` (requerido): Nombre del estudio (3-255 caracteres)
- `studyDate` (opcional en creación inicial): se define en actualización posterior (parcial/completo)
- `socialInsurance` (opcional): Obra social del paciente
- `pdfUrl` (opcional): URL del PDF con los resultados
- `biochemistId`: se asigna automáticamente al usuario autenticado que crea el estudio.

**Respuesta Exitosa (201):**
```json
{
    "success":true,
    "message":"Estudio creado exitosamente",
    "data":{
        "id":6,
        "studyName":"Análisis de Sangre Completo",
        "studyDate":"2025-10-11T11:00:00.000Z",
        "socialInsurance":"OSDE",
        "pdfUrl":"https://iyhenyjuozfojkhpmpmc.supabase.co/storage/v1/object/public/studies/test.pdf",
        "status":{
            "id":3,
            "name":"IN_PROGRESS"
        },
        "patient":{
            "id":2,
            "dni":"12345678",
            "fullName":"Dr. Carlos López"
        },
        "biochemist":{
            "id":2,
            "fullName":"Dr. Carlos López",
            "license":"BQ001"
        },
        "createdAt":"2025-10-12T05:27:55.172Z",
        "updatedAt":"2025-10-12T05:27:55.172Z"
    }
}
```

**Errores Posibles:**
- `400` - Datos de validación incorrectos
- `404` - Paciente no encontrado
- `500` - Error de configuración (estado IN_PROGRESS no existe)

---

### 2️⃣ **Obtener Lista de Bioquímicos**

Obtiene todos los bioquímicos disponibles en el sistema para asignar estudios.

**Endpoint:**
```http
GET /api/studies/biochemists
```

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Bioquímicos obtenidos exitosamente",
  "data": [
    {
      "id": 2,
      "dni": "87654321",
      "email": "maria.gonzalez@lab.com",
      "license": "MP-12345",
      "profile": {
        "firstName": "María",
        "lastName": "González"
      }
    },
    {
      "id": 5,
      "dni": "11223344",
      "email": "juan.perez@lab.com",
      "license": "MP-67890",
      "profile": {
        "firstName": "Juan",
        "lastName": "Pérez"
      }
    }
  ],
  "count": 2
}
```

---

### 3️⃣ **Obtener Mis Estudios (Bioquímico)**

Obtiene todos los estudios asignados al bioquímico autenticado.

**Endpoint:**
```http
GET /api/studies/biochemist/me
```

**Headers:**
```json
{
  "Authorization": "Bearer <token_bioquimico>"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Estudios obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "studyName": "Análisis de Sangre Completo",
      "studyDate": "2025-10-15T10:00:00.000Z",
      "socialInsurance": "OSDE",
      "pdfUrl": "https://storage.supabase.co/.../abc123.pdf",
      "status": {
        "id": 1,
        "name": "IN_PROGRESS"
      },
      "patient": {
        "id": 5,
        "dni": "12345678",
        "email": "paciente@example.com",
        "profile": {
          "firstName": "Juan",
          "lastName": "Pérez",
          "birthDate": "1990-05-20T00:00:00.000Z"
        }
      },
      "createdAt": "2025-10-11T15:30:00.000Z",
      "updatedAt": "2025-10-11T15:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4️⃣ **Obtener Todos los Estudios (Admin)**

Obtiene todos los estudios del sistema.

**Endpoint:**
```http
GET /api/studies/all
```

**Headers:**
```json
{
  "Authorization": "Bearer <token_admin>"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Todos los estudios obtenidos exitosamente",
  "data": [...],
  "count": 15
}
```

---

### 5️⃣ **Obtener Estudio por ID**

Obtiene un estudio específico (con validación de permisos).

**Permisos:**
- **ADMIN**: Puede ver cualquier estudio
- **BIOCHEMIST**: Solo puede ver estudios asignados a él
- **PATIENT**: Solo puede ver sus propios estudios

**Endpoint:**
```http
GET /api/studies/:id
```

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Ejemplo:**
```http
GET /api/studies/1
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Estudio obtenido exitosamente",
  "data": {
    "id": 1,
    "studyName": "Análisis de Sangre Completo",
    ...
  }
}
```

**Errores Posibles:**
- `400` - ID inválido
- `403` - Sin permisos para ver este estudio
- `404` - Estudio no encontrado

---

### 6️⃣ **Actualizar Estado del Estudio**

Actualiza el estado de un estudio (solo bioquímico asignado o admin).

**Endpoint:**
```http
PATCH /api/studies/:id/status
```

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "statusName": "COMPLETE"
}
```

**Estados Válidos:**
- `IN_PROGRESS` - En progreso
- `PARTIAL` - Parcial
- `COMPLETE` - Completado

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Estado del estudio actualizado exitosamente",
  "data": {
    "id": 1,
    "studyName": "Análisis de Sangre Completo",
    "status": {
      "id": 3,
      "name": "COMPLETE"
    },
  }
}
```

**Errores Posibles:**
- `400` - Estado no válido
- `403` - Sin permisos para actualizar este estudio
- `404` - Estudio no encontrado

---

## 🔄 Estados del Estudio

| Estado | Descripción |
|--------|-------------|
| `IN_PROGRESS` | Estudio recién creado, análisis en curso |
| `PARTIAL` | Resultados parciales disponibles |
| `COMPLETE` | Estudio finalizado, resultados completos |

---