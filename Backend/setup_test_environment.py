#!/usr/bin/env python3
"""
BreakIn Employer API - Test Environment Setup Script

This script helps set up the test environment for the employer-side backend API.
It creates sample data, verifies connections, and provides testing utilities.
"""

import os
import sys
import json
import asyncio
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

class TestEnvironmentSetup:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.api_base = f"{self.base_url}"
        self.access_token = None
        self.test_data = {}
        
    def check_server_status(self) -> bool:
        """Check if the server is running"""
        try:
            response = requests.get(f"{self.base_url}/health/healthz", timeout=5)
            if response.status_code == 200:
                print("✅ Server is running")
                return True
            else:
                print(f"❌ Server returned status code: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Server is not running: {e}")
            print("Please start the server with: python -m uvicorn app.main:app --reload")
            return False
    
    def create_test_user(self) -> bool:
        """Create a test user for authentication"""
        test_user = {
            "username": "test_recruiter",
            "email": "test.recruiter@company.com",
            "password": "testpass123"
        }
        
        try:
            # Try to register the user
            response = requests.post(
                f"{self.api_base}/auth/signup",
                json=test_user,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                print("✅ Test user created successfully")
                return True
            elif response.status_code == 400:
                # User might already exist, try to login
                print("ℹ️ Test user already exists")
                return True
            else:
                print(f"❌ Failed to create test user: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error creating test user: {e}")
            return False
    
    def authenticate(self) -> bool:
        """Authenticate and get access token"""
        login_data = {
            "email": "test.recruiter@company.com",
            "password": "testpass123"
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/auth/signin",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("token")
                print("✅ Authentication successful")
                print(f"🔑 Access Token: {self.access_token}")
                return True
            else:
                print(f"❌ Authentication failed: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def create_sample_job(self) -> Optional[str]:
        """Create a sample job posting"""
        job_data = {
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
            "remote_allowed": True,
            "experience_level": "senior"
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/employer/jobs",
                json=job_data,
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                job = response.json()
                job_id = job.get("id")
                self.test_data["job_id"] = job_id
                print(f"✅ Sample job created with ID: {job_id}")
                return job_id
            else:
                print(f"❌ Failed to create sample job: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error creating sample job: {e}")
            return None
    
    def test_dashboard_endpoint(self) -> bool:
        """Test the dashboard overview endpoint"""
        try:
            response = requests.get(
                f"{self.api_base}/employer/dashboard/overview",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Dashboard endpoint working")
                print(f"📊 Dashboard data: {json.dumps(data, indent=2)}")
                return True
            else:
                print(f"❌ Dashboard endpoint failed: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Dashboard endpoint error: {e}")
            return False
    
    def test_search_endpoint(self) -> bool:
        """Test the candidate search endpoint"""
        search_data = {
            "skills": ["Python", "FastAPI"],
            "experience_min": 3,
            "location": "San Francisco, CA",
            "limit": 10
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/employer/matching/search",
                json=search_data,
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Search endpoint working")
                print(f"🔍 Found {len(data.get('candidates', []))} candidates")
                return True
            else:
                print(f"❌ Search endpoint failed: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Search endpoint error: {e}")
            return False
    
    def generate_test_commands(self):
        """Generate curl commands for testing"""
        print("\n" + "="*60)
        print("🧪 TEST COMMANDS")
        print("="*60)
        
        print("\n1. Test Authentication:")
        print(f"curl -X POST {self.api_base}/auth/login \\")
        print('  -H "Content-Type: application/json" \\')
        print('  -d \'{"email": "test.recruiter@company.com", "password": "testpass123"}\'')
        
        if self.access_token:
            print("\n2. Test Job Listing:")
            print(f"curl -X GET {self.api_base}/employer/jobs \\")
            print(f'  -H "Authorization: Bearer {self.access_token}"')
            
            print("\n3. Test Dashboard:")
            print(f"curl -X GET {self.api_base}/employer/dashboard/overview \\")
            print(f'  -H "Authorization: Bearer {self.access_token}"')
            
            print("\n4. Test Candidate Search:")
            print(f"curl -X POST {self.api_base}/employer/matching/search \\")
            print(f'  -H "Authorization: Bearer {self.access_token}" \\')
            print('  -H "Content-Type: application/json" \\')
            print('  -d \'{"skills": ["Python"], "limit": 10}\'')
        
        if self.test_data.get("job_id"):
            print("\n5. Test Specific Job:")
            print(f"curl -X GET {self.api_base}/employer/jobs/{self.test_data['job_id']} \\")
            print(f'  -H "Authorization: Bearer {self.access_token}"')
    
    def save_test_data(self):
        """Save test data to file for later use"""
        test_data = {
            "access_token": self.access_token,
            "base_url": self.base_url,
            "api_base": self.api_base,
            "test_user": {
                "email": "test.recruiter@company.com",
                "password": "testpass123"
            },
            "test_data": self.test_data,
            "created_at": datetime.now().isoformat()
        }
        
        with open("test_session.json", "w") as f:
            json.dump(test_data, f, indent=2)
        
        print(f"\n💾 Test data saved to test_session.json")
    
    def run_setup(self):
        """Run the complete setup process"""
        print("🚀 BreakIn Employer API - Test Environment Setup")
        print("="*60)
        
        # Step 1: Check server status
        print("\n1. Checking server status...")
        if not self.check_server_status():
            return False
        
        # Step 2: Create test user
        print("\n2. Setting up test user...")
        if not self.create_test_user():
            return False
        
        # Step 3: Authenticate
        print("\n3. Authenticating...")
        if not self.authenticate():
            return False
        
        # Step 4: Create sample data
        print("\n4. Creating sample job...")
        self.create_sample_job()
        
        # Step 5: Test key endpoints
        print("\n5. Testing key endpoints...")
        self.test_dashboard_endpoint()
        self.test_search_endpoint()
        
        # Step 6: Generate test commands
        self.generate_test_commands()
        
        # Step 7: Save test data
        self.save_test_data()
        
        print("\n" + "="*60)
        print("✅ SETUP COMPLETE!")
        print("="*60)
        print("\n🎯 Next Steps:")
        print("1. Use the curl commands above to test the API")
        print("2. Open http://localhost:8000/docs for interactive API docs")
        print("3. Run 'pytest app/tests/' to execute the test suite")
        print("4. Check test_session.json for saved test data")
        print("\n📚 Documentation:")
        print("- README_EMPLOYER_API.md - Complete API documentation")
        print("- TESTING_GUIDE.md - Comprehensive testing guide")
        
        return True

def main():
    """Main function"""
    setup = TestEnvironmentSetup()
    
    try:
        success = setup.run_setup()
        if success:
            print("\n🎉 Test environment is ready!")
            sys.exit(0)
        else:
            print("\n❌ Setup failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()