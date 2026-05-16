from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

resp = client.post('/api/auth/login', json={"email": "admin@taskflow.io", "password": "admin123"})
print('status', resp.status_code)
print('body', resp.json())

# Try dashboard with token if login succeeded
if resp.status_code == 200:
    token = resp.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}'}
    r = client.get('/api/dashboard', headers=headers)
    print('dashboard', r.status_code, r.json())
