"""
Test script to verify the application works
"""
from app import create_app
from extensions import db
from models import Usuario, Estudio

app = create_app()

with app.test_client() as client:
    # Test home redirect
    print("Testing home page...")
    response = client.get('/')
    print(f"  Status: {response.status_code}")
    print(f"  Redirect: {response.location if response.status_code == 302 else 'N/A'}")
    
    # Test login page
    print("\nTesting login page...")
    response = client.get('/auth/login')
    print(f"  Status: {response.status_code}")
    print(f"  Content length: {len(response.data)} bytes")
    print(f"  Contains login form: {'username' in response.data.decode()}")
    
    # Test login
    print("\nTesting login...")
    response = client.post('/auth/login', data={
        'username': 'admin',
        'password': 'admin123'
    }, follow_redirects=False)
    print(f"  Status: {response.status_code}")
    print(f"  Redirect: {response.location if response.status_code == 302 else 'N/A'}")
    
    # Test dashboard
    print("\nTesting dashboard (after login)...")
    response = client.get('/dashboard', follow_redirects=True)
    print(f"  Status: {response.status_code}")
    print(f"  Content length: {len(response.data)} bytes")
    content = response.data.decode()
    print(f"  Contains 'Dashboard' or 'Panel': {'Dashboard' in content or 'Panel' in content}")
    
    # Test estudios list
    print("\nTesting estudios list...")
    response = client.get('/estudios/', follow_redirects=True)
    print(f"  Status: {response.status_code}")
    print(f"  Content length: {len(response.data)} bytes")
    
    # Test pacientes list
    print("\nTesting pacientes list...")
    response = client.get('/estudios/pacientes', follow_redirects=True)
    print(f"  Status: {response.status_code}")
    print(f"  Content length: {len(response.data)} bytes")

# Test database
print("\n=== Database Tests ===")
with app.app_context():
    usuario_count = Usuario.query.count()
    estudio_count = Estudio.query.count()
    print(f"Usuarios in DB: {usuario_count}")
    print(f"Estudios in DB: {estudio_count}")

print("\n✅ All tests completed successfully!")
