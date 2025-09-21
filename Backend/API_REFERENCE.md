# BreakIn Employer API Reference

## Base Information

**Base URL:** `http://localhost:8000/api/v1/employer`

**Authentication:** Bearer Token (JWT)

**Content-Type:** `application/json`

**Rate Limits:**
- Search API: 100 requests/hour
- Job Management: 1000 requests/hour
- Dashboard: 500 requests/hour
- Reports: 50 requests/hour

---

## Authentication

### Login

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "recruiter@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_123",
    "email": "recruiter@company.com",
    "role": "recruiter",
    "company_id": "company_456"
  }
}
```

---

## Job Management

### Create Job Posting

**Endpoint:** `POST /jobs`

**Description:** Create a new job posting

**Request Body:**
```json
{
  "title": "Senior Python Developer",
  "description": "We are looking for an experienced Python developer...",
  "requirements": [
    "5+ years Python experience",
    "FastAPI knowledge",
    "MongoDB experience"
  ],
  "location": "San Francisco, CA",
  "job_type": "full_time",
  "salary_min": 120000,
  "salary_max": 180000,
  "currency": "USD",
  "remote_allowed": true,
  "experience_level": "senior",
  "department": "Engineering",
  "benefits": [
    "Health insurance",
    "401k matching",
    "Flexible PTO"
  ]
}
```

**Response:**
```json
{
  "id": "job_123",
  "title": "Senior Python Developer",
  "status": "draft",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "company_id": "company_456",
  "created_by": "user_123"
}
```

### List Job Postings

**Endpoint:** `GET /jobs`

**Description:** Retrieve list of job postings with filtering and pagination

**Query Parameters:**
- `limit` (int, default: 20): Number of jobs to return
- `offset` (int, default: 0): Number of jobs to skip
- `status` (string): Filter by job status (draft, active, paused, closed)
- `job_type` (string): Filter by job type
- `location` (string): Filter by location
- `department` (string): Filter by department
- `created_after` (datetime): Filter jobs created after date
- `search` (string): Search in title and description

**Example:** `GET /jobs?limit=10&status=active&job_type=full_time`

**Response:**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "title": "Senior Python Developer",
      "status": "active",
      "location": "San Francisco, CA",
      "job_type": "full_time",
      "salary_range": "$120,000 - $180,000",
      "applications_count": 15,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "has_more": false
}
```

### Get Job Details

**Endpoint:** `GET /jobs/{job_id}`

**Description:** Retrieve detailed information about a specific job

**Response:**
```json
{
  "id": "job_123",
  "title": "Senior Python Developer",
  "description": "We are looking for an experienced Python developer...",
  "requirements": ["5+ years Python experience"],
  "location": "San Francisco, CA",
  "job_type": "full_time",
  "status": "active",
  "salary_min": 120000,
  "salary_max": 180000,
  "currency": "USD",
  "remote_allowed": true,
  "experience_level": "senior",
  "department": "Engineering",
  "benefits": ["Health insurance"],
  "applications_count": 15,
  "views_count": 245,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-03-15T10:30:00Z"
}
```

### Update Job Posting

**Endpoint:** `PUT /jobs/{job_id}`

**Description:** Update an existing job posting

**Request Body:** (Same as create, all fields optional)
```json
{
  "title": "Senior Python Developer (Updated)",
  "status": "active",
  "salary_max": 200000
}
```

### Delete Job Posting

**Endpoint:** `DELETE /jobs/{job_id}`

**Description:** Delete a job posting

**Response:**
```json
{
  "message": "Job posting deleted successfully",
  "job_id": "job_123"
}
```

### Get Job Applications

**Endpoint:** `GET /jobs/{job_id}/applications`

**Description:** Retrieve applications for a specific job

**Query Parameters:**
- `limit` (int): Number of applications to return
- `offset` (int): Number of applications to skip
- `status` (string): Filter by application status
- `sort_by` (string): Sort by field (created_at, match_score)

**Response:**
```json
{
  "applications": [
    {
      "id": "app_123",
      "candidate_id": "candidate_456",
      "status": "under_review",
      "match_score": 0.85,
      "applied_at": "2024-01-16T09:15:00Z",
      "candidate": {
        "name": "John Doe",
        "email": "john@example.com",
        "location": "San Francisco, CA",
        "experience_years": 6
      }
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

### Update Application Status

**Endpoint:** `PUT /jobs/{job_id}/applications/{application_id}/status`

**Description:** Update the status of a job application

**Request Body:**
```json
{
  "status": "interview_scheduled",
  "notes": "Scheduled phone interview for tomorrow",
  "interview_date": "2024-01-17T14:00:00Z"
}
```

### Get Job Analytics

**Endpoint:** `GET /jobs/{job_id}/analytics`

**Description:** Get analytics data for a specific job

**Response:**
```json
{
  "job_id": "job_123",
  "views": 245,
  "applications": 15,
  "conversion_rate": 0.061,
  "avg_match_score": 0.72,
  "application_sources": {
    "direct": 8,
    "referral": 4,
    "job_board": 3
  },
  "daily_stats": [
    {
      "date": "2024-01-15",
      "views": 45,
      "applications": 3
    }
  ]
}
```

---

## Dashboard

### Get Dashboard Overview

**Endpoint:** `GET /dashboard/overview`

**Description:** Get overview metrics for the company dashboard

**Response:**
```json
{
  "total_jobs": 12,
  "active_jobs": 8,
  "draft_jobs": 2,
  "paused_jobs": 2,
  "total_applications": 156,
  "new_applications_today": 8,
  "interviews_scheduled": 15,
  "offers_sent": 6,
  "offers_accepted": 3,
  "avg_time_to_hire": 21.5,
  "application_conversion_rate": 0.12,
  "top_performing_jobs": [
    {
      "job_id": "job_123",
      "title": "Senior Python Developer",
      "applications": 25,
      "conversion_rate": 0.15
    }
  ],
  "recent_activity": [
    {
      "type": "application_received",
      "message": "New application for Senior Python Developer",
      "timestamp": "2024-01-15T10:30:00Z",
      "job_id": "job_123"
    }
  ]
}
```

### Get Team Members

**Endpoint:** `GET /dashboard/team`

**Description:** Get list of team members and their roles

**Response:**
```json
{
  "team_members": [
    {
      "id": "user_123",
      "name": "Jane Smith",
      "email": "jane@company.com",
      "role": "recruiter",
      "department": "HR",
      "active_jobs": 5,
      "applications_reviewed": 23,
      "last_active": "2024-01-15T10:30:00Z"
    }
  ],
  "total_members": 1
}
```

### Get Company Profile

**Endpoint:** `GET /dashboard/company`

**Description:** Get company profile information

**Response:**
```json
{
  "id": "company_456",
  "name": "Tech Innovations Inc",
  "industry": "Technology",
  "size": "51-200",
  "location": "San Francisco, CA",
  "website": "https://techinnovations.com",
  "description": "Leading technology company...",
  "founded_year": 2015,
  "subscription_plan": "professional",
  "subscription_status": "active",
  "usage_stats": {
    "jobs_posted_this_month": 8,
    "candidate_searches_this_month": 45,
    "api_calls_this_month": 1250
  }
}
```

### Get Activity Feed

**Endpoint:** `GET /dashboard/activity`

**Description:** Get recent activity feed for the company

**Query Parameters:**
- `limit` (int): Number of activities to return
- `type` (string): Filter by activity type
- `since` (datetime): Get activities since date

**Response:**
```json
{
  "activities": [
    {
      "id": "activity_123",
      "type": "application_received",
      "message": "New application received for Senior Python Developer",
      "timestamp": "2024-01-15T10:30:00Z",
      "user_id": "user_123",
      "job_id": "job_123",
      "metadata": {
        "candidate_name": "John Doe",
        "match_score": 0.85
      }
    }
  ],
  "total": 1
}
```

---

## Candidate Matching

### Search Candidates

**Endpoint:** `POST /matching/search`

**Description:** Search for candidates with advanced filtering

**Request Body:**
```json
{
  "skills": ["Python", "FastAPI", "MongoDB"],
  "experience_min": 3,
  "experience_max": 10,
  "location": "San Francisco, CA",
  "remote_ok": true,
  "availability": "available",
  "salary_min": 100000,
  "salary_max": 200000,
  "education_level": "bachelor",
  "job_type_preference": "full_time",
  "sort_by": "match_score",
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "candidates": [
    {
      "id": "candidate_123",
      "name": "John Doe",
      "email": "john@example.com",
      "location": "San Francisco, CA",
      "experience_years": 6,
      "skills": ["Python", "FastAPI", "React"],
      "current_role": "Senior Software Engineer",
      "availability": "available",
      "salary_expectation": 150000,
      "match_score": 0.92,
      "last_active": "2024-01-14T15:20:00Z"
    }
  ],
  "total": 1,
  "search_id": "search_456",
  "limit": 20,
  "offset": 0
}
```

### Get Job Matches

**Endpoint:** `POST /matching/jobs/{job_id}/matches`

**Description:** Get candidates that match a specific job

**Request Body:**
```json
{
  "limit": 10,
  "min_match_score": 0.7,
  "include_contacted": false
}
```

**Response:**
```json
{
  "job_id": "job_123",
  "matches": [
    {
      "candidate_id": "candidate_123",
      "match_score": 0.92,
      "match_reasons": [
        "Strong Python experience (6 years)",
        "FastAPI framework knowledge",
        "Located in target area"
      ],
      "candidate": {
        "name": "John Doe",
        "current_role": "Senior Software Engineer",
        "experience_years": 6
      }
    }
  ],
  "total_matches": 1
}
```

### Get Matching Insights

**Endpoint:** `GET /matching/insights`

**Description:** Get insights about matching performance and trends

**Response:**
```json
{
  "total_searches": 45,
  "avg_results_per_search": 12.3,
  "top_searched_skills": [
    {"skill": "Python", "count": 25},
    {"skill": "JavaScript", "count": 18}
  ],
  "match_quality_trend": [
    {"date": "2024-01-15", "avg_match_score": 0.78}
  ],
  "candidate_response_rate": 0.23
}
```

### Save Search

**Endpoint:** `POST /matching/saved-searches`

**Description:** Save search criteria for future use

**Request Body:**
```json
{
  "name": "Senior Python Developers",
  "description": "Experienced Python developers for backend roles",
  "criteria": {
    "skills": ["Python", "FastAPI"],
    "experience_min": 5,
    "location": "San Francisco, CA"
  },
  "auto_run": true,
  "frequency": "daily",
  "notify_on_new_matches": true
}
```

### Run Saved Search

**Endpoint:** `POST /matching/saved-searches/{search_id}/run`

**Description:** Execute a previously saved search

**Response:**
```json
{
  "search_id": "search_456",
  "results": {
    "candidates": [...],
    "total": 15,
    "new_since_last_run": 3
  },
  "executed_at": "2024-01-15T10:30:00Z"
}
```

---

## Offer Management

### Create Job Offer

**Endpoint:** `POST /offers`

**Description:** Create a job offer for a candidate

**Request Body:**
```json
{
  "job_id": "job_123",
  "candidate_id": "candidate_456",
  "salary": 150000,
  "currency": "USD",
  "start_date": "2024-02-01",
  "contract_type": "full_time",
  "benefits": [
    "Health insurance",
    "401k matching",
    "Flexible PTO"
  ],
  "equity_percentage": 0.1,
  "signing_bonus": 10000,
  "notes": "Excited to have you join our team!",
  "expires_in_days": 7
}
```

**Response:**
```json
{
  "id": "offer_123",
  "job_id": "job_123",
  "candidate_id": "candidate_456",
  "status": "draft",
  "salary": 150000,
  "currency": "USD",
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-22T10:30:00Z"
}
```

### List Offers

**Endpoint:** `GET /offers`

**Description:** List job offers with filtering

**Query Parameters:**
- `status` (string): Filter by offer status
- `job_id` (string): Filter by job ID
- `candidate_id` (string): Filter by candidate ID
- `limit` (int): Number of offers to return
- `offset` (int): Number of offers to skip

**Response:**
```json
{
  "offers": [
    {
      "id": "offer_123",
      "job_title": "Senior Python Developer",
      "candidate_name": "John Doe",
      "status": "sent",
      "salary": 150000,
      "created_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-01-22T10:30:00Z"
    }
  ],
  "total": 1
}
```

### Get Offer Details

**Endpoint:** `GET /offers/{offer_id}`

**Description:** Get detailed information about a specific offer

**Response:**
```json
{
  "id": "offer_123",
  "job_id": "job_123",
  "candidate_id": "candidate_456",
  "status": "sent",
  "salary": 150000,
  "currency": "USD",
  "start_date": "2024-02-01",
  "contract_type": "full_time",
  "benefits": ["Health insurance"],
  "equity_percentage": 0.1,
  "signing_bonus": 10000,
  "notes": "Excited to have you join our team!",
  "created_at": "2024-01-15T10:30:00Z",
  "sent_at": "2024-01-15T11:00:00Z",
  "expires_at": "2024-01-22T10:30:00Z",
  "job": {
    "title": "Senior Python Developer",
    "department": "Engineering"
  },
  "candidate": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Send Offer

**Endpoint:** `POST /offers/{offer_id}/send`

**Description:** Send an offer to the candidate

**Request Body:**
```json
{
  "message": "We are excited to extend this offer to you. Please review and let us know if you have any questions.",
  "expires_in_days": 7
}
```

### Update Offer Status

**Endpoint:** `PUT /offers/{offer_id}/status`

**Description:** Update the status of an offer

**Request Body:**
```json
{
  "status": "accepted",
  "notes": "Candidate accepted the offer!",
  "candidate_response": "Thank you for the opportunity. I accept!"
}
```

---

## Payment & Billing

### Get Billing Overview

**Endpoint:** `GET /payments/billing/overview`

**Description:** Get billing overview and subscription information

**Response:**
```json
{
  "subscription": {
    "plan": "professional",
    "status": "active",
    "billing_cycle": "monthly",
    "next_billing_date": "2024-02-15T00:00:00Z",
    "amount": 299.00,
    "currency": "USD"
  },
  "usage": {
    "jobs_posted": 8,
    "jobs_limit": 25,
    "candidate_views": 156,
    "candidate_views_limit": 500,
    "api_calls": 1250,
    "api_calls_limit": 10000
  },
  "current_balance": 0.00,
  "outstanding_invoices": 0
}
```

### List Invoices

**Endpoint:** `GET /payments/invoices`

**Description:** List company invoices

**Query Parameters:**
- `status` (string): Filter by invoice status
- `limit` (int): Number of invoices to return
- `start_date` (date): Filter invoices from date
- `end_date` (date): Filter invoices to date

**Response:**
```json
{
  "invoices": [
    {
      "id": "inv_123",
      "number": "INV-2024-001",
      "status": "paid",
      "amount": 299.00,
      "currency": "USD",
      "due_date": "2024-01-31T00:00:00Z",
      "paid_date": "2024-01-15T10:30:00Z",
      "description": "Professional Plan - January 2024"
    }
  ],
  "total": 1
}
```

### Get Usage Records

**Endpoint:** `GET /payments/usage`

**Description:** Get detailed usage records

**Query Parameters:**
- `start_date` (date): Start date for usage records
- `end_date` (date): End date for usage records
- `resource_type` (string): Filter by resource type

**Response:**
```json
{
  "usage_records": [
    {
      "date": "2024-01-15",
      "resource_type": "candidate_search",
      "quantity": 5,
      "unit_cost": 2.00,
      "total_cost": 10.00
    }
  ],
  "summary": {
    "total_cost": 10.00,
    "by_resource": {
      "candidate_search": 10.00
    }
  }
}
```

---

## Reports & Analytics

### Get Hiring Funnel Report

**Endpoint:** `GET /reports/hiring-funnel`

**Description:** Get hiring funnel analysis

**Query Parameters:**
- `start_date` (date): Start date for report
- `end_date` (date): End date for report
- `job_ids` (array): Filter by specific jobs
- `department` (string): Filter by department

**Response:**
```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "funnel_stages": [
    {
      "stage": "job_posted",
      "count": 8,
      "conversion_rate": 1.0
    },
    {
      "stage": "applications_received",
      "count": 156,
      "conversion_rate": 0.12
    },
    {
      "stage": "interviews_scheduled",
      "count": 32,
      "conversion_rate": 0.21
    },
    {
      "stage": "offers_sent",
      "count": 8,
      "conversion_rate": 0.25
    },
    {
      "stage": "offers_accepted",
      "count": 5,
      "conversion_rate": 0.63
    }
  ],
  "metrics": {
    "avg_time_to_hire": 21.5,
    "cost_per_hire": 2500.00,
    "overall_conversion_rate": 0.032
  }
}
```

### Export Report

**Endpoint:** `POST /reports/export`

**Description:** Export report data in various formats

**Request Body:**
```json
{
  "report_type": "hiring_funnel",
  "format": "csv",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "filters": {
    "job_ids": ["job_123", "job_456"],
    "department": "Engineering"
  },
  "email_to": "manager@company.com"
}
```

**Response:**
```json
{
  "export_id": "export_123",
  "status": "processing",
  "download_url": null,
  "estimated_completion": "2024-01-15T10:35:00Z"
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "salary_min",
      "issue": "Must be greater than 0"
    },
    "request_id": "req_123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid authentication |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_ERROR` | 422 | Request data validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SUBSCRIPTION_LIMIT_REACHED` | 402 | Usage limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Webhooks

### Available Events

- `job.created` - New job posting created
- `job.updated` - Job posting updated
- `application.received` - New application received
- `application.status_changed` - Application status updated
- `offer.created` - New offer created
- `offer.sent` - Offer sent to candidate
- `offer.accepted` - Offer accepted by candidate
- `offer.rejected` - Offer rejected by candidate
- `payment.succeeded` - Payment processed successfully
- `subscription.updated` - Subscription plan changed

### Webhook Payload Example

```json
{
  "event": "application.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "application_id": "app_123",
    "job_id": "job_456",
    "candidate_id": "candidate_789",
    "match_score": 0.85
  },
  "company_id": "company_123"
}
```

---

## SDK Examples

### Python SDK Usage

```python
import requests

class BreakInEmployerAPI:
    def __init__(self, base_url, access_token):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    def create_job(self, job_data):
        response = requests.post(
            f"{self.base_url}/employer/jobs",
            json=job_data,
            headers=self.headers
        )
        return response.json()
    
    def search_candidates(self, search_criteria):
        response = requests.post(
            f"{self.base_url}/employer/matching/search",
            json=search_criteria,
            headers=self.headers
        )
        return response.json()

# Usage
api = BreakInEmployerAPI("http://localhost:8000/api/v1", "your_token")
job = api.create_job({
    "title": "Senior Developer",
    "location": "San Francisco, CA"
})
```

### JavaScript SDK Usage

```javascript
class BreakInEmployerAPI {
    constructor(baseUrl, accessToken) {
        this.baseUrl = baseUrl;
        this.headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
    }
    
    async createJob(jobData) {
        const response = await fetch(`${this.baseUrl}/employer/jobs`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(jobData)
        });
        return response.json();
    }
    
    async searchCandidates(searchCriteria) {
        const response = await fetch(`${this.baseUrl}/employer/matching/search`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(searchCriteria)
        });
        return response.json();
    }
}

// Usage
const api = new BreakInEmployerAPI('http://localhost:8000/api/v1', 'your_token');
const job = await api.createJob({
    title: 'Senior Developer',
    location: 'San Francisco, CA'
});
```

---

This API reference provides comprehensive documentation for all employer-side endpoints. For interactive testing, visit `/docs` when the server is running.