# Employer API Testing Guide

## Quick Start Testing

### 1. Environment Setup

**Step 1: Install Dependencies**
```bash
cd Backend
pip install -r requirements.txt
```

**Step 2: Set up Environment Variables**
Create `.env` file in Backend directory:
```env
MONGODB_URL=mongodb://localhost:27017/breakin_test_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=test-secret-key-for-development
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
DEBUG=true
```

**Step 3: Start the Server**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Step 4: Verify Server is Running**
Open browser and go to: `http://localhost:8000/docs`
You should see the FastAPI interactive documentation.

### 2. Authentication Setup

**Create Test User (if not exists)**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.recruiter@company.com",
    "password": "testpass123",
    "full_name": "Test Recruiter",
    "role": "recruiter",
    "company_name": "Test Company Inc"
  }'
```

**Login to Get JWT Token**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.recruiter@company.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_123",
    "email": "test.recruiter@company.com",
    "role": "recruiter"
  }
}
```

**Save the access_token for subsequent requests!**

## 3. Testing Core Endpoints

### A. Job Management Testing

**Create a Job Posting**
```bash
curl -X POST http://localhost:8000/api/v1/employer/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Python Developer",
    "description": "We are looking for an experienced Python developer to join our team. You will work on building scalable web applications using FastAPI and MongoDB.",
    "requirements": [
      "5+ years of Python development experience",
      "Experience with FastAPI or similar frameworks",
      "Knowledge of MongoDB and database design",
      "Strong problem-solving skills"
    ],
    "location": "San Francisco, CA",
    "job_type": "full_time",
    "salary_min": 120000,
    "salary_max": 180000,
    "currency": "USD",
    "remote_allowed": true,
    "experience_level": "senior"
  }'
```

**List All Jobs**
```bash
curl -X GET "http://localhost:8000/api/v1/employer/jobs?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Specific Job**
```bash
curl -X GET http://localhost:8000/api/v1/employer/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Job Status**
```bash
curl -X PUT http://localhost:8000/api/v1/employer/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "title": "Senior Python Developer (Updated)"
  }'
```

### B. Dashboard Testing

**Get Dashboard Overview**
```bash
curl -X GET http://localhost:8000/api/v1/employer/dashboard/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "total_jobs": 5,
  "active_jobs": 3,
  "total_applications": 42,
  "interviews_scheduled": 8,
  "offers_sent": 3,
  "avg_time_to_hire": 21.5,
  "application_conversion_rate": 0.15,
  "recent_activity": [
    {
      "type": "application_received",
      "message": "New application for Senior Python Developer",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Get Team Members**
```bash
curl -X GET http://localhost:8000/api/v1/employer/dashboard/team \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### C. Candidate Matching Testing

**Search Candidates**
```bash
curl -X POST http://localhost:8000/api/v1/employer/matching/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Python", "FastAPI", "MongoDB"],
    "experience_min": 3,
    "experience_max": 10,
    "location": "San Francisco, CA",
    "remote_ok": true,
    "availability": "available",
    "salary_min": 100000,
    "salary_max": 200000,
    "sort_by": "match_score",
    "limit": 20,
    "offset": 0
  }'
```

**Get Job Matches**
```bash
curl -X POST http://localhost:8000/api/v1/employer/matching/jobs/JOB_ID/matches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "min_match_score": 0.7
  }'
```

**Save Search**
```bash
curl -X POST http://localhost:8000/api/v1/employer/matching/saved-searches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Python Developers",
    "criteria": {
      "skills": ["Python", "FastAPI"],
      "experience_min": 5,
      "location": "San Francisco, CA"
    },
    "auto_run": true,
    "frequency": "daily"
  }'
```

### D. Offer Management Testing

**Create Job Offer**
```bash
curl -X POST http://localhost:8000/api/v1/employer/offers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "JOB_ID",
    "candidate_id": "CANDIDATE_ID",
    "salary": 150000,
    "currency": "USD",
    "start_date": "2024-02-01",
    "contract_type": "full_time",
    "benefits": [
      "Health insurance",
      "401k matching",
      "Flexible PTO",
      "Remote work options"
    ],
    "equity_percentage": 0.1,
    "signing_bonus": 10000,
    "notes": "Excited to have you join our team!"
  }'
```

**Send Offer**
```bash
curl -X POST http://localhost:8000/api/v1/employer/offers/OFFER_ID/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "We are excited to extend this offer to you. Please review and let us know if you have any questions.",
    "expires_in_days": 7
  }'
```

**Update Offer Status**
```bash
curl -X PUT http://localhost:8000/api/v1/employer/offers/OFFER_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "notes": "Candidate accepted the offer!"
  }'
```

### E. Payment & Billing Testing

**Get Billing Overview**
```bash
curl -X GET http://localhost:8000/api/v1/employer/payments/billing/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**List Invoices**
```bash
curl -X GET "http://localhost:8000/api/v1/employer/payments/invoices?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Add Payment Method**
```bash
curl -X POST http://localhost:8000/api/v1/employer/payments/methods \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "credit_card",
    "card_number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2025,
    "cvc": "123",
    "name": "Test Company",
    "is_default": true
  }'
```

**Get Usage Records**
```bash
curl -X GET "http://localhost:8000/api/v1/employer/payments/usage?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### F. Reports Testing

**Get Hiring Funnel Report**
```bash
curl -X GET "http://localhost:8000/api/v1/employer/reports/hiring-funnel?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Job Performance Report**
```bash
curl -X GET "http://localhost:8000/api/v1/employer/reports/job-performance?job_id=JOB_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Export Report**
```bash
curl -X POST http://localhost:8000/api/v1/employer/reports/export \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "hiring_funnel",
    "format": "csv",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "filters": {
      "job_ids": ["JOB_ID_1", "JOB_ID_2"]
    }
  }'
```

## 4. Testing with Postman

### Import Collection

Create a Postman collection with the following structure:

```json
{
  "info": {
    "name": "BreakIn Employer API",
    "description": "Complete API testing collection"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000/api/v1"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  }
}
```

### Environment Variables

Set up Postman environment with:
- `base_url`: `http://localhost:8000/api/v1`
- `access_token`: (will be set after login)
- `job_id`: (will be set after creating a job)
- `offer_id`: (will be set after creating an offer)

## 5. Automated Testing

### Run Unit Tests
```bash
cd Backend
pytest app/tests/test_employer_routes.py -v
```

### Run Integration Tests
```bash
pytest app/tests/test_employer_routes.py::TestIntegration -v
```

### Run Performance Tests
```bash
pytest app/tests/test_employer_routes.py::TestPerformance -v
```

### Run with Coverage
```bash
pytest --cov=app --cov-report=html app/tests/
```

## 6. Load Testing

### Using Apache Bench (ab)

**Test Job Listing Endpoint**
```bash
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:8000/api/v1/employer/jobs
```

**Test Search Endpoint**
```bash
ab -n 100 -c 5 -p search_payload.json -T application/json \
   -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:8000/api/v1/employer/matching/search
```

### Using Locust

Create `locustfile.py`:
```python
from locust import HttpUser, task, between

class EmployerAPIUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login and get token
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test.recruiter@company.com",
            "password": "testpass123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def list_jobs(self):
        self.client.get("/api/v1/employer/jobs", headers=self.headers)
    
    @task(2)
    def dashboard_overview(self):
        self.client.get("/api/v1/employer/dashboard/overview", headers=self.headers)
    
    @task(1)
    def search_candidates(self):
        self.client.post("/api/v1/employer/matching/search", 
                        headers=self.headers,
                        json={"skills": ["Python"], "limit": 10})
```

Run load test:
```bash
locust -f locustfile.py --host=http://localhost:8000
```

## 7. Error Testing

### Test Authentication Errors

**Missing Token**
```bash
curl -X GET http://localhost:8000/api/v1/employer/jobs
# Expected: 401 Unauthorized
```

**Invalid Token**
```bash
curl -X GET http://localhost:8000/api/v1/employer/jobs \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized
```

### Test Validation Errors

**Invalid Job Data**
```bash
curl -X POST http://localhost:8000/api/v1/employer/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "salary_min": -1000
  }'
# Expected: 422 Validation Error
```

### Test Rate Limiting

**Exceed Rate Limit**
```bash
# Send 200 requests quickly
for i in {1..200}; do
  curl -X GET http://localhost:8000/api/v1/employer/matching/search \
    -H "Authorization: Bearer YOUR_TOKEN" &
done
# Expected: 429 Too Many Requests
```

## 8. Database Testing

### Verify Data Persistence

**Check MongoDB Collections**
```bash
# Connect to MongoDB
mongo breakin_test_db

# List collections
show collections

# Check jobs collection
db.jobs.find().pretty()

# Check offers collection
db.offers.find().pretty()
```

### Test Data Integrity

**Create Job and Verify**
1. Create job via API
2. Check database for job record
3. Verify all fields are correctly stored
4. Test foreign key relationships

## 9. Monitoring & Debugging

### Check Application Logs

```bash
# View real-time logs
tail -f app/logs/application.log

# Filter error logs
grep "ERROR" app/logs/application.log

# Check specific request
grep "request_id_123" app/logs/application.log
```

### Health Check Endpoint

```bash
curl -X GET http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

## 10. Common Issues & Solutions

### Issue: Server Won't Start

**Solution:**
1. Check if port 8000 is already in use
2. Verify MongoDB is running
3. Check environment variables
4. Review error logs

### Issue: Authentication Fails

**Solution:**
1. Verify JWT secret key
2. Check token expiration
3. Ensure user exists in database
4. Verify password hash

### Issue: Database Connection Error

**Solution:**
1. Start MongoDB service
2. Check connection string
3. Verify database permissions
4. Test network connectivity

### Issue: Slow API Responses

**Solution:**
1. Check database indexes
2. Review query performance
3. Enable Redis caching
4. Optimize search algorithms

## 11. Production Testing Checklist

- [ ] All endpoints return expected responses
- [ ] Authentication and authorization work correctly
- [ ] Rate limiting is enforced
- [ ] Input validation prevents invalid data
- [ ] Error handling returns proper error codes
- [ ] Database operations are atomic
- [ ] Caching improves performance
- [ ] Logging captures important events
- [ ] Security headers are present
- [ ] CORS is properly configured
- [ ] API documentation is accurate
- [ ] Load testing shows acceptable performance

---

**Need Help?**

1. Check the API documentation at `/docs`
2. Review application logs
3. Test with smaller datasets first
4. Use the interactive API docs for quick testing
5. Contact the development team for support

**Happy Testing! 🚀**