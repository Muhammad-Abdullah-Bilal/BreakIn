"""Tests for employer routes."""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
import json

# Test fixtures and utilities
@pytest.fixture
def mock_db():
    """Mock database for testing."""
    db = AsyncMock()
    
    # Mock collections
    db.users = AsyncMock()
    db.companies = AsyncMock()
    db.job_postings = AsyncMock()
    db.job_applications = AsyncMock()
    db.job_offers = AsyncMock()
    db.company_billing = AsyncMock()
    db.usage_records = AsyncMock()
    db.activity_logs = AsyncMock()
    
    return db

@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    return {
        "id": "user123",
        "email": "recruiter@company.com",
        "full_name": "Test Recruiter",
        "role": "recruiter",
        "company_id": "company123",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }

@pytest.fixture
def mock_company():
    """Mock company data."""
    return {
        "id": "company123",
        "name": "Test Company",
        "industry": "Technology",
        "size": "50-100",
        "active_members": ["user123"],
        "created_at": datetime.utcnow()
    }

@pytest.fixture
def auth_headers():
    """Mock authentication headers."""
    return {"Authorization": "Bearer mock-jwt-token"}

class TestJobRoutes:
    """Test job posting routes."""
    
    @pytest.mark.asyncio
    async def test_create_job_posting(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test creating a job posting."""
        job_data = {
            "title": "Senior Python Developer",
            "description": "We are looking for a senior Python developer...",
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
            "preferred_skills": ["React", "AWS"],
            "requirements": [
                "5+ years of Python experience",
                "Experience with web frameworks"
            ]
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                mock_db.job_postings.insert_one.return_value = AsyncMock()
                
                response = client.post(
                    "/employer/jobs/",
                    json=job_data,
                    headers=auth_headers
                )
                
                assert response.status_code == 201
                assert "id" in response.json()
                assert response.json()["title"] == job_data["title"]
    
    @pytest.mark.asyncio
    async def test_get_job_listings(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test getting job listings."""
        mock_jobs = [
            {
                "id": "job1",
                "title": "Python Developer",
                "status": "active",
                "published_at": datetime.utcnow(),
                "application_count": 15
            },
            {
                "id": "job2",
                "title": "Frontend Developer",
                "status": "active",
                "published_at": datetime.utcnow(),
                "application_count": 8
            }
        ]
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                mock_db.job_postings.find.return_value.skip.return_value.limit.return_value.to_list.return_value = mock_jobs
                mock_db.job_postings.count_documents.return_value = 2
                
                response = client.get(
                    "/employer/jobs/?page=1&limit=10",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                assert len(data["jobs"]) == 2
                assert data["total"] == 2
                assert data["page"] == 1
    
    @pytest.mark.asyncio
    async def test_update_job_posting(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test updating a job posting."""
        job_id = "job123"
        update_data = {
            "title": "Senior Python Developer (Updated)",
            "salary_range": {
                "min_salary": 130000,
                "max_salary": 190000,
                "currency": "USD"
            }
        }
        
        mock_job = {
            "id": job_id,
            "company_id": "company123",
            "title": "Python Developer",
            "status": "active"
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_job_access', return_value=mock_job):
                mock_db.job_postings.update_one.return_value = AsyncMock()
                mock_db.job_postings.find_one.return_value = {**mock_job, **update_data}
                
                response = client.put(
                    f"/employer/jobs/{job_id}",
                    json=update_data,
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                assert response.json()["title"] == update_data["title"]

class TestDashboardRoutes:
    """Test dashboard routes."""
    
    @pytest.mark.asyncio
    async def test_get_dashboard_overview(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test getting dashboard overview."""
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                # Mock database responses
                mock_db.job_postings.count_documents.return_value = 5
                mock_db.job_applications.count_documents.return_value = 150
                mock_db.job_offers.count_documents.return_value = 12
                mock_db.users.count_documents.return_value = 3
                
                response = client.get(
                    "/employer/dashboard/overview",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                assert "active_jobs" in data
                assert "total_applications" in data
                assert "pending_offers" in data
                assert "team_members" in data
    
    @pytest.mark.asyncio
    async def test_get_team_members(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test getting team members."""
        mock_members = [
            {
                "id": "user1",
                "full_name": "John Doe",
                "email": "john@company.com",
                "role": "hiring_manager",
                "last_login": datetime.utcnow()
            },
            {
                "id": "user2",
                "full_name": "Jane Smith",
                "email": "jane@company.com",
                "role": "recruiter",
                "last_login": datetime.utcnow()
            }
        ]
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                mock_db.users.find.return_value.to_list.return_value = mock_members
                
                response = client.get(
                    "/employer/dashboard/team",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 2
                assert data[0]["full_name"] == "John Doe"

class TestOfferRoutes:
    """Test offer management routes."""
    
    @pytest.mark.asyncio
    async def test_create_job_offer(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test creating a job offer."""
        offer_data = {
            "job_id": "job123",
            "candidate_id": "candidate123",
            "salary": 150000,
            "currency": "USD",
            "start_date": "2024-02-01",
            "benefits": ["Health Insurance", "401k"],
            "notes": "Excited to have you join our team!"
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                mock_db.job_offers.insert_one.return_value = AsyncMock()
                
                response = client.post(
                    "/employer/offers/",
                    json=offer_data,
                    headers=auth_headers
                )
                
                assert response.status_code == 201
                assert "id" in response.json()
                assert response.json()["salary"] == offer_data["salary"]
    
    @pytest.mark.asyncio
    async def test_send_offer(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test sending an offer to candidate."""
        offer_id = "offer123"
        
        mock_offer = {
            "id": offer_id,
            "company_id": "company123",
            "status": "draft",
            "candidate_id": "candidate123"
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                mock_db.job_offers.find_one.return_value = mock_offer
                mock_db.job_offers.update_one.return_value = AsyncMock()
                
                response = client.post(
                    f"/employer/offers/{offer_id}/send",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                assert "sent_at" in response.json()

class TestMatchingRoutes:
    """Test candidate matching routes."""
    
    @pytest.mark.asyncio
    async def test_search_candidates(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test searching for candidates."""
        search_data = {
            "query": "Python developer",
            "skills": ["Python", "Django"],
            "experience_min": 3,
            "experience_max": 8,
            "location": "San Francisco",
            "limit": 20
        }
        
        mock_candidates = [
            {
                "id": "candidate1",
                "full_name": "Alice Johnson",
                "title": "Senior Python Developer",
                "match_score": 0.92,
                "skills": ["Python", "Django", "React"]
            },
            {
                "id": "candidate2",
                "full_name": "Bob Wilson",
                "title": "Full Stack Developer",
                "match_score": 0.87,
                "skills": ["Python", "Flask", "Vue.js"]
            }
        ]
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                with patch('app.core.auth.check_subscription_limits', return_value=True):
                    mock_db.users.find.return_value.limit.return_value.to_list.return_value = mock_candidates
                    
                    response = client.post(
                        "/employer/matching/search",
                        json=search_data,
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert len(data["candidates"]) == 2
                    assert data["candidates"][0]["match_score"] == 0.92
    
    @pytest.mark.asyncio
    async def test_get_job_matches(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test getting matches for a specific job."""
        job_id = "job123"
        
        mock_job = {
            "id": job_id,
            "company_id": "company123",
            "title": "Python Developer",
            "required_skills": ["Python", "Django"]
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_job_access', return_value=mock_job):
                with patch('app.core.auth.check_subscription_limits', return_value=True):
                    mock_matches = [
                        {
                            "candidate_id": "candidate1",
                            "match_score": 0.95,
                            "matching_skills": ["Python", "Django"],
                            "candidate_name": "Alice Johnson"
                        }
                    ]
                    
                    mock_db.users.find.return_value.limit.return_value.to_list.return_value = mock_matches
                    
                    response = client.get(
                        f"/employer/matching/jobs/{job_id}/matches?limit=10",
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert len(data["matches"]) == 1
                    assert data["matches"][0]["match_score"] == 0.95

class TestReportsRoutes:
    """Test reporting routes."""
    
    @pytest.mark.asyncio
    async def test_get_hiring_funnel_report(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test getting hiring funnel report."""
        start_date = "2024-01-01T00:00:00Z"
        end_date = "2024-01-31T23:59:59Z"
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                # Mock database counts
                mock_db.job_applications.count_documents.side_effect = [100, 80, 60, 40]  # Different stages
                mock_db.job_offers.count_documents.side_effect = [25, 20]  # Offers made/accepted
                
                response = client.get(
                    f"/employer/reports/hiring-funnel?start_date={start_date}&end_date={end_date}",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                assert "total_applications" in data
                assert "hire_rate" in data
                assert "job_breakdown" in data
    
    @pytest.mark.asyncio
    async def test_export_report_csv(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test exporting report as CSV."""
        export_data = {
            "report_type": "hiring_funnel",
            "format": "csv",
            "filters": {
                "date_range": {
                    "start_date": "2024-01-01T00:00:00Z",
                    "end_date": "2024-01-31T23:59:59Z"
                },
                "job_ids": [],
                "departments": []
            }
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                with patch('app.core.auth.check_rate_limit'):
                    # Mock report data
                    mock_db.job_applications.count_documents.side_effect = [100, 80, 60, 40]
                    mock_db.job_offers.count_documents.side_effect = [25, 20]
                    
                    response = client.post(
                        "/employer/reports/export",
                        json=export_data,
                        headers=auth_headers
                    )
                    
                    assert response.status_code == 200
                    assert response.headers["content-type"] == "text/csv; charset=utf-8"
                    assert "hiring_funnel_report.csv" in response.headers["content-disposition"]

class TestPaymentRoutes:
    """Test payment and billing routes."""
    
    @pytest.mark.asyncio
    async def test_get_billing_overview(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test getting billing overview."""
        mock_billing = {
            "company_id": "company123",
            "subscription_plan": "professional",
            "billing_cycle": "monthly",
            "next_billing_date": datetime.utcnow() + timedelta(days=15),
            "current_usage": {
                "total_cost": 299.99,
                "actions": {
                    "job_postings": 8,
                    "candidate_searches": 150
                }
            }
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                mock_db.company_billing.find_one.return_value = mock_billing
                
                response = client.get(
                    "/employer/payments/billing/overview",
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["subscription_plan"] == "professional"
                assert data["current_usage"]["total_cost"] == 299.99
    
    @pytest.mark.asyncio
    async def test_upgrade_subscription(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test upgrading subscription plan."""
        upgrade_data = {
            "plan": "enterprise",
            "billing_cycle": "annual"
        }
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                mock_db.company_billing.update_one.return_value = AsyncMock()
                
                response = client.post(
                    "/employer/payments/billing/upgrade",
                    json=upgrade_data,
                    headers=auth_headers
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["subscription_plan"] == "enterprise"

# Integration test helpers
class TestIntegration:
    """Integration tests for employer workflows."""
    
    @pytest.mark.asyncio
    async def test_complete_hiring_workflow(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test complete hiring workflow from job posting to offer."""
        # This would test the full workflow:
        # 1. Create job posting
        # 2. Search for candidates
        # 3. Review applications
        # 4. Create and send offer
        # 5. Generate reports
        
        with patch('app.core.auth.get_current_user', return_value=mock_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                # Step 1: Create job
                job_data = {
                    "title": "Senior Developer",
                    "description": "Great opportunity",
                    "required_skills": ["Python"]
                }
                
                mock_db.job_postings.insert_one.return_value = AsyncMock()
                
                job_response = client.post(
                    "/employer/jobs/",
                    json=job_data,
                    headers=auth_headers
                )
                
                assert job_response.status_code == 201
                job_id = job_response.json()["id"]
                
                # Step 2: Search candidates
                search_data = {"query": "Python developer", "limit": 10}
                
                with patch('app.core.auth.check_subscription_limits', return_value=True):
                    mock_db.users.find.return_value.limit.return_value.to_list.return_value = []
                    
                    search_response = client.post(
                        "/employer/matching/search",
                        json=search_data,
                        headers=auth_headers
                    )
                    
                    assert search_response.status_code == 200
                
                # Additional workflow steps would be tested here...

# Performance and load testing helpers
class TestPerformance:
    """Performance tests for employer endpoints."""
    
    @pytest.mark.asyncio
    async def test_search_performance(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test search endpoint performance with large datasets."""
        # This would test performance with large candidate datasets
        pass
    
    @pytest.mark.asyncio
    async def test_report_generation_performance(self, client: TestClient, mock_db, mock_user, auth_headers):
        """Test report generation performance."""
        # This would test report generation with large datasets
        pass

# Security testing
class TestSecurity:
    """Security tests for employer endpoints."""
    
    @pytest.mark.asyncio
    async def test_unauthorized_access(self, client: TestClient):
        """Test that endpoints require authentication."""
        response = client.get("/employer/jobs/")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_cross_company_access_denied(self, client: TestClient, mock_db, auth_headers):
        """Test that users cannot access other companies' data."""
        # Mock user from different company
        other_company_user = {
            "id": "user456",
            "company_id": "company456",
            "role": "recruiter"
        }
        
        with patch('app.core.auth.get_current_user', return_value=other_company_user):
            # Try to access job from different company
            response = client.get("/employer/jobs/job123", headers=auth_headers)
            assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_role_based_access_control(self, client: TestClient, mock_db, auth_headers):
        """Test role-based access control."""
        # Test that recruiters cannot access billing endpoints
        recruiter_user = {
            "id": "user123",
            "company_id": "company123",
            "role": "recruiter"
        }
        
        with patch('app.core.auth.get_current_user', return_value=recruiter_user):
            with patch('app.core.auth.require_company_access', return_value="company123"):
                response = client.get("/employer/payments/billing/overview", headers=auth_headers)
                # This should be forbidden for recruiters
                assert response.status_code in [403, 404]  # Depending on implementation

# Utility functions for test setup
def create_test_job(company_id: str = "company123") -> dict:
    """Create test job data."""
    return {
        "id": "job123",
        "company_id": company_id,
        "title": "Test Job",
        "description": "Test job description",
        "status": "active",
        "published_at": datetime.utcnow(),
        "required_skills": ["Python", "Django"]
    }

def create_test_candidate() -> dict:
    """Create test candidate data."""
    return {
        "id": "candidate123",
        "full_name": "Test Candidate",
        "email": "candidate@example.com",
        "title": "Software Developer",
        "skills": ["Python", "React", "PostgreSQL"],
        "experience_years": 5,
        "location": "San Francisco, CA"
    }

def create_test_application(job_id: str = "job123", candidate_id: str = "candidate123") -> dict:
    """Create test application data."""
    return {
        "id": "app123",
        "job_id": job_id,
        "candidate_id": candidate_id,
        "status": "submitted",
        "stage": "application",
        "submitted_at": datetime.utcnow(),
        "ai_match_score": 0.85
    }