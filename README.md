# Sistema de Gestión de Laboratorio Químico 🧪

Sistema web para la gestión integral de estudios médicos en laboratorios químicos. Permite registrar pacientes, solicitar estudios, gestionar muestras y registrar resultados.

## Características

✅ **Gestión de Pacientes**: Registro y administración de información de pacientes  
✅ **Gestión de Estudios**: Crear, actualizar y rastrear estudios médicos  
✅ **Sistema de Usuarios**: Autenticación con roles (Admin, Técnico, Usuario)  
✅ **Estados de Estudios**: Seguimiento del flujo de trabajo (Pendiente, En Proceso, Completado, Cancelado)  
✅ **Prioridades**: Gestión de urgencias (Urgente, Normal, Baja)  
✅ **Tipos de Estudios**: Catálogo de análisis disponibles con tiempos de resultado  
✅ **Dashboard**: Visualización de estadísticas y estudios recientes  
✅ **Interfaz Responsiva**: Diseño adaptable a diferentes dispositivos

## Tecnologías Utilizadas

- **Backend**: Python 3.x + Flask
- **Base de Datos**: SQLite (SQLAlchemy ORM)
- **Autenticación**: Flask-Login
- **Frontend**: HTML5, CSS3 (diseño responsivo)
- **Seguridad**: Werkzeug (hash de contraseñas)

## Instalación

### Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/germanr1976/sistema_laboratorio.git
cd sistema_laboratorio
```

2. **Crear entorno virtual** (recomendado)
```bash
python -m venv venv

# En Linux/Mac:
source venv/bin/activate

# En Windows:
venv\Scripts\activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno** (opcional)
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

5. **Inicializar la base de datos**
```bash
python init_db.py
```

Este comando creará la base de datos con datos de ejemplo:
- 2 usuarios (admin, tecnico)
- 8 tipos de estudios médicos
- 5 pacientes de ejemplo
- 5 estudios de muestra

## Uso

### Iniciar el Servidor

```bash
python app.py
```

El servidor estará disponible en: `http://localhost:5000`

### Credenciales de Acceso

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Técnico:**
- Usuario: `tecnico`
- Contraseña: `tecnico123`

### Funcionalidades Principales

#### 1. Dashboard
- Visualización de estadísticas generales
- Contador de estudios por estado
- Lista de estudios recientes
- Accesos rápidos a funciones principales

#### 2. Gestión de Estudios
- **Crear Nuevo Estudio**: Seleccionar paciente, tipo de estudio y prioridad
- **Listar Estudios**: Ver todos los estudios con filtros por estado
- **Ver Detalle**: Información completa del estudio y paciente
- **Actualizar Estado**: Cambiar estado y registrar resultados

#### 3. Gestión de Pacientes
- **Registrar Paciente**: Datos personales y de contacto
- **Listar Pacientes**: Ver todos los pacientes registrados
- **Historial**: Cantidad de estudios por paciente

#### 4. Tipos de Estudios Disponibles
- Hemograma Completo (HMG)
- Glucemia (GLU)
- Colesterol Total (COL)
- Orina Completa (ORI)
- Hormona Tiroidea TSH (TSH)
- Creatinina (CRE)
- Transaminasas TGO/TGP (TGO)
- Proteína C Reactiva (PCR)

## Estructura del Proyecto

```
sistema_laboratorio/
├── app.py                  # Aplicación principal Flask
├── models.py              # Modelos de base de datos
├── routes.py              # Rutas y vistas
├── init_db.py             # Script de inicialización de BD
├── requirements.txt       # Dependencias Python
├── .env.example          # Ejemplo de variables de entorno
├── .gitignore            # Archivos ignorados por Git
├── README.md             # Este archivo
├── static/
│   └── css/
│       └── style.css     # Estilos CSS
└── templates/            # Plantillas HTML
    ├── base.html
    ├── login.html
    ├── dashboard.html
    └── estudios/
        ├── listar.html
        ├── nuevo.html
        ├── ver.html
        ├── pacientes.html
        └── nuevo_paciente.html
```

## Flujo de Trabajo

1. **Registro de Paciente**: Ingresar datos del paciente en el sistema
2. **Solicitud de Estudio**: Crear nuevo estudio seleccionando paciente y tipo
3. **Toma de Muestra**: Marcar estudio como "En Proceso"
4. **Análisis**: Procesar la muestra en el laboratorio
5. **Registro de Resultados**: Actualizar el estudio con los resultados
6. **Finalización**: Marcar como "Completado" con fecha de resultado

## Modelos de Datos

### Usuario
- Autenticación y autorización
- Roles: admin, tecnico, usuario
- Registro de estudios creados

### Paciente
- Datos personales
- Información de contacto
- Historial de estudios

### TipoEstudio
- Código y nombre del estudio
- Descripción y precio
- Tiempo estimado de resultado

### Estudio
- Número de orden único
- Paciente y tipo de estudio
- Estados y prioridades
- Observaciones y resultados
- Fechas de solicitud y resultado

## Seguridad

- ✅ Contraseñas hasheadas con Werkzeug
- ✅ Autenticación requerida para todas las rutas principales
- ✅ Sesiones seguras con Flask-Login
- ✅ Validación de formularios
- ✅ Variables de entorno para configuración sensible

## Personalización

### Cambiar Puerto del Servidor
Editar `app.py`, línea final:
```python
app.run(debug=True, host='0.0.0.0', port=PUERTO_DESEADO)
```

### Agregar Nuevos Tipos de Estudios
Ejecutar en consola Python:
```python
from app import create_app, db
from models import TipoEstudio

app = create_app()
with app.app_context():
    nuevo_tipo = TipoEstudio(
        codigo='XXX',
        nombre='Nombre del Estudio',
        descripcion='Descripción',
        precio=1000.0,
        tiempo_resultado=24
    )
    db.session.add(nuevo_tipo)
    db.session.commit()
```

## Desarrollo Futuro

Posibles mejoras:
- [ ] Exportación de resultados a PDF
- [ ] Envío de notificaciones por email
- [ ] API REST para integración
- [ ] Gráficos y reportes estadísticos
- [ ] Gestión de inventario de reactivos
- [ ] Sistema de facturación
- [ ] Agenda de turnos
- [ ] Firma digital de resultados

## Soporte

Para reportar problemas o sugerencias, por favor crear un issue en el repositorio de GitHub.

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Autor

Germán R. - 2026

---

**Sistema de Gestión de Laboratorio Químico** 🧪 - Simplificando la gestión de estudios médicos
