# test_all_endpoints.py
import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000"

CATEGORIES = {
    "1. Default (Root & Docs)": [
        ("GET", "/", None),
        ("GET", "/docs", None),
        ("GET", "/openapi.json", None),
    ],
    "2. Health & Monitoring": [
        ("GET", "/health", None),
        ("GET", "/health/healthz", None),
        ("GET", "/health/metrics", None),
    ],
    "3. AI Agents": [
        ("GET", "/api/v1/agents/health", None),
        ("GET", "/api/v1/agents/workflows/templates", None),
        ("GET", "/api/v1/agents/workflows", None),
    ],
    "4. Contracts & Billing": [
        ("GET", "/api/v1/contracts/offers", None),
        ("GET", "/api/v1/contracts/contracts", None),
        ("GET", "/api/v1/contracts/payments", None),
        ("GET", "/api/v1/contracts/billing-plans", None),
        ("GET", "/api/v1/contracts/analytics/offers", None),
    ],
    "5. Pipeline & Recruitment": [
        ("GET", "/api/v1/pipeline/candidates", None),
        ("GET", "/api/v1/pipeline/interviews", None),
        ("GET", "/api/v1/pipeline/analytics/pipeline", None),
        ("GET", "/api/v1/pipeline/notifications", None),
    ],
    "6. Analytics & Performance": [
        ("GET", "/api/v1/analytics/metrics/hiring", None),
        ("GET", "/api/v1/analytics/performance/candidates", None),
        ("GET", "/api/v1/analytics/performance/sprints", None),
        ("GET", "/api/v1/analytics/pipeline", None),
        ("GET", "/api/v1/analytics/costs", None),
        ("GET", "/api/v1/analytics/insights", None),
    ],
    "7. Jobs & Scraping": [
        ("GET", "/api/jobs/platforms", None),
        ("GET", "/api/jobs/stats", None),
        ("GET", "/api/jobs/scraping/status", None),
        ("GET", "/api/jobs/search?keywords=python", None),
    ],
    "8. Intelligent Jobs (AI Search)": [
        ("GET", "/api/intelligent-jobs/status", None),
        ("GET", "/api/intelligent-jobs/trends?keywords=python", None),
    ],
    "9. Evaluation & Assessment": [
        ("GET", "/evaluation/user/test_dev/evaluations", None),
    ],
}

print("=" * 70)
print("       BREAKIN BACKEND COMPREHENSIVE ENDPOINT TEST SUITE       ")
print("=" * 70)

all_passed = True
total_tested = 0
total_passed = 0

for category, endpoints in CATEGORIES.items():
    print(f"\n--- {category} ---")
    for method, path, body in endpoints:
        total_tested += 1
        url = f"{BASE_URL}{path}"
        t0 = time.time()
        try:
            req_data = json.dumps(body).encode("utf-8") if body else None
            headers = {"Content-Type": "application/json"} if body else {}
            req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
            resp = urllib.request.urlopen(req, timeout=15)
            data = resp.read()
            elapsed = time.time() - t0
            print(f"  [PASS] {method:<4} {path:<42} -> Status: {resp.status} ({len(data)} bytes, {elapsed:.2f}s)")
            total_passed += 1
        except urllib.error.HTTPError as e:
            elapsed = time.time() - t0
            err_data = e.read().decode("utf-8", errors="ignore")[:100]
            print(f"  [FAIL] {method:<4} {path:<42} -> HTTP {e.code}: {err_data} ({elapsed:.2f}s)")
            all_passed = False
        except Exception as e:
            elapsed = time.time() - t0
            print(f"  [ERROR] {method:<4} {path:<42} -> {e} ({elapsed:.2f}s)")
            all_passed = False

print("\n" + "=" * 70)
print(f"RESULTS: {total_passed}/{total_tested} Endpoints Passed")
print("=" * 70)
