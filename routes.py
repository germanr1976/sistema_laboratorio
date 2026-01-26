"""
Routes and views for the laboratory management system
"""
from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db
from models import Usuario, Paciente, TipoEstudio, Estudio

# Blueprints
main_bp = Blueprint('main', __name__)
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
estudios_bp = Blueprint('estudios', __name__, url_prefix='/estudios')

# Main routes
@main_bp.route('/')
def index():
    """Home page"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('auth.login'))

@main_bp.route('/dashboard')
@login_required
def dashboard():
    """Dashboard principal"""
    # Estadísticas
    total_estudios = Estudio.query.count()
    estudios_pendientes = Estudio.query.filter_by(estado='pendiente').count()
    estudios_proceso = Estudio.query.filter_by(estado='en_proceso').count()
    estudios_completados = Estudio.query.filter_by(estado='completado').count()
    
    # Últimos estudios
    ultimos_estudios = Estudio.query.order_by(Estudio.fecha_solicitud.desc()).limit(10).all()
    
    return render_template('dashboard.html',
                         total_estudios=total_estudios,
                         estudios_pendientes=estudios_pendientes,
                         estudios_proceso=estudios_proceso,
                         estudios_completados=estudios_completados,
                         ultimos_estudios=ultimos_estudios)

# Authentication routes
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        usuario = Usuario.query.filter_by(username=username).first()
        
        if usuario and usuario.check_password(password) and usuario.activo:
            login_user(usuario)
            flash('Inicio de sesión exitoso', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.dashboard'))
        else:
            flash('Usuario o contraseña incorrectos', 'error')
    
    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    """Logout"""
    logout_user()
    flash('Sesión cerrada exitosamente', 'success')
    return redirect(url_for('auth.login'))

# Estudios routes
@estudios_bp.route('/')
@login_required
def listar():
    """Listar estudios"""
    page = request.args.get('page', 1, type=int)
    estado = request.args.get('estado', '')
    
    query = Estudio.query
    
    if estado:
        query = query.filter_by(estado=estado)
    
    estudios = query.order_by(Estudio.fecha_solicitud.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('estudios/listar.html', estudios=estudios, estado_filtro=estado)

@estudios_bp.route('/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo():
    """Crear nuevo estudio"""
    if request.method == 'POST':
        # Obtener datos del formulario
        paciente_id = request.form.get('paciente_id')
        tipo_estudio_id = request.form.get('tipo_estudio_id')
        prioridad = request.form.get('prioridad', 'normal')
        observaciones = request.form.get('observaciones', '')
        
        # Generar número de orden
        ultimo_estudio = Estudio.query.order_by(Estudio.id.desc()).first()
        numero_orden = f"LAB-{datetime.now().strftime('%Y%m%d')}-{(ultimo_estudio.id + 1) if ultimo_estudio else 1:04d}"
        
        # Crear estudio
        estudio = Estudio(
            numero_orden=numero_orden,
            paciente_id=paciente_id,
            tipo_estudio_id=tipo_estudio_id,
            usuario_id=current_user.id,
            prioridad=prioridad,
            observaciones=observaciones,
            estado='pendiente'
        )
        
        db.session.add(estudio)
        db.session.commit()
        
        flash(f'Estudio {numero_orden} creado exitosamente', 'success')
        return redirect(url_for('estudios.ver', id=estudio.id))
    
    # GET request
    pacientes = Paciente.query.order_by(Paciente.apellido).all()
    tipos_estudio = TipoEstudio.query.filter_by(activo=True).order_by(TipoEstudio.nombre).all()
    
    return render_template('estudios/nuevo.html', pacientes=pacientes, tipos_estudio=tipos_estudio)

@estudios_bp.route('/<int:id>')
@login_required
def ver(id):
    """Ver detalle de estudio"""
    estudio = Estudio.query.get_or_404(id)
    return render_template('estudios/ver.html', estudio=estudio)

@estudios_bp.route('/<int:id>/actualizar', methods=['POST'])
@login_required
def actualizar(id):
    """Actualizar estado de estudio"""
    estudio = Estudio.query.get_or_404(id)
    
    estado = request.form.get('estado')
    resultados = request.form.get('resultados')
    
    if estado:
        estudio.estado = estado
        if estado == 'completado':
            estudio.fecha_resultado = datetime.utcnow()
    
    if resultados:
        estudio.resultados = resultados
    
    db.session.commit()
    flash('Estudio actualizado exitosamente', 'success')
    
    return redirect(url_for('estudios.ver', id=id))

@estudios_bp.route('/pacientes')
@login_required
def pacientes():
    """Listar pacientes"""
    pacientes = Paciente.query.order_by(Paciente.apellido).all()
    return render_template('estudios/pacientes.html', pacientes=pacientes)

@estudios_bp.route('/pacientes/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo_paciente():
    """Crear nuevo paciente"""
    if request.method == 'POST':
        paciente = Paciente(
            nombre=request.form.get('nombre'),
            apellido=request.form.get('apellido'),
            documento=request.form.get('documento'),
            telefono=request.form.get('telefono'),
            email=request.form.get('email'),
            direccion=request.form.get('direccion')
        )
        
        db.session.add(paciente)
        db.session.commit()
        
        flash('Paciente registrado exitosamente', 'success')
        return redirect(url_for('estudios.pacientes'))
    
    return render_template('estudios/nuevo_paciente.html')
