"""
Initialize database with sample data
"""
from datetime import datetime, timedelta
from app import create_app
from extensions import db
from models import Usuario, Paciente, TipoEstudio, Estudio

def init_database():
    """Initialize database with sample data"""
    app = create_app()
    
    with app.app_context():
        # Drop all tables and recreate
        print("Creando tablas de base de datos...")
        db.drop_all()
        db.create_all()
        
        # Create users
        print("Creando usuarios...")
        admin = Usuario(
            username='admin',
            email='admin@laboratorio.com',
            nombre='Administrador del Sistema',
            rol='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        
        tecnico = Usuario(
            username='tecnico',
            email='tecnico@laboratorio.com',
            nombre='Técnico de Laboratorio',
            rol='tecnico'
        )
        tecnico.set_password('tecnico123')
        db.session.add(tecnico)
        
        # Create study types
        print("Creando tipos de estudios...")
        tipos_estudio = [
            TipoEstudio(
                codigo='HMG',
                nombre='Hemograma Completo',
                descripcion='Análisis completo de células sanguíneas',
                precio=1500.0,
                tiempo_resultado=24
            ),
            TipoEstudio(
                codigo='GLU',
                nombre='Glucemia',
                descripcion='Medición de glucosa en sangre',
                precio=800.0,
                tiempo_resultado=12
            ),
            TipoEstudio(
                codigo='COL',
                nombre='Colesterol Total',
                descripcion='Medición de colesterol en sangre',
                precio=900.0,
                tiempo_resultado=24
            ),
            TipoEstudio(
                codigo='ORI',
                nombre='Orina Completa',
                descripcion='Análisis completo de orina',
                precio=700.0,
                tiempo_resultado=24
            ),
            TipoEstudio(
                codigo='TSH',
                nombre='Hormona Tiroidea (TSH)',
                descripcion='Medición de hormona estimulante de tiroides',
                precio=1200.0,
                tiempo_resultado=48
            ),
            TipoEstudio(
                codigo='CRE',
                nombre='Creatinina',
                descripcion='Función renal - Creatinina sérica',
                precio=850.0,
                tiempo_resultado=24
            ),
            TipoEstudio(
                codigo='TGO',
                nombre='Transaminasas (TGO/TGP)',
                descripcion='Función hepática',
                precio=1100.0,
                tiempo_resultado=24
            ),
            TipoEstudio(
                codigo='PCR',
                nombre='Proteína C Reactiva',
                descripcion='Marcador de inflamación',
                precio=950.0,
                tiempo_resultado=24
            ),
        ]
        
        for tipo in tipos_estudio:
            db.session.add(tipo)
        
        # Create sample patients
        print("Creando pacientes de ejemplo...")
        pacientes = [
            Paciente(
                nombre='Juan',
                apellido='Pérez',
                documento='12345678',
                telefono='1123456789',
                email='juan.perez@email.com',
                direccion='Av. Corrientes 1234, CABA'
            ),
            Paciente(
                nombre='María',
                apellido='González',
                documento='23456789',
                telefono='1134567890',
                email='maria.gonzalez@email.com',
                direccion='Av. Rivadavia 5678, CABA'
            ),
            Paciente(
                nombre='Carlos',
                apellido='Rodríguez',
                documento='34567890',
                telefono='1145678901',
                email='carlos.rodriguez@email.com',
                direccion='Av. Santa Fe 9012, CABA'
            ),
            Paciente(
                nombre='Ana',
                apellido='Martínez',
                documento='45678901',
                telefono='1156789012',
                email='ana.martinez@email.com',
                direccion='Av. Cabildo 3456, CABA'
            ),
            Paciente(
                nombre='Luis',
                apellido='Fernández',
                documento='56789012',
                telefono='1167890123',
                email='luis.fernandez@email.com',
                direccion='Av. Belgrano 7890, CABA'
            ),
        ]
        
        for paciente in pacientes:
            db.session.add(paciente)
        
        db.session.commit()
        
        # Create sample studies
        print("Creando estudios de ejemplo...")
        now = datetime.now()
        
        estudios = [
            Estudio(
                numero_orden=f"LAB-{now.strftime('%Y%m%d')}-0001",
                paciente_id=1,
                tipo_estudio_id=1,
                usuario_id=1,
                fecha_solicitud=now - timedelta(days=2),
                fecha_resultado=now - timedelta(days=1),
                estado='completado',
                prioridad='normal',
                observaciones='Paciente en ayunas',
                resultados='Hemoglobina: 14.5 g/dL, Leucocitos: 7200/mm³, Plaquetas: 250000/mm³'
            ),
            Estudio(
                numero_orden=f"LAB-{now.strftime('%Y%m%d')}-0002",
                paciente_id=2,
                tipo_estudio_id=2,
                usuario_id=1,
                fecha_solicitud=now - timedelta(days=1),
                estado='en_proceso',
                prioridad='urgente',
                observaciones='Control diabético'
            ),
            Estudio(
                numero_orden=f"LAB-{now.strftime('%Y%m%d')}-0003",
                paciente_id=3,
                tipo_estudio_id=3,
                usuario_id=2,
                fecha_solicitud=now - timedelta(hours=12),
                estado='pendiente',
                prioridad='normal',
                observaciones='Control anual'
            ),
            Estudio(
                numero_orden=f"LAB-{now.strftime('%Y%m%d')}-0004",
                paciente_id=4,
                tipo_estudio_id=4,
                usuario_id=2,
                fecha_solicitud=now - timedelta(hours=6),
                estado='pendiente',
                prioridad='normal',
                observaciones='Infección urinaria sospechada'
            ),
            Estudio(
                numero_orden=f"LAB-{now.strftime('%Y%m%d')}-0005",
                paciente_id=5,
                tipo_estudio_id=5,
                usuario_id=1,
                fecha_solicitud=now - timedelta(days=3),
                fecha_resultado=now - timedelta(days=1),
                estado='completado',
                prioridad='normal',
                observaciones='Control endocrinológico',
                resultados='TSH: 2.5 mUI/L (Valor normal)'
            ),
        ]
        
        for estudio in estudios:
            db.session.add(estudio)
        
        db.session.commit()
        
        print("\n✅ Base de datos inicializada exitosamente!")
        print("\nUsuarios creados:")
        print("  - admin / admin123 (Administrador)")
        print("  - tecnico / tecnico123 (Técnico)")
        print(f"\nTipos de estudio: {len(tipos_estudio)}")
        print(f"Pacientes: {len(pacientes)}")
        print(f"Estudios: {len(estudios)}")

if __name__ == '__main__':
    init_database()
