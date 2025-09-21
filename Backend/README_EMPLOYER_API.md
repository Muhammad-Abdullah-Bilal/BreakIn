# Employer-Side Backend API Documentation

## Overview

This document provides comprehensive documentation for the employer-side backend system of the BreakIn platform. The system enables companies and recruiters to manage job postings, discover candidates, handle offers and contracts, process payments, and generate reports.

## Architecture Overview

```
Backend/app/
├── models/employer/          # Database models and enums
├── schemas/employer/         # Pydantic models for API validation
├── routes/employer/          # API endpoints
├── core/                     # Authentication and security
├── tests/                    # Test suite
└── docs/                     # API documentation
```

## Quick Start

### Prerequisites

- Python 3.8+
- MongoDB
- Redis (for caching and rate limiting)
- Virtual environment

### Installation

1. **Set up virtual environment:**
```bash
cd Backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Environment configuration:**
Create `.env` file in Backend directory:
```env
# Database
MONGODB_URL=mongodb://localhost:27017/breakin_db
REDIS_URL=redis://localhost:6379

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...

# Environment
ENVIRONMENT=development
DEBUG=true
```

4. **Start the server:**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints Overview

### Base URL
```
http://localhost:8000/api/v1/employer
```

### Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Core Modules

### 1. Job Management (`/jobs`)

**Purpose:** Manage job postings, applications, and analytics

**Key Endpoints:**
- `POST /jobs` - Create job posting
- `GET /jobs` - List jobs with filters
- `GET /jobs/{job_id}` - Get job details
- `PUT /jobs/{job_id}` - Update job
- `DELETE /jobs/{job_id}` - Delete job
- `GET /jobs/{job_id}/applications` - Get job applications
- `PUT /jobs/{job_id}/applications/{application_id}/status` - Update application status
- `GET /jobs/{job_id}/analytics` - Get job analytics

**Example Usage:**
```python
import requests

# Create a job posting
job_data = {
    "title": "Senior Python Developer",
    "description": "We are looking for an experienced Python developer...",
    "requirements": ["5+ years Python experience", "FastAPI knowledge"],
    "location": "San Francisco, CA",
    "job_type": "full_time",
    "salary_min": 120000,
    "salary_max": 180000,
    "currency": "USD"
}

response = requests.post(
    "http://localhost:8000/api/v1/employer/jobs",
    json=job_data,
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)
```

### 2. Dashboard (`/dashboard`)

**Purpose:** Provide overview metrics and company management

**Key Endpoints:**
- `GET /dashboard/overview` - Dashboard overview with metrics
- `GET /dashboard/team` - Team members management
- `GET /dashboard/company` - Company profile
- `GET /dashboard/activity` - Recent activity feed

**Metrics Provided:**
- Total active jobs
- Total applications received
- Interviews scheduled
- Offers sent
- Average time to hire
- Application conversion rates

### 3. Candidate Matching (`/matching`)

**Purpose:** Discover and match candidates with job requirements

**Key Endpoints:**
- `POST /matching/search` - Search candidates with filters
- `POST /matching/jobs/{job_id}/matches` - Get matches for specific job
- `GET /matching/insights` - Get matching insights and analytics
- `POST /matching/saved-searches` - Save search criteria
- `POST /matching/saved-searches/{search_id}/run` - Run saved search

**Search Filters:**
- Skills and technologies
- Experience level
- Location preferences
- Salary expectations
- Availability status
- Education background

### 4. Offer Management (`/offers`)

**Purpose:** Handle job offers and contract lifecycle

**Key Endpoints:**
- `POST /offers` - Create job offer
- `GET /offers` - List offers with filters
- `GET /offers/{offer_id}` - Get offer details
- `PUT /offers/{offer_id}` - Update offer
- `POST /offers/{offer_id}/send` - Send offer to candidate
- `PUT /offers/{offer_id}/status` - Update offer status
- `POST /offers/{offer_id}/withdraw` - Withdraw offer
- `GET /offers/{offer_id}/contract` - View contract
- `POST /offers/{offer_id}/negotiate` - Handle negotiations

**Offer Lifecycle:**
1. Draft → Sent → Under Review
2. Accepted/Rejected/Countered
3. Contract Generation
4. Signed/Expired

### 5. Payment & Billing (`/payments`)

**Purpose:** Manage subscriptions, billing, and payouts

**Key Endpoints:**
- `GET /payments/billing/overview` - Billing overview
- `POST /payments/billing/upgrade` - Upgrade subscription
- `GET /payments/invoices` - List invoices
- `POST /payments/invoices/{invoice_id}/pay` - Pay invoice
- `GET /payments/methods` - List payment methods
- `POST /payments/methods` - Add payment method
- `GET /payments/usage` - Usage records
- `GET /payments/payouts` - List payouts
- `GET /payments/analytics` - Billing analytics

**Subscription Plans:**
- **Starter:** $99/month - 5 active jobs, 100 candidate views
- **Professional:** $299/month - 25 active jobs, 500 candidate views
- **Enterprise:** $999/month - Unlimited jobs and views

### 6. Reports & Analytics (`/reports`)

**Purpose:** Generate comprehensive hiring reports and exports

**Key Endpoints:**
- `GET /reports/hiring-funnel` - Hiring funnel analysis
- `GET /reports/job-performance` - Job performance metrics
- `GET /reports/recruiter-activity` - Recruiter activity reports
- `POST /reports/export` - Export reports (CSV/PDF)

**Available Reports:**
- Hiring funnel conversion rates
- Time-to-hire analytics
- Source effectiveness
- Recruiter performance
- Cost-per-hire analysis
- Diversity metrics

## Data Models

### Job Posting Model
```python
class JobPosting:
    id: str
    company_id: str
    title: str
    description: str
    requirements: List[str]
    location: str
    job_type: JobType  # full_time, part_time, contract, internship
    status: JobStatus  # draft, active, paused, closed, expired
    salary_min: Optional[int]
    salary_max: Optional[int]
    currency: str
    created_at: datetime
    updated_at: datetime
```

### Job Offer Model
```python
class JobOffer:
    id: str
    job_id: str
    candidate_id: str
    company_id: str
    status: OfferStatus  # draft, sent, under_review, accepted, rejected, withdrawn
    salary: int
    currency: str
    start_date: date
    contract_type: ContractType  # full_time, part_time, contract
    benefits: List[str]
    created_at: datetime
    expires_at: datetime
```

## Authentication & Authorization

### User Roles
- **Company Admin:** Full access to company data and settings
- **Recruiter:** Access to job management and candidate search
- **Hiring Manager:** Limited access to specific jobs and candidates

### Permissions
- `jobs:create` - Create job postings
- `jobs:read` - View job postings
- `jobs:update` - Update job postings
- `jobs:delete` - Delete job postings
- `candidates:search` - Search candidates
- `offers:manage` - Manage job offers
- `billing:manage` - Manage billing and payments
- `reports:view` - View reports and analytics

## Testing

### Running Tests

```bash
# Run all tests
pytest app/tests/

# Run specific test file
pytest app/tests/test_employer_routes.py

# Run with coverage
pytest --cov=app app/tests/

# Run integration tests
pytest app/tests/test_employer_routes.py::TestIntegration
```

### Test Categories

1. **Unit Tests:** Individual function testing
2. **Integration Tests:** API endpoint testing
3. **Performance Tests:** Load and response time testing
4. **Security Tests:** Authentication and authorization testing

### Sample Test Data

The system includes sample data generators for testing:

```python
# Generate test company
test_company = {
    "name": "Tech Innovations Inc",
    "industry": "Technology",
    "size": "51-200",
    "location": "San Francisco, CA"
}

# Generate test job
test_job = {
    "title": "Senior Python Developer",
    "description": "Join our team...",
    "requirements": ["Python", "FastAPI", "MongoDB"],
    "job_type": "full_time",
    "salary_min": 120000,
    "salary_max": 180000
}
```

## API Testing with Postman/Insomnia

### 1. Authentication Flow

```bash
# Login to get JWT token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@company.com",
    "password": "password123"
  }'
```

### 2. Create Job Posting

```bash
curl -X POST http://localhost:8000/api/v1/employer/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Python Developer",
    "description": "We are looking for an experienced Python developer...",
    "requirements": ["5+ years Python", "FastAPI", "MongoDB"],
    "location": "San Francisco, CA",
    "job_type": "full_time",
    "salary_min": 120000,
    "salary_max": 180000,
    "currency": "USD"
  }'
```

### 3. Search Candidates

```bash
curl -X POST http://localhost:8000/api/v1/employer/matching/search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Python", "FastAPI"],
    "experience_min": 3,
    "location": "San Francisco, CA",
    "availability": "available",
    "limit": 20
  }'
```

## Error Handling

### Standard Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "salary_min",
      "issue": "Must be greater than 0"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `RESOURCE_NOT_FOUND` (404)
- `VALIDATION_ERROR` (422)
- `RATE_LIMIT_EXCEEDED` (429)
- `SUBSCRIPTION_LIMIT_REACHED` (402)
- `INTERNAL_SERVER_ERROR` (500)

## Rate Limiting

- **Search API:** 100 requests/hour
- **Job Management:** 1000 requests/hour
- **Dashboard:** 500 requests/hour
- **Reports:** 50 requests/hour

## Webhooks

The system supports webhooks for real-time notifications:

### Available Events

- `job.created` - New job posting created
- `application.received` - New application received
- `offer.accepted` - Job offer accepted
- `payment.succeeded` - Payment processed successfully
- `subscription.updated` - Subscription plan changed

### Webhook Configuration

```python
# Register webhook endpoint
webhook_config = {
    "url": "https://your-app.com/webhooks/breakin",
    "events": ["job.created", "application.received"],
    "secret": "your-webhook-secret"
}
```

## Performance Optimization

### Caching Strategy

- **Redis Cache:** API responses cached for 5-15 minutes
- **Database Indexing:** Optimized queries for search and filtering
- **Pagination:** All list endpoints support pagination

### Monitoring

- **Response Times:** < 200ms for most endpoints
- **Uptime:** 99.9% availability target
- **Error Rates:** < 1% error rate

## Security Features

- **JWT Authentication:** Secure token-based authentication
- **Role-Based Access Control:** Granular permissions
- **Rate Limiting:** Prevent API abuse
- **Input Validation:** Comprehensive data validation
- **SQL Injection Protection:** Parameterized queries
- **CORS Configuration:** Secure cross-origin requests

## Deployment

### Docker Deployment

```dockerfile
# Dockerfile example
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```bash
# Production environment
ENVIRONMENT=production
DEBUG=false
MONGODB_URL=mongodb://prod-cluster/breakin_db
REDIS_URL=redis://prod-redis:6379
SECRET_KEY=production-secret-key
```

## Support & Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify JWT token is valid and not expired
   - Check user permissions for the endpoint

2. **Rate Limiting**
   - Implement exponential backoff
   - Cache responses when possible

3. **Search Performance**
   - Use specific filters to narrow results
   - Implement pagination for large result sets

### Logging

Logs are structured in JSON format:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "Job created successfully",
  "user_id": "user_123",
  "job_id": "job_456",
  "request_id": "req_789"
}
```

## Contributing

### Code Style

- Follow PEP 8 guidelines
- Use type hints for all functions
- Write comprehensive docstrings
- Maintain test coverage above 90%

### Development Workflow

1. Create feature branch
2. Implement changes with tests
3. Run test suite
4. Submit pull request
5. Code review and merge

---

**For additional support or questions, please contact the development team or refer to the API documentation at `/docs` when the server is running.**