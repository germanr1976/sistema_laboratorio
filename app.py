"""
Sistema de Gestión de Laboratorio Químico
Application initialization and configuration
"""
import os
from flask import Flask
from dotenv import load_dotenv
from extensions import db, login_manager

# Load environment variables
load_dotenv()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///laboratorio.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor inicie sesión para acceder a esta página.'
    
    # Register blueprints
    from routes import main_bp, auth_bp, estudios_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(estudios_bp)
    
    # Create database tables
    with app.app_context():
        from models import Usuario
        db.create_all()
        # Create default admin user if it doesn't exist
        admin = Usuario.query.filter_by(username='admin').first()
        if not admin:
            admin = Usuario(
                username='admin',
                email='admin@laboratorio.com',
                nombre='Administrador',
                rol='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
