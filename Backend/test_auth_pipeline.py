import urllib.request, urllib.error, json, time

BASE = 'http://127.0.0.1:3000'

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'TestRunner'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=== TESTING REAL MONGODB AUTH PIPELINE ===")

# 1. Test Login with non-existent user
status, body = post_json(f"{BASE}/api/auth/login", {"email": "unknown_random_dev@test.com", "password": "mypassword123"})
print(f"1. Unregistered user login test: Status {status} -> {body.get('error')}")
assert status == 404, f"Expected 404, got {status}"

# 2. Register a new real developer
test_email = f"john_engineer_{int(time.time())}@breakin.ai"
status, body = post_json(f"{BASE}/api/auth/register", {
    "email": test_email,
    "password": "SecurePassword99!",
    "displayName": "John Engineer"
})
print(f"2. Register real user test: Status {status} -> {body.get('message')}")
assert status == 200, f"Expected 200, got {status}"

# 3. Test duplicate registration
status, body = post_json(f"{BASE}/api/auth/register", {
    "email": test_email,
    "password": "SecurePassword99!",
    "displayName": "John Engineer"
})
print(f"3. Duplicate registration test: Status {status} -> {body.get('error')}")
assert status == 409, f"Expected 409, got {status}"

# 4. Test Login with wrong password
status, body = post_json(f"{BASE}/api/auth/login", {"email": test_email, "password": "WrongPassword123"})
print(f"4. Incorrect password login test: Status {status} -> {body.get('error')}")
assert status == 401, f"Expected 401, got {status}"

# 5. Test Login with correct password
status, body = post_json(f"{BASE}/api/auth/login", {"email": test_email, "password": "SecurePassword99!"})
print(f"5. Correct credentials login test: Status {status} -> Welcome, {body.get('user', {}).get('displayName')} (Role: {body.get('user', {}).get('role')})")
assert status == 200, f"Expected 200, got {status}"

# 6. Test /auth and /auth/sign-in routes compilation
for path in ['/auth', '/auth/sign-in', '/auth/sign-up']:
    req = urllib.request.Request(f"{BASE}{path}", headers={'User-Agent': 'TestRunner'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(f"6. Route {path} compilation test: Status {resp.status} OK")

print("=== ALL AUTHENTICATION TESTS PASSED PERFECTLY ===")
