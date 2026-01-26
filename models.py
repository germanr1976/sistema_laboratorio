"""
Database models for the laboratory management system
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from extensions import db, login_manager

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

class Usuario(UserMixin, db.Model):
    """Usuario del sistema"""
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    rol = db.Column(db.String(20), default='usuario')  # admin, tecnico, usuario
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación con estudios
    estudios = db.relationship('Estudio', backref='usuario', lazy=True)
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password hash"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<Usuario {self.username}>'

class Paciente(db.Model):
    """Paciente que recibe estudios"""
    __tablename__ = 'pacientes'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    documento = db.Column(db.String(20), unique=True, nullable=False)
    fecha_nacimiento = db.Column(db.Date)
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(120))
    direccion = db.Column(db.String(200))
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación con estudios
    estudios = db.relationship('Estudio', backref='paciente', lazy=True)
    
    def __repr__(self):
        return f'<Paciente {self.apellido}, {self.nombre}>'

class TipoEstudio(db.Model):
    """Tipos de estudios médicos disponibles"""
    __tablename__ = 'tipos_estudio'
    
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    precio = db.Column(db.Float, default=0.0)
    tiempo_resultado = db.Column(db.Integer, default=24)  # horas
    activo = db.Column(db.Boolean, default=True)
    
    # Relación con estudios
    estudios = db.relationship('Estudio', backref='tipo', lazy=True)
    
    def __repr__(self):
        return f'<TipoEstudio {self.codigo} - {self.nombre}>'

class Estudio(db.Model):
    """Estudio médico realizado a un paciente"""
    __tablename__ = 'estudios'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_orden = db.Column(db.String(50), unique=True, nullable=False)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.id'), nullable=False)
    tipo_estudio_id = db.Column(db.Integer, db.ForeignKey('tipos_estudio.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    
    fecha_solicitud = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_muestra = db.Column(db.DateTime)
    fecha_resultado = db.Column(db.DateTime)
    
    estado = db.Column(db.String(20), default='pendiente')  # pendiente, en_proceso, completado, cancelado
    prioridad = db.Column(db.String(20), default='normal')  # urgente, normal, baja
    
    observaciones = db.Column(db.Text)
    resultados = db.Column(db.Text)
    
    def __repr__(self):
        return f'<Estudio {self.numero_orden}>'
