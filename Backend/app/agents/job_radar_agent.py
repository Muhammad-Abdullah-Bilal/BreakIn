"""Job Radar AI Agent - Uses OpenAI to intelligently fetch and analyze job postings."""

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from .base_agent import BaseAgent, AgentConfig, AgentResult
from ..services.job_scraper import JobScraper, JobScrapingResult


class JobSource(BaseModel):
    """Configuration for a job board source."""
    name: str
    base_url: str
    search_endpoint: str
    enabled: bool = True
    rate_limit_delay: float = 1.0
    headers: Dict[str, str] = {}
    search_params: Dict[str, str] = {}


class JobPosting(BaseModel):
    """Parsed job posting data."""
    external_id: str
    source: str
    title: str
    company: str
    location: Optional[str] = None
    description: str
    requirements: List[str] = []
    skills: List[str] = []
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    employment_type: Optional[str] = None
    remote_policy: Optional[str] = None
    posted_date: Optional[datetime] = None
    url: str
    raw_data: Dict[str, Any] = {}


class JobRadarAgent(BaseAgent):
    """AI Agent for intelligently fetching and analyzing job postings using OpenAI."""
    
    def __init__(self, config: AgentConfig, db_connection=None):
        super().__init__(config)
        self.db = db_connection
        self.job_scraper = JobScraper()
        self.logger = logging.getLogger(__name__)
        
    def _initialize_sources(self) -> List[JobSource]:
        """Initialize job board sources."""
        return [
            JobSource(
                name="stackoverflow_jobs",
                base_url="https://stackoverflow.com",
                search_endpoint="/jobs",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                search_params={
                    "q": "developer",
                    "sort": "p",
                    "pg": "1"
                }
            ),
            JobSource(
                name="github_jobs",
                base_url="https://jobs.github.com",
                search_endpoint="/positions.json",
                search_params={
                    "description": "developer",
                    "location": ""
                }
            ),
            JobSource(
                name="remoteok",
                base_url="https://remoteok.io",
                search_endpoint="/api",
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; BreakIn-JobRadar/1.0)"
                }
            )
        ]
    
    async def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input parameters."""
        required_fields = ["search_terms", "max_results"]
        return all(field in input_data for field in required_fields)
    
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        """Execute AI-powered job fetching and analysis."""
        keywords = input_data.get("keywords", ["developer", "engineer", "software"])
        location = input_data.get("location", "United States")
        max_jobs = input_data.get("max_jobs_per_source", 50)
        sources = input_data.get("sources", ["linkedin", "indeed", "glassdoor", "stackoverflow"])
        
        start_time = datetime.utcnow()
        
        try:
            self.logger.info(f"Starting AI-powered job radar with keywords: {keywords}")
            
            # Use AI-powered job scraper to fetch jobs from multiple platforms
            all_results = {}
            total_jobs_found = 0
            total_jobs_saved = 0
            all_errors = []
            
            # Scrape from each requested source
            for source in sources:
                try:
                    self.logger.info(f"Fetching jobs from {source} using AI")
                    result = await self.job_scraper.scrape_platform(
                        platform=source,
                        keywords=" ".join(keywords),
                        location=location,
                        max_jobs=max_jobs
                    )
                    
                    all_results[source] = result
                    total_jobs_found += result.jobs_found
                    total_jobs_saved += result.jobs_saved
                    all_errors.extend(result.errors)
                    
                    # Add delay between platforms to be respectful
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    error_msg = f"Failed to scrape {source}: {str(e)}"
                    self.logger.error(error_msg)
                    all_errors.append(error_msg)
                    continue
            
            # Get recent jobs from database for analysis
            recent_jobs = await self._get_recent_jobs(limit=20)
            
            # Analyze job trends using AI
            job_insights = await self._analyze_job_trends(recent_jobs, keywords)
            
            return AgentResult(
                success=True,
                data={
                    "jobs_found": total_jobs_found,
                    "jobs_saved": total_jobs_saved,
                    "sources_processed": list(all_results.keys()),
                    "platform_results": {k: {
                        "jobs_found": v.jobs_found,
                        "jobs_saved": v.jobs_saved,
                        "errors": v.errors
                    } for k, v in all_results.items()},
                    "recent_jobs": recent_jobs[:10],  # Return first 10 for preview
                    "job_insights": job_insights,
                    "keywords_used": keywords,
                    "location": location
                },
                execution_time=0,  # Will be set by base class
                timestamp=start_time,
                agent_name=self.name,
                metadata={
                    "total_errors": len(all_errors),
                    "successful_platforms": len([r for r in all_results.values() if r.jobs_found > 0])
                }
            )
            
        except Exception as e:
            self.logger.error(f"Job radar execution failed: {str(e)}")
            return AgentResult(
                success=False,
                error=str(e),
                execution_time=0,
                timestamp=start_time,
                agent_name=self.name
            )
    
    async def _get_recent_jobs(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent jobs from database for analysis."""
        try:
            if not self.db:
                return []
            
            # Get jobs from the last 7 days
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            
            jobs_collection = self.db.jobs
            cursor = jobs_collection.find(
                {"created_at": {"$gte": cutoff_date}}
            ).sort("created_at", -1).limit(limit)
            
            jobs = []
            async for job_doc in cursor:
                jobs.append({
                    "title": job_doc.get("title", ""),
                    "company": job_doc.get("company", ""),
                    "location": job_doc.get("location", ""),
                    "description": job_doc.get("description", "")[:500],  # Truncate for analysis
                    "skills": job_doc.get("skills", []),
                    "salary_range": job_doc.get("salary_range", ""),
                    "created_at": job_doc.get("created_at", datetime.utcnow()).isoformat()
                })
            
            return jobs
            
        except Exception as e:
            self.logger.error(f"Failed to get recent jobs: {str(e)}")
            return []
    
    async def _analyze_job_trends(self, jobs: List[Dict[str, Any]], keywords: List[str]) -> Dict[str, Any]:
        """Analyze job trends using AI."""
        try:
            if not jobs:
                return {"insights": "No recent jobs available for analysis", "trends": []}
            
            # Use the job scraper's OpenAI client for analysis
            jobs_summary = "\n".join([
                f"Title: {job['title']}, Company: {job['company']}, Skills: {', '.join(job['skills'][:5])}"
                for job in jobs[:15]  # Limit to avoid token limits
            ])
            
            prompt = f"""
Analyze these recent job postings and provide insights about job market trends for keywords: {', '.join(keywords)}

Jobs:
{jobs_summary}

Provide a JSON response with:
{{
  "insights": "Brief summary of key trends and insights",
  "top_skills": ["skill1", "skill2", "skill3"],
  "salary_trends": "Brief salary trend analysis",
  "location_trends": "Brief location trend analysis",
  "recommendations": "Brief recommendations for job seekers"
}}
"""

            response = await self.job_scraper.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert job market analyst. Provide concise, actionable insights in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                return {"insights": "Analysis completed but format error occurred", "trends": []}
                
        except Exception as e:
            self.logger.error(f"Failed to analyze job trends: {str(e)}")
            return {"insights": f"Analysis failed: {str(e)}", "trends": []}
    
    async def _scrape_source(self, source: JobSource, search_terms: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Scrape jobs from a specific source."""
        jobs = []
        
        if source.name == "remoteok":
            jobs = await self._scrape_remoteok(source, search_terms, max_results)
        elif source.name == "github_jobs":
            jobs = await self._scrape_github_jobs(source, search_terms, max_results)
        elif source.name == "stackoverflow_jobs":
            jobs = await self._scrape_stackoverflow(source, search_terms, max_results)
        else:
            # Generic scraper for other sources
            jobs = await self._scrape_generic(source, search_terms, max_results)
        
        return jobs
    
    async def _scrape_remoteok(self, source: JobSource, search_terms: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Scrape RemoteOK API."""
        jobs = []
        
        try:
            async with self.session.get(
                f"{source.base_url}{source.search_endpoint}",
                headers=source.headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for item in data[:max_results]:
                        if not isinstance(item, dict):
                            continue
                            
                        # Filter by search terms
                        title = item.get("position", "").lower()
                        description = item.get("description", "").lower()
                        
                        if any(term.lower() in title or term.lower() in description for term in search_terms):
                            jobs.append({
                                "source": source.name,
                                "external_id": str(item.get("id", "")),
                                "title": item.get("position", ""),
                                "company": item.get("company", ""),
                                "location": item.get("location", "Remote"),
                                "description": item.get("description", ""),
                                "url": f"https://remoteok.io/remote-jobs/{item.get('id', '')}",
                                "tags": item.get("tags", []),
                                "salary": item.get("salary", ""),
                                "raw_data": item
                            })
        
        except Exception as e:
            self.logger.error(f"RemoteOK scraping failed: {str(e)}")
        
        return jobs
    
    async def _scrape_github_jobs(self, source: JobSource, search_terms: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Scrape GitHub Jobs API (deprecated but kept for example)."""
        jobs = []
        
        try:
            params = source.search_params.copy()
            params["description"] = " OR ".join(search_terms)
            
            async with self.session.get(
                f"{source.base_url}{source.search_endpoint}",
                params=params,
                headers=source.headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for item in data[:max_results]:
                        jobs.append({
                            "source": source.name,
                            "external_id": item.get("id", ""),
                            "title": item.get("title", ""),
                            "company": item.get("company", ""),
                            "location": item.get("location", ""),
                            "description": item.get("description", ""),
                            "url": item.get("url", ""),
                            "type": item.get("type", ""),
                            "created_at": item.get("created_at", ""),
                            "raw_data": item
                        })
        
        except Exception as e:
            self.logger.error(f"GitHub Jobs scraping failed: {str(e)}")
        
        return jobs
    
    async def _scrape_stackoverflow(self, source: JobSource, search_terms: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Scrape StackOverflow Jobs (web scraping)."""
        jobs = []
        
        try:
            params = source.search_params.copy()
            params["q"] = " OR ".join(search_terms)
            
            async with self.session.get(
                f"{source.base_url}{source.search_endpoint}",
                params=params,
                headers=source.headers
            ) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    job_listings = soup.find_all('div', class_='listResults')
                    
                    for listing in job_listings[:max_results]:
                        try:
                            title_elem = listing.find('a', class_='s-link')
                            company_elem = listing.find('span', class_='fc-black-700')
                            location_elem = listing.find('span', class_='fc-black-500')
                            
                            if title_elem:
                                jobs.append({
                                    "source": source.name,
                                    "external_id": title_elem.get('href', '').split('/')[-1],
                                    "title": title_elem.get_text(strip=True),
                                    "company": company_elem.get_text(strip=True) if company_elem else "",
                                    "location": location_elem.get_text(strip=True) if location_elem else "",
                                    "url": f"{source.base_url}{title_elem.get('href', '')}",
                                    "description": "",  # Would need additional request
                                    "raw_data": {}
                                })
                        except Exception as e:
                            self.logger.error(f"Failed to parse SO job listing: {str(e)}")
                            continue
        
        except Exception as e:
            self.logger.error(f"StackOverflow scraping failed: {str(e)}")
        
        return jobs
    
    async def _scrape_generic(self, source: JobSource, search_terms: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Generic web scraper for other job boards."""
        # Placeholder for additional job board integrations
        return []
    
    async def _parse_job_posting(self, job_data: Dict[str, Any]) -> Optional[JobPosting]:
        """Parse raw job data into structured format."""
        try:
            # Extract skills using NLP/regex
            skills = self._extract_skills(job_data.get("description", ""))
            
            # Extract requirements
            requirements = self._extract_requirements(job_data.get("description", ""))
            
            # Parse salary information
            salary_info = self._parse_salary(job_data.get("salary", ""))
            
            # Determine experience level
            experience_level = self._determine_experience_level(
                job_data.get("title", ""),
                job_data.get("description", "")
            )
            
            # Parse employment type and remote policy
            employment_type = self._parse_employment_type(job_data.get("type", ""))
            remote_policy = self._parse_remote_policy(
                job_data.get("location", ""),
                job_data.get("description", "")
            )
            
            return JobPosting(
                external_id=job_data.get("external_id", ""),
                source=job_data.get("source", ""),
                title=job_data.get("title", ""),
                company=job_data.get("company", ""),
                location=job_data.get("location"),
                description=job_data.get("description", ""),
                requirements=requirements,
                skills=skills,
                experience_level=experience_level,
                salary_min=salary_info.get("min"),
                salary_max=salary_info.get("max"),
                currency=salary_info.get("currency"),
                employment_type=employment_type,
                remote_policy=remote_policy,
                url=job_data.get("url", ""),
                raw_data=job_data.get("raw_data", {})
            )
            
        except Exception as e:
            self.logger.error(f"Failed to parse job posting: {str(e)}")
            return None
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills from job description."""
        # Common tech skills patterns
        skill_patterns = [
            r'\b(?:JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin)\b',
            r'\b(?:React|Vue|Angular|Node\.js|Express|Django|Flask|Spring|Laravel)\b',
            r'\b(?:MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|Cassandra)\b',
            r'\b(?:AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|CI/CD)\b',
            r'\b(?:HTML|CSS|SASS|LESS|Bootstrap|Tailwind)\b',
            r'\b(?:REST|GraphQL|API|Microservices|DevOps|Agile|Scrum)\b'
        ]
        
        skills = set()
        text_lower = text.lower()
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            skills.update(matches)
        
        return list(skills)
    
    def _extract_requirements(self, text: str) -> List[str]:
        """Extract job requirements from description."""
        requirements = []
        
        # Look for requirement sections
        req_patterns = [
            r'(?:requirements?|qualifications?|must have|required skills?):\s*(.+?)(?:\n\n|\n[A-Z]|$)',
            r'(?:you should have|we require|looking for):\s*(.+?)(?:\n\n|\n[A-Z]|$)'
        ]
        
        for pattern in req_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                # Split by bullet points or line breaks
                req_items = re.split(r'[•\-\*]\s*|\n\s*', match.strip())
                requirements.extend([item.strip() for item in req_items if item.strip()])
        
        return requirements[:10]  # Limit to top 10 requirements
    
    def _parse_salary(self, salary_text: str) -> Dict[str, Any]:
        """Parse salary information from text."""
        if not salary_text:
            return {}
        
        # Extract salary ranges
        salary_pattern = r'(\$|€|£)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)\s*(\$|€|£)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        match = re.search(salary_pattern, salary_text)
        
        if match:
            currency_symbol = match.group(1) or match.group(3) or "$"
            min_salary = int(match.group(2).replace(",", ""))
            max_salary = int(match.group(4).replace(",", ""))
            
            currency_map = {"$": "USD", "€": "EUR", "£": "GBP"}
            currency = currency_map.get(currency_symbol, "USD")
            
            return {
                "min": min_salary,
                "max": max_salary,
                "currency": currency
            }
        
        return {}
    
    def _determine_experience_level(self, title: str, description: str) -> Optional[str]:
        """Determine experience level from title and description."""
        text = f"{title} {description}".lower()
        
        if any(word in text for word in ["senior", "sr.", "lead", "principal", "staff"]):
            return "SENIOR"
        elif any(word in text for word in ["junior", "jr.", "entry", "graduate", "intern"]):
            return "JUNIOR"
        elif any(word in text for word in ["mid", "intermediate", "2-4 years", "3-5 years"]):
            return "MID"
        
        return "MID"  # Default to mid-level
    
    def _parse_employment_type(self, type_text: str) -> Optional[str]:
        """Parse employment type from text."""
        if not type_text:
            return None
        
        type_text = type_text.lower()
        
        if "full" in type_text:
            return "FULL_TIME"
        elif "part" in type_text:
            return "PART_TIME"
        elif "contract" in type_text:
            return "CONTRACT"
        elif "intern" in type_text:
            return "INTERNSHIP"
        
        return "FULL_TIME"  # Default
    
    def _parse_remote_policy(self, location: str, description: str) -> Optional[str]:
        """Parse remote work policy."""
        text = f"{location} {description}".lower()
        
        if any(word in text for word in ["remote", "work from home", "wfh", "distributed"]):
            if any(word in text for word in ["hybrid", "flexible", "occasional office"]):
                return "HYBRID"
            return "REMOTE"
        elif any(word in text for word in ["on-site", "office", "in-person"]):
            return "ON_SITE"
        
        return None
    
    async def _store_jobs(self, jobs: List[JobPosting]) -> None:
        """Store parsed jobs in database."""
        if not self.db:
            return
        
        try:
            # Store in external_jobs collection
            job_docs = []
            for job in jobs:
                job_doc = job.dict()
                job_doc["scraped_at"] = datetime.utcnow()
                job_doc["processed"] = False
                job_docs.append(job_doc)
            
            if job_docs:
                await self.db.external_jobs.insert_many(job_docs)
                self.logger.info(f"Stored {len(job_docs)} jobs in database")
                
        except Exception as e:
            self.logger.error(f"Failed to store jobs: {str(e)}")