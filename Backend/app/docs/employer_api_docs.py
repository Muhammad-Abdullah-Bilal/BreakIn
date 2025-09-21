"""API documentation configuration for employer endpoints."""
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from typing import Dict, Any

def custom_openapi_schema(app: FastAPI) -> Dict[str, Any]:
    """Generate custom OpenAPI schema for employer API."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="BreakIn Employer API",
        version="1.0.0",
        description="""
        # BreakIn Employer Platform API
        
        The BreakIn Employer API provides comprehensive recruitment and hiring management capabilities for companies and recruiters.
        
        ## Features
        
        ### 🎯 Job Management
        - Create, update, and manage job postings
        - Track application pipeline and candidate progress
        - Automated job matching and candidate recommendations
        
        ### 👥 Candidate Discovery
        - AI-powered candidate search and matching
        - Advanced filtering and sorting options
        - Candidate profile insights and compatibility scores
        
        ### 📊 Dashboard & Analytics
        - Real-time hiring metrics and KPIs
        - Team performance tracking
        - Comprehensive reporting and data exports
        
        ### 💼 Offer Management
        - Create and send job offers
        - Contract lifecycle management
        - Offer negotiation tracking
        
        ### 💳 Billing & Payments
        - Subscription plan management
        - Usage tracking and billing
        - Invoice and payment processing
        
        ## Authentication
        
        All endpoints require authentication using JWT Bearer tokens:
        
        ```
        Authorization: Bearer <your-jwt-token>
        ```
        
        ## Rate Limiting
        
        API endpoints are rate limited based on your subscription plan:
        
        - **Basic Plan**: 100 requests/minute
        - **Professional Plan**: 500 requests/minute  
        - **Enterprise Plan**: 2000 requests/minute
        
        ## Error Handling
        
        The API uses standard HTTP status codes and returns detailed error messages:
        
        ```json
        {
            "detail": "Error description",
            "error_code": "SPECIFIC_ERROR_CODE",
            "timestamp": "2024-01-15T10:30:00Z"
        }
        ```
        
        ## Pagination
        
        List endpoints support pagination with the following parameters:
        
        - `page`: Page number (default: 1)
        - `limit`: Items per page (default: 20, max: 100)
        
        Response format:
        ```json
        {
            "items": [...],
            "total": 150,
            "page": 1,
            "limit": 20,
            "pages": 8
        }
        ```
        """,
        routes=app.routes,
    )
    
    # Add custom security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token obtained from authentication endpoint"
        }
    }
    
    # Add global security requirement
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    # Add custom tags with descriptions
    openapi_schema["tags"] = [
        {
            "name": "Jobs",
            "description": "Job posting management - create, update, and track job postings with application pipeline"
        },
        {
            "name": "Dashboard", 
            "description": "Company dashboard - overview metrics, team management, and activity feeds"
        },
        {
            "name": "Matching & Discovery",
            "description": "Candidate search and AI-powered matching - find and evaluate potential candidates"
        },
        {
            "name": "Offers & Contracts",
            "description": "Offer lifecycle management - create, send, and track job offers and contracts"
        },
        {
            "name": "Payments & Billing",
            "description": "Subscription and billing management - plans, invoices, and payment processing"
        },
        {
            "name": "Reports & Analytics",
            "description": "Hiring analytics and data exports - performance metrics and detailed reports"
        }
    ]
    
    # Add example responses
    add_example_responses(openapi_schema)
    
    # Add webhook documentation
    add_webhook_documentation(openapi_schema)
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

def add_example_responses(schema: Dict[str, Any]):
    """Add example responses to the OpenAPI schema."""
    
    # Job posting examples
    job_examples = {
        "job_posting_response": {
            "summary": "Job Posting Response",
            "value": {
                "id": "job_123456",
                "title": "Senior Python Developer",
                "description": "We are looking for an experienced Python developer...",
                "company_id": "company_789",
                "department": "Engineering",
                "location": "San Francisco, CA",
                "employment_type": "full_time",
                "experience_level": "senior",
                "status": "active",
                "salary_range": {
                    "min_salary": 120000,
                    "max_salary": 180000,
                    "currency": "USD"
                },
                "required_skills": ["Python", "Django", "PostgreSQL"],
                "preferred_skills": ["React", "AWS", "Docker"],
                "requirements": [
                    "5+ years of Python development experience",
                    "Experience with web frameworks like Django or Flask",
                    "Strong database design skills"
                ],
                "benefits": ["Health Insurance", "401k", "Flexible PTO"],
                "published_at": "2024-01-15T10:00:00Z",
                "expires_at": "2024-03-15T10:00:00Z",
                "application_count": 25,
                "view_count": 150
            }
        }
    }
    
    # Candidate search examples
    search_examples = {
        "candidate_search_response": {
            "summary": "Candidate Search Results",
            "value": {
                "candidates": [
                    {
                        "id": "candidate_456",
                        "full_name": "Alice Johnson",
                        "title": "Senior Software Engineer",
                        "location": "San Francisco, CA",
                        "experience_years": 7,
                        "skills": ["Python", "Django", "React", "AWS"],
                        "match_score": 0.92,
                        "availability": "available",
                        "last_active": "2024-01-14T15:30:00Z"
                    }
                ],
                "total": 1,
                "page": 1,
                "limit": 20,
                "search_id": "search_789",
                "generated_at": "2024-01-15T10:30:00Z"
            }
        }
    }
    
    # Dashboard examples
    dashboard_examples = {
        "dashboard_overview": {
            "summary": "Dashboard Overview",
            "value": {
                "active_jobs": 8,
                "total_applications": 156,
                "pending_offers": 5,
                "team_members": 4,
                "this_month_hires": 3,
                "avg_time_to_hire": 18.5,
                "top_performing_jobs": [
                    {
                        "job_id": "job_123",
                        "title": "Senior Developer",
                        "applications": 45,
                        "conversion_rate": 12.5
                    }
                ],
                "recent_activity": [
                    {
                        "type": "application",
                        "message": "New application for Senior Developer position",
                        "timestamp": "2024-01-15T09:45:00Z"
                    }
                ]
            }
        }
    }
    
    # Add examples to schema components
    if "components" not in schema:
        schema["components"] = {}
    if "examples" not in schema["components"]:
        schema["components"]["examples"] = {}
    
    schema["components"]["examples"].update(job_examples)
    schema["components"]["examples"].update(search_examples)
    schema["components"]["examples"].update(dashboard_examples)

def add_webhook_documentation(schema: Dict[str, Any]):
    """Add webhook documentation to the schema."""
    
    webhook_info = {
        "webhooks": {
            "application_received": {
                "post": {
                    "summary": "New Application Received",
                    "description": "Triggered when a new job application is submitted",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "event": {"type": "string", "example": "application.received"},
                                        "job_id": {"type": "string", "example": "job_123"},
                                        "candidate_id": {"type": "string", "example": "candidate_456"},
                                        "application_id": {"type": "string", "example": "app_789"},
                                        "timestamp": {"type": "string", "format": "date-time"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "offer_accepted": {
                "post": {
                    "summary": "Job Offer Accepted",
                    "description": "Triggered when a candidate accepts a job offer",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "event": {"type": "string", "example": "offer.accepted"},
                                        "offer_id": {"type": "string", "example": "offer_123"},
                                        "job_id": {"type": "string", "example": "job_456"},
                                        "candidate_id": {"type": "string", "example": "candidate_789"},
                                        "accepted_at": {"type": "string", "format": "date-time"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    schema.update(webhook_info)

# API usage examples and code snippets
API_EXAMPLES = {
    "python": {
        "authentication": '''
# Authentication Example
import requests

# Get access token
auth_response = requests.post(
    "https://api.breakin.com/auth/login",
    json={"email": "recruiter@company.com", "password": "password"}
)
token = auth_response.json()["access_token"]

# Use token in subsequent requests
headers = {"Authorization": f"Bearer {token}"}
        ''',
        "create_job": '''
# Create Job Posting
import requests

job_data = {
    "title": "Senior Python Developer",
    "description": "We are looking for an experienced Python developer...",
    "department": "Engineering",
    "location": "San Francisco, CA",
    "employment_type": "full_time",
    "experience_level": "senior",
    "salary_range": {
        "min_salary": 120000,
        "max_salary": 180000,
        "currency": "USD"
    },
    "required_skills": ["Python", "Django", "PostgreSQL"],
    "requirements": [
        "5+ years of Python development experience",
        "Experience with web frameworks"
    ]
}

response = requests.post(
    "https://api.breakin.com/employer/jobs/",
    json=job_data,
    headers=headers
)

job = response.json()
print(f"Created job: {job['id']}")
        ''',
        "search_candidates": '''
# Search for Candidates
import requests

search_data = {
    "query": "Python developer with Django experience",
    "skills": ["Python", "Django"],
    "experience_min": 3,
    "experience_max": 8,
    "location": "San Francisco Bay Area",
    "limit": 20
}

response = requests.post(
    "https://api.breakin.com/employer/matching/search",
    json=search_data,
    headers=headers
)

results = response.json()
for candidate in results["candidates"]:
    print(f"{candidate['full_name']} - Match Score: {candidate['match_score']}")
        ''',
        "create_offer": '''
# Create and Send Job Offer
import requests
from datetime import datetime, timedelta

offer_data = {
    "job_id": "job_123456",
    "candidate_id": "candidate_789",
    "salary": 150000,
    "currency": "USD",
    "start_date": (datetime.now() + timedelta(days=30)).isoformat(),
    "benefits": ["Health Insurance", "401k", "Flexible PTO"],
    "notes": "We're excited to have you join our team!"
}

# Create offer
response = requests.post(
    "https://api.breakin.com/employer/offers/",
    json=offer_data,
    headers=headers
)

offer = response.json()
offer_id = offer["id"]

# Send offer to candidate
send_response = requests.post(
    f"https://api.breakin.com/employer/offers/{offer_id}/send",
    headers=headers
)

print(f"Offer sent: {send_response.json()['sent_at']}")
        '''
    },
    "javascript": {
        "authentication": '''
// Authentication Example
const axios = require('axios');

// Get access token
const authResponse = await axios.post('https://api.breakin.com/auth/login', {
    email: 'recruiter@company.com',
    password: 'password'
});

const token = authResponse.data.access_token;

// Configure axios with token
const api = axios.create({
    baseURL: 'https://api.breakin.com',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
        ''',
        "create_job": '''
// Create Job Posting
const jobData = {
    title: "Senior Python Developer",
    description: "We are looking for an experienced Python developer...",
    department: "Engineering",
    location: "San Francisco, CA",
    employment_type: "full_time",
    experience_level: "senior",
    salary_range: {
        min_salary: 120000,
        max_salary: 180000,
        currency: "USD"
    },
    required_skills: ["Python", "Django", "PostgreSQL"],
    requirements: [
        "5+ years of Python development experience",
        "Experience with web frameworks"
    ]
};

const response = await api.post('/employer/jobs/', jobData);
const job = response.data;
console.log(`Created job: ${job.id}`);
        ''',
        "search_candidates": '''
// Search for Candidates
const searchData = {
    query: "Python developer with Django experience",
    skills: ["Python", "Django"],
    experience_min: 3,
    experience_max: 8,
    location: "San Francisco Bay Area",
    limit: 20
};

const response = await api.post('/employer/matching/search', searchData);
const results = response.data;

results.candidates.forEach(candidate => {
    console.log(`${candidate.full_name} - Match Score: ${candidate.match_score}`);
});
        '''
    },
    "curl": {
        "authentication": '''
# Authentication Example
curl -X POST "https://api.breakin.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@company.com",
    "password": "password"
  }'

# Extract token from response and use in subsequent requests
export TOKEN="your-jwt-token-here"
        ''',
        "create_job": '''
# Create Job Posting
curl -X POST "https://api.breakin.com/employer/jobs/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Python Developer",
    "description": "We are looking for an experienced Python developer...",
    "department": "Engineering",
    "location": "San Francisco, CA",
    "employment_type": "full_time",
    "experience_level": "senior",
    "salary_range": {
      "min_salary": 120000,
      "max_salary": 180000,
      "currency": "USD"
    },
    "required_skills": ["Python", "Django", "PostgreSQL"]
  }'
        ''',
        "search_candidates": '''
# Search for Candidates
curl -X POST "https://api.breakin.com/employer/matching/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Python developer with Django experience",
    "skills": ["Python", "Django"],
    "experience_min": 3,
    "experience_max": 8,
    "location": "San Francisco Bay Area",
    "limit": 20
  }'
        '''
    }
}

# Error codes and descriptions
ERROR_CODES = {
    "AUTH_001": "Invalid or expired authentication token",
    "AUTH_002": "Insufficient permissions for this operation",
    "AUTH_003": "Account suspended or deactivated",
    
    "JOB_001": "Job posting not found",
    "JOB_002": "Invalid job posting data",
    "JOB_003": "Job posting limit exceeded for current plan",
    "JOB_004": "Cannot modify published job posting",
    
    "CANDIDATE_001": "Candidate not found",
    "CANDIDATE_002": "No access to candidate profile",
    "CANDIDATE_003": "Search limit exceeded",
    
    "OFFER_001": "Job offer not found",
    "OFFER_002": "Cannot modify sent offer",
    "OFFER_003": "Offer already accepted or declined",
    
    "BILLING_001": "Payment method required",
    "BILLING_002": "Subscription plan not found",
    "BILLING_003": "Usage limit exceeded",
    
    "RATE_001": "Rate limit exceeded",
    "RATE_002": "Too many concurrent requests",
    
    "VALIDATION_001": "Required field missing",
    "VALIDATION_002": "Invalid field format",
    "VALIDATION_003": "Field value out of range"
}

# Subscription plan limits
SUBSCRIPTION_LIMITS = {
    "basic": {
        "job_postings": 5,
        "candidate_searches": 50,
        "exports": 10,
        "team_members": 3,
        "api_requests_per_minute": 100
    },
    "professional": {
        "job_postings": 25,
        "candidate_searches": 500,
        "exports": 100,
        "team_members": 10,
        "api_requests_per_minute": 500
    },
    "enterprise": {
        "job_postings": "unlimited",
        "candidate_searches": "unlimited",
        "exports": "unlimited",
        "team_members": "unlimited",
        "api_requests_per_minute": 2000
    }
}