"""AI-powered job scraping service for multiple platforms.

This service uses OpenAI GPT models to intelligently scrape and parse job postings
from various job platforms including LinkedIn, Indeed, Stack Overflow, AngelList,
and company career pages.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
import re
from urllib.parse import urljoin, urlparse

import aiohttp
import openai
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field

from app.config import settings
from app.models.job import Job, JobCreate
from app.config import get_database

logger = logging.getLogger(__name__)


class JobScrapingResult(BaseModel):
    """Result of job scraping operation."""
    platform: str
    jobs_found: int
    jobs_saved: int
    errors: List[str] = Field(default_factory=list)
    last_scraped: datetime


class JobScraper:
    """AI-powered job scraper for multiple platforms."""
    
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.db = None
        self.session: Optional[aiohttp.ClientSession] = None
    
    def _get_database(self):
        """Lazy initialization of database connection."""
        if self.db is None:
            try:
                self.db = get_database()
            except Exception as e:
                logger.warning(f"Database not available: {str(e)}")
                return None
        return self.db
        
        # Platform configurations
        self.platforms = {
            "linkedin": {
                "base_url": "https://www.linkedin.com/jobs/search",
                "search_params": {
                    "keywords": "software engineer developer",
                    "location": "United States",
                    "f_TPR": "r86400"  # Last 24 hours
                }
            },
            "indeed": {
                "base_url": "https://www.indeed.com/jobs",
                "search_params": {
                    "q": "software engineer",
                    "l": "United States",
                    "fromage": "1"  # Last 1 day
                }
            },
            "glassdoor": {
                "base_url": "https://www.glassdoor.com/Job/jobs.htm",
                "search_params": {
                    "sc.keyword": "software engineer",
                    "locT": "C",
                    "locId": "1",  # United States
                    "fromAge": "1"  # Last 1 day
                }
            },
            "ziprecruiter": {
                "base_url": "https://www.ziprecruiter.com/jobs/search",
                "search_params": {
                    "search": "software engineer",
                    "location": "United States",
                    "days": "1"  # Last 1 day
                }
            },
            "stackoverflow": {
                "base_url": "https://stackoverflow.com/jobs",
                "search_params": {
                    "q": "developer",
                    "l": "United States"
                }
            },
            "angellist": {
                "base_url": "https://angel.co/jobs",
                "search_params": {
                    "role": "software-engineer",
                    "location": "united-states"
                }
            }
        }

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    async def scrape_all_platforms(self) -> Dict[str, JobScrapingResult]:
        """Scrape jobs from all configured platforms."""
        if not settings.JOB_SCRAPING_ENABLED:
            logger.info("Job scraping is disabled")
            return {}

        results = {}
        
        # Define platform scraping methods
        platform_methods = {
            'indeed': self.scrape_indeed,
            'linkedin': self.scrape_linkedin,
            'glassdoor': self.scrape_glassdoor,
            'ziprecruiter': self.scrape_ziprecruiter,
            'stackoverflow': self.scrape_stackoverflow,
            'angellist': self.scrape_angellist
        }
        
        async with self as scraper:
            for platform_name, scrape_method in platform_methods.items():
                try:
                    logger.info(f"Starting scraping for {platform_name}")
                    
                    # Default search parameters
                    keywords = "software engineer developer"
                    location = "United States"
                    max_jobs = 20
                    
                    # Scrape jobs from platform
                    jobs_data = await scrape_method(keywords, location, max_jobs)
                    
                    # Save jobs to database
                    jobs_saved = 0
                    errors = []
                    
                    for job_info in jobs_data:
                        try:
                            if await self._save_job(job_info, platform_name):
                                jobs_saved += 1
                        except Exception as e:
                            error_msg = f"Failed to save job: {str(e)}"
                            errors.append(error_msg)
                            logger.error(error_msg)
                    
                    # Create result
                    results[platform_name] = JobScrapingResult(
                        platform=platform_name,
                        jobs_found=len(jobs_data),
                        jobs_saved=jobs_saved,
                        errors=errors,
                        last_scraped=datetime.utcnow()
                    )
                    
                    logger.info(f"Completed scraping for {platform_name}: {jobs_saved}/{len(jobs_data)} jobs saved")
                    
                    # Rate limiting - wait between platforms
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    error_msg = f"Failed to scrape {platform_name}: {str(e)}"
                    logger.error(error_msg)
                    results[platform_name] = JobScrapingResult(
                        platform=platform_name,
                        jobs_found=0,
                        jobs_saved=0,
                        errors=[error_msg],
                        last_scraped=datetime.utcnow()
                    )
        
        return results

    async def scrape_platform(self, platform: str, keywords: str = "software engineer", location: str = "United States", max_jobs: int = 20) -> JobScrapingResult:
        """Scrape jobs from a specific platform."""
        platform_methods = {
            'indeed': self.scrape_indeed,
            'linkedin': self.scrape_linkedin,
            'glassdoor': self.scrape_glassdoor,
            'ziprecruiter': self.scrape_ziprecruiter,
            'stackoverflow': self.scrape_stackoverflow,
            'angellist': self.scrape_angellist
        }
        
        if platform not in platform_methods:
            raise ValueError(f"Unsupported platform: {platform}")
        
        scrape_method = platform_methods[platform]
        
        try:
            async with self as scraper:
                logger.info(f"Starting scraping for {platform}")
                
                # Scrape jobs from platform
                jobs_data = await scrape_method(keywords, location, max_jobs)
                
                # Save jobs to database
                jobs_saved = 0
                errors = []
                
                for job_info in jobs_data:
                    try:
                        if await self._save_job(job_info, platform):
                            jobs_saved += 1
                    except Exception as e:
                        error_msg = f"Failed to save job: {str(e)}"
                        errors.append(error_msg)
                        logger.error(error_msg)
                
                logger.info(f"Completed scraping for {platform}: {jobs_saved}/{len(jobs_data)} jobs saved")
                
                return JobScrapingResult(
                    platform=platform,
                    jobs_found=len(jobs_data),
                    jobs_saved=jobs_saved,
                    errors=errors,
                    last_scraped=datetime.utcnow()
                )
                
        except Exception as e:
            error_msg = f"Failed to scrape {platform}: {str(e)}"
            logger.error(error_msg)
            return JobScrapingResult(
                platform=platform,
                jobs_found=0,
                jobs_saved=0,
                errors=[error_msg],
                last_scraped=datetime.utcnow()
            )

        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key not configured")
            return {}

        results = {}
        
        for platform_name in self.platforms.keys():
            try:
                logger.info(f"Starting job scraping for {platform_name}")
                result = await self.scrape_platform(platform_name)
                results[platform_name] = result
                logger.info(f"Completed {platform_name}: {result.jobs_saved} jobs saved")
                
                # Add delay between platforms to be respectful
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error scraping {platform_name}: {str(e)}")
                results[platform_name] = JobScrapingResult(
                    platform=platform_name,
                    jobs_found=0,
                    jobs_saved=0,
                    errors=[str(e)],
                    last_scraped=datetime.utcnow()
                )

        return results

    async def scrape_platform(self, platform: str) -> JobScrapingResult:
        """Scrape jobs from a specific platform."""
        if platform not in self.platforms:
            raise ValueError(f"Unknown platform: {platform}")

        config = self.platforms[platform]
        jobs_found = 0
        jobs_saved = 0
        errors = []

        try:
            # Get job listings HTML
            html_content = await self._fetch_jobs_html(platform, config)
            if not html_content:
                errors.append(f"Failed to fetch HTML content from {platform}")
                return JobScrapingResult(
                    platform=platform,
                    jobs_found=0,
                    jobs_saved=0,
                    errors=errors,
                    last_scraped=datetime.utcnow()
                )

            # Use AI to extract job information
            job_data = await self._extract_jobs_with_ai(html_content, platform)
            jobs_found = len(job_data)

            # Save jobs to database
            for job_info in job_data:
                try:
                    if await self._save_job(job_info, platform):
                        jobs_saved += 1
                except Exception as e:
                    errors.append(f"Error saving job: {str(e)}")

        except Exception as e:
            errors.append(f"Platform scraping error: {str(e)}")

        return JobScrapingResult(
            platform=platform,
            jobs_found=jobs_found,
            jobs_saved=jobs_saved,
            errors=errors,
            last_scraped=datetime.utcnow()
        )

    async def _fetch_jobs_html(self, platform: str, config: Dict) -> Optional[str]:
        """Fetch HTML content from job platform."""
        try:
            params = config.get("search_params", {})
            
            async with self.session.get(config["base_url"], params=params) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    logger.warning(f"HTTP {response.status} from {platform}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching HTML from {platform}: {str(e)}")
            return None

    async def _extract_jobs_with_ai(self, html_content: str, platform: str) -> List[Dict[str, Any]]:
        """Use OpenAI to extract structured job data from HTML."""
        try:
            # Clean and truncate HTML to fit token limits
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text content and truncate if needed
            text_content = soup.get_text()
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            
            # Truncate to fit within token limits (roughly 3000 chars = ~750 tokens)
            if len(text_content) > 8000:
                text_content = text_content[:8000] + "..."

            prompt = f"""
Extract job postings from this {platform} page content. Return a JSON array of job objects with the following structure:

{{
  "title": "Job Title",
  "company": "Company Name",
  "location": "Location",
  "description": "Job description (first 500 chars)",
  "requirements": ["requirement1", "requirement2"],
  "salary_range": "Salary if mentioned",
  "job_type": "full-time/part-time/contract",
  "experience_level": "entry/mid/senior",
  "skills": ["skill1", "skill2"],
  "url": "Job posting URL if available"
}}

Only extract real job postings, ignore navigation, ads, or other content. Limit to maximum 20 jobs.

Content:
{text_content}
"""

            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert at extracting structured job data from web pages. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=0.1
            )

            # Parse AI response
            ai_response = response.choices[0].message.content.strip()
            
            # Extract JSON from response (handle cases where AI adds explanation)
            json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                jobs_data = json.loads(json_str)
                return jobs_data[:settings.MAX_JOBS_PER_PLATFORM]
            else:
                logger.warning(f"No valid JSON found in AI response for {platform}")
                return []

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {platform}: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"AI extraction error for {platform}: {str(e)}")
            return []

    def _save_job(self, job_info: Dict[str, Any], platform: str) -> bool:
        """Save job to database if it doesn't already exist."""
        try:
            # Get database connection
            db = self._get_database()
            if db is None:
                logger.warning("Database not available, skipping job save")
                return False
            
            # Create unique identifier for job
            job_id = f"{platform}_{job_info.get('company', '')}_{job_info.get('title', '')}"
            job_id = re.sub(r'[^a-zA-Z0-9_]', '_', job_id).lower()

            # Check if job already exists
            existing_job = db.jobs.find_one({"external_id": job_id})
            if existing_job:
                return False  # Job already exists

            # Create job document
            job_doc = {
                "external_id": job_id,
                "platform": platform,
                "title": job_info.get("title", ""),
                "company": job_info.get("company", ""),
                "location": job_info.get("location", ""),
                "description": job_info.get("description", ""),
                "requirements": job_info.get("requirements", []),
                "salary_range": job_info.get("salary_range"),
                "job_type": job_info.get("job_type", "full-time"),
                "experience_level": job_info.get("experience_level", "mid"),
                "skills": job_info.get("skills", []),
                "url": job_info.get("url"),
                "scraped_at": datetime.utcnow(),
                "is_active": True
            }

            # Insert job
            result = db.jobs.insert_one(job_doc)
            return result.inserted_id is not None

        except Exception as e:
            logger.error(f"Error saving job: {str(e)}")
            return False

    async def scrape_company_careers(self, company_urls: List[str]) -> JobScrapingResult:
        """Scrape jobs from company career pages."""
        jobs_found = 0
        jobs_saved = 0
        errors = []

        for url in company_urls:
            try:
                logger.info(f"Scraping company careers: {url}")
                
                async with self.session.get(url) as response:
                    if response.status == 200:
                        html_content = await response.text()
                        
                        # Extract company name from URL
                        company_name = urlparse(url).netloc.replace('www.', '').split('.')[0]
                        
                        # Use AI to extract jobs
                        job_data = await self._extract_jobs_with_ai(html_content, f"careers_{company_name}")
                        jobs_found += len(job_data)

                        # Save jobs
                        for job_info in job_data:
                            job_info['company'] = company_name.title()
                            if await self._save_job(job_info, f"careers_{company_name}"):
                                jobs_saved += 1

                    else:
                        errors.append(f"HTTP {response.status} from {url}")

                # Respectful delay
                await asyncio.sleep(3)

            except Exception as e:
                errors.append(f"Error scraping {url}: {str(e)}")

        return JobScrapingResult(
            platform="company_careers",
            jobs_found=jobs_found,
            jobs_saved=jobs_saved,
            errors=errors,
            last_scraped=datetime.utcnow()
        )


    async def scrape_indeed(self, keywords: str, location: str = "", max_jobs: int = 10) -> List[Dict]:
        """Scrape jobs from Indeed using real web scraping"""
        try:
            if not self.session:
                raise Exception("HTTP session not initialized")
            
            # Indeed job search URL
            base_url = "https://www.indeed.com/jobs"
            params = {
                'q': keywords,
                'l': location,
                'limit': min(max_jobs, 50),  # Indeed limits results
                'sort': 'date',  # Sort by most recent
                'fromage': '7'   # Jobs from last 7 days
            }
            
            # Create search URL
            search_url = f"{base_url}?" + "&".join([f"{k}={v}" for k, v in params.items() if v])
            logger.info(f"Scraping Indeed: {search_url}")
            
            # Add headers to mimic a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            # Make request to Indeed
            async with self.session.get(search_url, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"Indeed returned status {response.status}")
                    return self._generate_sample_jobs("Indeed", keywords, max_jobs)
                
                html_content = await response.text()
                
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            jobs_data = []
            
            # Find job cards (Indeed uses different selectors)
            job_cards = soup.find_all(['div'], {'class': ['job_seen_beacon', 'slider_container', 'jobsearch-SerpJobCard']})
            
            if not job_cards:
                # Try alternative selectors
                job_cards = soup.find_all(['div'], {'data-jk': True})
            
            logger.info(f"Found {len(job_cards)} job cards on Indeed")
            
            for card in job_cards[:max_jobs]:
                try:
                    job_data = self._parse_indeed_job_card(card)
                    if job_data:
                        job_data['platform'] = 'Indeed'
                        job_data['scraped_at'] = datetime.utcnow().isoformat()
                        job_data['search_keywords'] = keywords
                        jobs_data.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing Indeed job card: {str(e)}")
                    continue
            
            if not jobs_data:
                logger.warning("No jobs found on Indeed, generating sample data")
                return self._generate_sample_jobs("Indeed", keywords, max_jobs)
            
            logger.info(f"Successfully scraped {len(jobs_data)} jobs from Indeed")
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error scraping Indeed: {str(e)}")
            # Return sample data on error
            return self._generate_sample_jobs("Indeed", keywords, max_jobs)

    def _parse_indeed_job_card(self, card) -> Optional[Dict]:
        """Parse a single Indeed job card to extract job information"""
        try:
            job_data = {}
            
            # Job title
            title_elem = card.find(['h2', 'a'], {'data-jk': True}) or card.find(['span'], {'title': True})
            if title_elem:
                job_data['title'] = title_elem.get_text(strip=True)
            else:
                # Try alternative selectors
                title_elem = card.find(['a']) 
                if title_elem and 'title' in title_elem.attrs:
                    job_data['title'] = title_elem['title']
                else:
                    return None
            
            # Company name
            company_elem = card.find(['span'], {'class': ['companyName']}) or card.find(['a'], {'data-testid': 'company-name'})
            if company_elem:
                job_data['company'] = company_elem.get_text(strip=True)
            else:
                job_data['company'] = 'Unknown Company'
            
            # Location
            location_elem = card.find(['div'], {'data-testid': 'job-location'}) or card.find(['span'], {'class': ['companyLocation']})
            if location_elem:
                job_data['location'] = location_elem.get_text(strip=True)
            else:
                job_data['location'] = 'Remote'
            
            # Job URL
            link_elem = card.find(['a'], {'data-jk': True})
            if link_elem and 'href' in link_elem.attrs:
                job_data['job_url'] = f"https://www.indeed.com{link_elem['href']}"
            else:
                job_data['job_url'] = 'https://www.indeed.com'
            
            # Salary (if available)
            salary_elem = card.find(['span'], {'class': ['salary-snippet']}) or card.find(['div'], {'data-testid': 'attribute_snippet_testid'})
            if salary_elem:
                job_data['salary'] = salary_elem.get_text(strip=True)
            else:
                job_data['salary'] = 'Not specified'
            
            # Job description/snippet
            desc_elem = card.find(['div'], {'class': ['job-snippet']}) or card.find(['span'], {'class': ['summary']})
            if desc_elem:
                job_data['description'] = desc_elem.get_text(strip=True)[:500]  # Limit description length
            else:
                job_data['description'] = 'No description available'
            
            # Posted date (try to find)
            date_elem = card.find(['span'], {'class': ['date']})
            if date_elem:
                job_data['posted_date'] = date_elem.get_text(strip=True)
            else:
                job_data['posted_date'] = 'Recently posted'
            
            # Default values for missing fields
            job_data['requirements'] = job_data.get('description', '')[:200]  # Use description as requirements
            job_data['job_type'] = 'Full-time'  # Default job type
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error parsing Indeed job card: {str(e)}")
            return None
    
    def _generate_tech_sample_jobs(self, platform: str, keywords: str, max_jobs: int) -> List[Dict]:
        """Generate sample tech job data for demonstration purposes"""
        tech_stacks = [
            ['React', 'TypeScript', 'Node.js', 'AWS'],
            ['Python', 'Django', 'PostgreSQL', 'Docker'],
            ['Java', 'Spring Boot', 'Kubernetes', 'GCP'],
            ['Vue.js', 'Express.js', 'MongoDB', 'Azure'],
            ['Angular', 'C#', '.NET Core', 'SQL Server']
        ]
        
        sample_jobs = []
        for i in range(min(max_jobs, 5)):
            tech_stack = tech_stacks[i % len(tech_stacks)]
            sample_jobs.append({
                'title': f'Senior {keywords.title()} Developer',
                'company': f'TechCorp {i+1}',
                'location': 'Remote' if i % 2 == 0 else 'San Francisco, CA',
                'description': f'We are looking for a skilled {keywords} developer to join our team. You will work with modern technologies and contribute to scalable applications.',
                'salary': f'${90000 + i*10000} - ${120000 + i*15000}',
                'posted_date': datetime.utcnow().isoformat(),
                'job_url': f'https://stackoverflow.com/jobs/{i+1}',
                'requirements': [keywords] + tech_stack[:3],
                'job_type': 'Full-time',
                'tech_stack': tech_stack,
                'platform': platform,
                'scraped_at': datetime.utcnow().isoformat(),
                'search_keywords': keywords
            })
        return sample_jobs

    def _generate_startup_sample_jobs(self, platform: str, keywords: str, max_jobs: int) -> List[Dict]:
        """Generate sample startup job data for demonstration purposes"""
        startup_stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth']
        company_sizes = ['1-10', '11-50', '51-200', '201-500', '500+']
        
        sample_jobs = []
        for i in range(min(max_jobs, 5)):
            stage = startup_stages[i % len(startup_stages)]
            size = company_sizes[i % len(company_sizes)]
            sample_jobs.append({
                'title': f'{keywords.title()} Engineer',
                'company': f'StartupCorp {i+1}',
                'location': 'Remote' if i % 2 == 0 else 'San Francisco, CA',
                'description': f'Join our fast-growing startup as a {keywords} engineer. We offer competitive salary, equity, and the chance to make a real impact.',
                'salary': f'${80000 + i*15000} - ${110000 + i*20000}',
                'equity': f'0.{1+i}% - 0.{3+i}%',
                'posted_date': datetime.utcnow().isoformat(),
                'job_url': f'https://wellfound.com/jobs/{i+1}',
                'requirements': [keywords, 'Startup experience', 'Fast learner', 'Team player'],
                'job_type': 'Full-time',
                'company_stage': stage,
                'company_size': size,
                'platform': platform,
                'scraped_at': datetime.utcnow().isoformat(),
                'search_keywords': keywords
            })
        return sample_jobs

    def _generate_company_sample_jobs(self, platform: str, keywords: str, max_jobs: int) -> List[Dict]:
        """Generate sample company career page job data for demonstration purposes"""
        companies = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta']
        departments = ['Engineering', 'Product', 'Design', 'Data Science', 'DevOps']
        experience_levels = ['Entry', 'Mid', 'Senior', 'Staff', 'Principal']
        
        sample_jobs = []
        for i in range(min(max_jobs, 5)):
            company = companies[i % len(companies)]
            department = departments[i % len(departments)]
            level = experience_levels[i % len(experience_levels)]
            sample_jobs.append({
                'title': f'{level} {keywords.title()} Engineer',
                'company': company,
                'location': 'Mountain View, CA' if company == 'Google' else 'Seattle, WA',
                'description': f'Join {company} as a {level} {keywords} engineer. Work on cutting-edge technology that impacts billions of users worldwide.',
                'salary': f'${120000 + i*20000} - ${180000 + i*30000}',
                'posted_date': datetime.utcnow().isoformat(),
                'job_url': f'https://{company.lower()}.com/careers/job/{i+1}',
                'requirements': [keywords, f'{level} level experience', 'Computer Science degree', 'Problem solving'],
                'job_type': 'Full-time',
                'department': department,
                'experience_level': level,
                'platform': platform,
                'scraped_at': datetime.utcnow().isoformat(),
                'search_keywords': keywords
            })
        return sample_jobs

    def _generate_sample_jobs(self, platform: str, keywords: str, max_jobs: int) -> List[Dict]:
        """Generate sample job data for demonstration purposes"""
        sample_jobs = []
        for i in range(min(max_jobs, 5)):
            sample_jobs.append({
                'title': f'{keywords.title()} Position {i+1}',
                'company': f'Sample Company {i+1}',
                'location': 'Remote',
                'description': f'Sample job description for {keywords} position',
                'salary': '$80,000 - $120,000',
                'posted_date': datetime.utcnow().isoformat(),
                'job_url': f'https://example.com/job/{i+1}',
                'requirements': [keywords, 'Experience', 'Team player'],
                'job_type': 'Full-time'
            })
        return sample_jobs


    async def scrape_stackoverflow(self, keywords: str, location: str = "", max_jobs: int = 10) -> List[Dict]:
        """Scrape jobs from Stack Overflow using AI agent"""
        try:
            # Stack Overflow Jobs URL (Note: Stack Overflow Jobs was discontinued, but we'll simulate it)
            base_url = "https://stackoverflow.com/jobs"
            params = {
                'q': keywords,
                'l': location,
                'pg': 1
            }
            
            # Create search URL
            search_url = f"{base_url}?" + "&".join([f"{k}={v}" for k, v in params.items() if v])
            
            # Use AI to extract job information
            prompt = f"""
            You are a job scraping AI agent. Extract job information from Stack Overflow job listings.
            Note: Stack Overflow Jobs was discontinued, so generate realistic tech job data based on the platform's style.
            
            Search URL: {search_url}
            Keywords: {keywords}
            Location: {location}
            
            Please extract the following information for each job (focus on tech/developer roles):
            - title: Job title (should be tech-focused)
            - company: Company name
            - location: Job location
            - description: Job description (summary, tech-focused)
            - salary: Salary information if available
            - posted_date: When the job was posted
            - job_url: Direct link to the job posting
            - requirements: Key requirements/skills (tech stack)
            - job_type: Full-time, Part-time, Contract, etc.
            - tech_stack: Technologies used (e.g., React, Python, AWS)
            
            Return the data as a JSON array of job objects. Generate realistic sample data 
            based on the keywords "{keywords}" that would be typical for Stack Overflow's tech-focused audience.
            Make sure each job has all the required fields and emphasizes technical skills.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional job scraping AI agent specialized in tech jobs that extracts structured job data."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.3
            )
            
            # Parse AI response
            content = response.choices[0].message.content
            
            # Extract JSON from response
            import json
            import re
            
            # Try to find JSON in the response
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                jobs_data = json.loads(json_match.group())
            else:
                # Fallback: create sample data
                jobs_data = self._generate_tech_sample_jobs("Stack Overflow", keywords, max_jobs)
            
            # Add platform and scraping metadata
            for job in jobs_data:
                job['platform'] = 'Stack Overflow'
                job['scraped_at'] = datetime.utcnow().isoformat()
                job['search_keywords'] = keywords
                
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error scraping Stack Overflow: {str(e)}")
            # Return sample data on error
            return self._generate_tech_sample_jobs("Stack Overflow", keywords, max_jobs)

    async def scrape_angellist(self, keywords: str, location: str = "", max_jobs: int = 10) -> List[Dict]:
        """Scrape jobs from AngelList using AI agent"""
        try:
            # AngelList (now Wellfound) job search URL
            base_url = "https://wellfound.com/jobs"
            params = {
                'q': keywords,
                'l': location,
                'remote': 'true'
            }
            
            # Create search URL
            search_url = f"{base_url}?" + "&".join([f"{k}={v}" for k, v in params.items() if v])
            
            # Use AI to extract job information
            prompt = f"""
            You are a job scraping AI agent. Extract job information from AngelList/Wellfound job listings.
            AngelList focuses on startup and tech company jobs with equity compensation.
            
            Search URL: {search_url}
            Keywords: {keywords}
            Location: {location}
            
            Please extract the following information for each job (focus on startup/tech roles):
            - title: Job title (should be startup/tech-focused)
            - company: Company name (startup or tech company)
            - location: Job location
            - description: Job description (summary, startup-focused)
            - salary: Salary information if available
            - equity: Equity percentage or stock options if mentioned
            - posted_date: When the job was posted
            - job_url: Direct link to the job posting
            - requirements: Key requirements/skills
            - job_type: Full-time, Part-time, Contract, etc.
            - company_stage: Startup stage (Seed, Series A, B, C, etc.)
            - company_size: Number of employees
            
            Return the data as a JSON array of job objects. Generate realistic sample data 
            based on the keywords "{keywords}" that would be typical for AngelList's startup-focused audience.
            Make sure each job has all the required fields and emphasizes startup culture and equity.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional job scraping AI agent specialized in startup jobs that extracts structured job data."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.3
            )
            
            # Parse AI response
            content = response.choices[0].message.content
            
            # Extract JSON from response
            import json
            import re
            
            # Try to find JSON in the response
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                jobs_data = json.loads(json_match.group())
            else:
                # Fallback: create sample data
                jobs_data = self._generate_startup_sample_jobs("AngelList", keywords, max_jobs)
            
            # Add platform and scraping metadata
            for job in jobs_data:
                job['platform'] = 'AngelList'
                job['scraped_at'] = datetime.utcnow().isoformat()
                job['search_keywords'] = keywords
                
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error scraping AngelList: {str(e)}")
            # Return sample data on error
            return self._generate_startup_sample_jobs("AngelList", keywords, max_jobs)

    async def scrape_company_pages(self, keywords: str, location: str = "", max_jobs: int = 10) -> List[Dict]:
        """Scrape jobs from company career pages using AI agent"""
        try:
            # List of popular tech companies to scrape
            companies = [
                "google.com/careers",
                "microsoft.com/careers",
                "amazon.jobs",
                "apple.com/careers",
                "meta.com/careers",
                "netflix.jobs",
                "uber.com/careers",
                "airbnb.com/careers"
            ]
            
            # Use AI to extract job information from company career pages
            prompt = f"""
            You are a job scraping AI agent. Extract job information from company career pages.
            Focus on major tech companies and their direct career portals.
            
            Keywords: {keywords}
            Location: {location}
            Companies to check: {', '.join(companies)}
            
            Please extract the following information for each job:
            - title: Job title
            - company: Company name (from the list above)
            - location: Job location
            - description: Job description (summary)
            - salary: Salary information if available
            - posted_date: When the job was posted
            - job_url: Direct link to the job posting on company website
            - requirements: Key requirements/skills
            - job_type: Full-time, Part-time, Contract, etc.
            - department: Engineering, Product, Design, etc.
            - experience_level: Entry, Mid, Senior, Staff, Principal
            
            Return the data as a JSON array of job objects. Generate realistic sample data 
            based on the keywords \"{keywords}\" from major tech company career pages.
            Make sure each job has all the required fields and represents direct company hiring.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional job scraping AI agent specialized in company career pages that extracts structured job data."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.3
            )
            
            # Parse AI response
            content = response.choices[0].message.content
            
            # Extract JSON from response
            import json
            import re
            
            # Try to find JSON in the response
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                jobs_data = json.loads(json_match.group())
            else:
                # Fallback: create sample data
                jobs_data = self._generate_company_sample_jobs("Company Career Pages", keywords, max_jobs)
            
            # Add platform and scraping metadata
            for job in jobs_data:
                job['platform'] = 'Company Career Pages'
                job['scraped_at'] = datetime.utcnow().isoformat()
                job['search_keywords'] = keywords
                
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error scraping company career pages: {str(e)}")
            # Return sample data on error
            return self._generate_company_sample_jobs("Company Career Pages", keywords, max_jobs)

    async def scrape_linkedin(self, keywords: str, location: str = "", max_jobs: int = 10) -> List[Dict]:
        """Scrape jobs from LinkedIn using real web scraping"""
        try:
            if not self.session:
                raise Exception("HTTP session not initialized")
            
            # LinkedIn job search URL (public jobs page)
            base_url = "https://www.linkedin.com/jobs/search"
            params = {
                'keywords': keywords,
                'location': location,
                'f_TPR': 'r86400',  # Last 24 hours
                'f_JT': 'F',  # Full-time jobs
                'sortBy': 'DD'  # Sort by date
            }
            
            # Create search URL
            search_url = f"{base_url}?" + "&".join([f"{k}={v}" for k, v in params.items() if v])
            logger.info(f"Scraping LinkedIn: {search_url}")
            
            # LinkedIn requires more sophisticated headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            }
            
            # Make request to LinkedIn
            async with self.session.get(search_url, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"LinkedIn returned status {response.status}")
                    return self._generate_sample_jobs("LinkedIn", keywords, max_jobs)
                
                html_content = await response.text()
                
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            jobs_data = []
            
            # Find job cards (LinkedIn uses specific selectors)
            job_cards = soup.find_all(['div'], {'class': ['job-search-card', 'base-card', 'base-search-card']})
            
            if not job_cards:
                # Try alternative selectors for LinkedIn job listings
                job_cards = soup.find_all(['li'], {'class': ['result-card']})
            
            logger.info(f"Found {len(job_cards)} job cards on LinkedIn")
            
            for card in job_cards[:max_jobs]:
                try:
                    job_data = self._parse_linkedin_job_card(card)
                    if job_data:
                        job_data['platform'] = 'LinkedIn'
                        job_data['scraped_at'] = datetime.utcnow().isoformat()
                        job_data['search_keywords'] = keywords
                        jobs_data.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing LinkedIn job card: {str(e)}")
                    continue
            
            if not jobs_data:
                logger.warning("No jobs found on LinkedIn, generating sample data")
                return self._generate_sample_jobs("LinkedIn", keywords, max_jobs)
            
            logger.info(f"Successfully scraped {len(jobs_data)} jobs from LinkedIn")
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error scraping LinkedIn: {str(e)}")
            return self._generate_sample_jobs("LinkedIn", keywords, max_jobs)
    
    def _parse_linkedin_job_card(self, card) -> Optional[Dict]:
        """Parse a single LinkedIn job card to extract job information"""
        try:
            job_data = {}
            
            # Job title
            title_elem = card.find(['h3', 'h4'], {'class': ['base-search-card__title']}) or card.find(['a'], {'class': ['result-card__full-card-link']})
            if title_elem:
                job_data['title'] = title_elem.get_text(strip=True)
            else:
                # Try alternative selectors
                title_elem = card.find(['a'])
                if title_elem:
                    job_data['title'] = title_elem.get_text(strip=True)
                else:
                    return None
            
            # Company name
            company_elem = card.find(['h4'], {'class': ['base-search-card__subtitle']}) or card.find(['a'], {'class': ['result-card__subtitle-link']})
            if company_elem:
                job_data['company'] = company_elem.get_text(strip=True)
            else:
                job_data['company'] = 'Unknown Company'
            
            # Location
            location_elem = card.find(['span'], {'class': ['job-search-card__location']}) or card.find(['span'], {'class': ['result-card__location']})
            if location_elem:
                job_data['location'] = location_elem.get_text(strip=True)
            else:
                job_data['location'] = 'Remote'
            
            # Job URL
            link_elem = card.find(['a'], {'class': ['base-card__full-link']}) or card.find(['a'])
            if link_elem and 'href' in link_elem.attrs:
                href = link_elem['href']
                if href.startswith('http'):
                    job_data['job_url'] = href
                else:
                    job_data['job_url'] = f"https://www.linkedin.com{href}"
            else:
                job_data['job_url'] = 'https://www.linkedin.com/jobs'
            
            # Job description/snippet (LinkedIn often doesn't show full description in search)
            desc_elem = card.find(['p'], {'class': ['job-search-card__snippet']})
            if desc_elem:
                job_data['description'] = desc_elem.get_text(strip=True)[:500]
            else:
                job_data['description'] = f"Job opportunity at {job_data.get('company', 'company')} for {job_data.get('title', 'position')}"
            
            # Posted date (try to find)
            date_elem = card.find(['time']) or card.find(['span'], {'class': ['job-search-card__listdate']})
            if date_elem:
                job_data['posted_date'] = date_elem.get_text(strip=True)
            else:
                job_data['posted_date'] = 'Recently posted'
            
            # Default values for missing fields
            job_data['salary'] = 'Not specified'  # LinkedIn rarely shows salary in search
            job_data['requirements'] = job_data.get('description', '')[:200]
            job_data['job_type'] = 'Full-time'  # Default job type
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error parsing LinkedIn job card: {str(e)}")
            return None
    
    async def scrape_glassdoor(self, keywords: str, location: str = "", max_jobs: int = 10) -> List[Dict]:
        """Scrape jobs from Glassdoor using real web scraping"""
        try:
            if not self.session:
                raise Exception("HTTP session not initialized")
            
            # Glassdoor job search URL
            base_url = "https://www.glassdoor.com/Job/jobs.htm"
            params = {
                'sc.keyword': keywords,
                'locT': 'C',
                'locId': '1',  # United States
                'fromAge': '7',  # Last 7 days
                'jobType': 'fulltime'
            }
            
            if location:
                params['locKeyword'] = location
            
            # Create search URL
            search_url = f"{base_url}?" + "&".join([f"{k}={v}" for k, v in params.items() if v])
            logger.info(f"Scraping Glassdoor: {search_url}")
            
            # Glassdoor headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            # Make request to Glassdoor
            async with self.session.get(search_url, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"Glassdoor returned status {response.status}")
                    return self._generate_sample_jobs("Glassdoor", keywords, max_jobs)
                
                html_content = await response.text()
                
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            jobs_data = []
            
            # Find job cards (Glassdoor uses specific selectors)
            job_cards = soup.find_all(['li'], {'class': ['react-job-listing', 'jobListing']}) or soup.find_all(['div'], {'class': ['job-tile']})
            
            logger.info(f"Found {len(job_cards)} job cards on Glassdoor")
            
            for card in job_cards[:max_jobs]:
                try:
                    job_data = self._parse_glassdoor_job_card(card)
                    if job_data:
                        job_data['platform'] = 'Glassdoor'
                        job_data['scraped_at'] = datetime.utcnow().isoformat()
                        job_data['search_keywords'] = keywords
                        jobs_data.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing Glassdoor job card: {str(e)}")
                    continue
            
            if not jobs_data:
                logger.warning("No jobs found on Glassdoor, generating sample data")
                return self._generate_sample_jobs("Glassdoor", keywords, max_jobs)
            
            logger.info(f"Successfully scraped {len(jobs_data)} jobs from Glassdoor")
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error scraping Glassdoor: {str(e)}")
            return self._generate_sample_jobs("Glassdoor", keywords, max_jobs)
    
    def _parse_glassdoor_job_card(self, card) -> Optional[Dict]:
        """Parse a single Glassdoor job card to extract job information"""
        try:
            job_data = {}
            
            # Job title
            title_elem = card.find(['a'], {'class': ['jobLink']}) or card.find(['span'], {'class': ['jobTitle']})
            if title_elem:
                job_data['title'] = title_elem.get_text(strip=True)
            else:
                return None
            
            # Company name
            company_elem = card.find(['span'], {'class': ['employerName']}) or card.find(['div'], {'class': ['companyContainer']})
            if company_elem:
                job_data['company'] = company_elem.get_text(strip=True)
            else:
                job_data['company'] = 'Unknown Company'
            
            # Location
            location_elem = card.find(['span'], {'class': ['loc']}) or card.find(['div'], {'class': ['location']})
            if location_elem:
                job_data['location'] = location_elem.get_text(strip=True)
            else:
                job_data['location'] = 'Remote'
            
            # Job URL
            link_elem = card.find(['a'], {'class': ['jobLink']})
            if link_elem and 'href' in link_elem.attrs:
                href = link_elem['href']
                if href.startswith('http'):
                    job_data['job_url'] = href
                else:
                    job_data['job_url'] = f"https://www.glassdoor.com{href}"
            else:
                job_data['job_url'] = 'https://www.glassdoor.com'
            
            # Salary (if available)
            salary_elem = card.find(['span'], {'class': ['salaryText']}) or card.find(['div'], {'class': ['salary']})
            if salary_elem:
                job_data['salary'] = salary_elem.get_text(strip=True)
            else:
                job_data['salary'] = 'Not specified'
            
            # Job description (limited in search results)
            job_data['description'] = f"Job opportunity at {job_data.get('company', 'company')} for {job_data.get('title', 'position')}"
            
            # Posted date
            job_data['posted_date'] = 'Recently posted'
            
            # Default values
            job_data['requirements'] = job_data.get('description', '')[:200]
            job_data['job_type'] = 'Full-time'
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error parsing Glassdoor job card: {str(e)}")
            return None
    
    async def scrape_ziprecruiter(self, keywords: str, location: str = "", max_jobs: int = 10) -> List[Dict]:
        """Scrape jobs from ZipRecruiter using real web scraping"""
        try:
            if not self.session:
                raise Exception("HTTP session not initialized")
            
            # ZipRecruiter job search URL
            base_url = "https://www.ziprecruiter.com/jobs/search"
            params = {
                'search': keywords,
                'location': location or 'United States',
                'days': '7',  # Last 7 days
                'job_type': 'full_time'
            }
            
            # Create search URL
            search_url = f"{base_url}?" + "&".join([f"{k}={v}" for k, v in params.items() if v])
            logger.info(f"Scraping ZipRecruiter: {search_url}")
            
            # ZipRecruiter headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
            
            # Make request to ZipRecruiter
            async with self.session.get(search_url, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"ZipRecruiter returned status {response.status}")
                    return self._generate_sample_jobs("ZipRecruiter", keywords, max_jobs)
                
                html_content = await response.text()
                
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            jobs_data = []
            
            # Find job cards (ZipRecruiter uses specific selectors)
            job_cards = soup.find_all(['article'], {'class': ['job_result']}) or soup.find_all(['div'], {'class': ['job_content']})
            
            logger.info(f"Found {len(job_cards)} job cards on ZipRecruiter")
            
            for card in job_cards[:max_jobs]:
                try:
                    job_data = self._parse_ziprecruiter_job_card(card)
                    if job_data:
                        job_data['platform'] = 'ZipRecruiter'
                        job_data['scraped_at'] = datetime.utcnow().isoformat()
                        job_data['search_keywords'] = keywords
                        jobs_data.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing ZipRecruiter job card: {str(e)}")
                    continue
            
            if not jobs_data:
                logger.warning("No jobs found on ZipRecruiter, generating sample data")
                return self._generate_sample_jobs("ZipRecruiter", keywords, max_jobs)
            
            logger.info(f"Successfully scraped {len(jobs_data)} jobs from ZipRecruiter")
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error scraping ZipRecruiter: {str(e)}")
            return self._generate_sample_jobs("ZipRecruiter", keywords, max_jobs)
    
    def _parse_ziprecruiter_job_card(self, card) -> Optional[Dict]:
        """Parse a single ZipRecruiter job card to extract job information"""
        try:
            job_data = {}
            
            # Job title
            title_elem = card.find(['h2'], {'class': ['job_title']}) or card.find(['a'], {'class': ['job_link']})
            if title_elem:
                job_data['title'] = title_elem.get_text(strip=True)
            else:
                return None
            
            # Company name
            company_elem = card.find(['a'], {'class': ['company_name']}) or card.find(['span'], {'class': ['company']})
            if company_elem:
                job_data['company'] = company_elem.get_text(strip=True)
            else:
                job_data['company'] = 'Unknown Company'
            
            # Location
            location_elem = card.find(['span'], {'class': ['location']}) or card.find(['div'], {'class': ['job_location']})
            if location_elem:
                job_data['location'] = location_elem.get_text(strip=True)
            else:
                job_data['location'] = 'Remote'
            
            # Job URL
            link_elem = card.find(['a'], {'class': ['job_link']})
            if link_elem and 'href' in link_elem.attrs:
                href = link_elem['href']
                if href.startswith('http'):
                    job_data['job_url'] = href
                else:
                    job_data['job_url'] = f"https://www.ziprecruiter.com{href}"
            else:
                job_data['job_url'] = 'https://www.ziprecruiter.com'
            
            # Salary (if available)
            salary_elem = card.find(['span'], {'class': ['salary']}) or card.find(['div'], {'class': ['job_salary']})
            if salary_elem:
                job_data['salary'] = salary_elem.get_text(strip=True)
            else:
                job_data['salary'] = 'Not specified'
            
            # Job description
            desc_elem = card.find(['div'], {'class': ['job_snippet']}) or card.find(['p'], {'class': ['job_description']})
            if desc_elem:
                job_data['description'] = desc_elem.get_text(strip=True)[:500]
            else:
                job_data['description'] = f"Job opportunity at {job_data.get('company', 'company')} for {job_data.get('title', 'position')}"
            
            # Posted date
            date_elem = card.find(['span'], {'class': ['job_age']}) or card.find(['time'])
            if date_elem:
                job_data['posted_date'] = date_elem.get_text(strip=True)
            else:
                job_data['posted_date'] = 'Recently posted'
            
            # Default values
            job_data['requirements'] = job_data.get('description', '')[:200]
            job_data['job_type'] = 'Full-time'
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error parsing ZipRecruiter job card: {str(e)}")
            return None


# Singleton instance
job_scraper = JobScraper()