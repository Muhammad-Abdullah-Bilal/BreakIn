"""Talent Matching AI Agent - Matches external jobs with BreakIn developers."""

import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from pydantic import BaseModel

from .base_agent import BaseAgent, AgentConfig, AgentResult


class DeveloperProfile(BaseModel):
    """Developer profile for matching."""
    user_id: str
    username: str
    email: str
    full_name: Optional[str] = None
    skills: List[str] = []
    experience_level: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    remote_preference: Optional[str] = None
    salary_expectation_min: Optional[int] = None
    salary_expectation_max: Optional[int] = None
    availability: Optional[str] = None
    portfolio_projects: List[Dict[str, Any]] = []
    work_experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    github_profile: Optional[str] = None
    linkedin_profile: Optional[str] = None
    last_active: Optional[datetime] = None


class JobRequirement(BaseModel):
    """External job requirement for matching."""
    job_id: str
    external_id: str
    source: str
    title: str
    company: str
    description: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_level: Optional[str] = None
    location: Optional[str] = None
    remote_policy: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    employment_type: Optional[str] = None


class MatchScore(BaseModel):
    """Match score between developer and job."""
    developer_id: str
    job_id: str
    overall_score: float
    skill_match_score: float
    experience_match_score: float
    location_match_score: float
    salary_match_score: float
    availability_match_score: float
    cultural_fit_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    strengths: List[str] = []
    concerns: List[str] = []
    recommendation: str
    confidence_level: str


class TalentMatchingAgent(BaseAgent):
    """AI Agent for matching external jobs with BreakIn developers."""
    
    def __init__(self, config: AgentConfig, db_connection=None):
        super().__init__(config)
        self.db = db_connection
        self.skill_vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=1000
        )
        self.skill_vectors = None
        self.skill_names = []
        
    async def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input parameters."""
        required_fields = ["job_requirements"]
        return all(field in input_data for field in required_fields)
    
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        """Execute talent matching process."""
        job_requirements = input_data.get("job_requirements", [])
        min_match_score = input_data.get("min_match_score", 0.6)
        max_matches_per_job = input_data.get("max_matches_per_job", 10)
        include_passive_candidates = input_data.get("include_passive_candidates", True)
        
        start_time = datetime.utcnow()
        
        try:
            # Load developer profiles
            developers = await self._load_developer_profiles(include_passive_candidates)
            
            if not developers:
                return AgentResult(
                    success=False,
                    error="No developer profiles found",
                    execution_time=0,
                    timestamp=start_time,
                    agent_name=self.name
                )
            
            # Initialize skill matching system
            await self._initialize_skill_matching(developers)
            
            all_matches = []
            
            # Process each job requirement
            for job_req in job_requirements:
                try:
                    job_requirement = JobRequirement(**job_req)
                    
                    # Find matches for this job
                    matches = await self._find_matches_for_job(
                        job_requirement,
                        developers,
                        min_match_score,
                        max_matches_per_job
                    )
                    
                    all_matches.extend(matches)
                    
                except Exception as e:
                    self.logger.error(f"Failed to process job {job_req.get('job_id', 'unknown')}: {str(e)}")
                    continue
            
            # Store matches in database
            if self.db is not None and all_matches:
                await self._store_matches(all_matches)
            
            # Generate insights
            insights = await self._generate_matching_insights(all_matches, job_requirements, developers)
            
            return AgentResult(
                success=True,
                data={
                    "total_matches": len(all_matches),
                    "jobs_processed": len(job_requirements),
                    "developers_evaluated": len(developers),
                    "matches": [match.dict() for match in all_matches[:20]],  # Return top 20
                    "insights": insights
                },
                execution_time=0,
                timestamp=start_time,
                agent_name=self.name,
                metadata={
                    "min_match_score": min_match_score,
                    "max_matches_per_job": max_matches_per_job
                }
            )
            
        except Exception as e:
            self.logger.error(f"Talent matching execution failed: {str(e)}")
            return AgentResult(
                success=False,
                error=str(e),
                execution_time=0,
                timestamp=start_time,
                agent_name=self.name
            )
    
    async def _load_developer_profiles(self, include_passive: bool = True) -> List[DeveloperProfile]:
        """Load developer profiles from database."""
        if self.db is None:
            return []
        
        try:
            # Build query
            query = {"role": "developer"}
            
            if not include_passive:
                # Only include actively job-seeking developers
                query["job_seeking_status"] = {"$in": ["active", "open"]}
            
            # Get user profiles
            users = list(self.db.users.find(query))
            
            developers = []
            for user in users:
                # Get additional profile data
                profile_data = await self._enrich_developer_profile(user)
                
                developer = DeveloperProfile(
                    user_id=user["id"],
                    username=user.get("username", ""),
                    email=user.get("email", ""),
                    full_name=user.get("full_name"),
                    skills=profile_data.get("skills", []),
                    experience_level=profile_data.get("experience_level"),
                    bio=profile_data.get("bio"),
                    location=profile_data.get("location"),
                    remote_preference=profile_data.get("remote_preference"),
                    salary_expectation_min=profile_data.get("salary_expectation_min"),
                    salary_expectation_max=profile_data.get("salary_expectation_max"),
                    availability=profile_data.get("availability"),
                    portfolio_projects=profile_data.get("portfolio_projects", []),
                    work_experience=profile_data.get("work_experience", []),
                    education=profile_data.get("education", []),
                    certifications=profile_data.get("certifications", []),
                    github_profile=profile_data.get("github_profile"),
                    linkedin_profile=profile_data.get("linkedin_profile"),
                    last_active=user.get("last_login")
                )
                
                developers.append(developer)
            
            self.logger.info(f"Loaded {len(developers)} developer profiles")
            return developers
            
        except Exception as e:
            self.logger.error(f"Failed to load developer profiles: {str(e)}")
            return []
    
    async def _enrich_developer_profile(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich user data with additional profile information."""
        profile_data = {}
        
        try:
            # Get developer profile
            dev_profile = self.db.developer_profiles.find_one({"user_id": user.get("id") or user.get("_id")})
            if dev_profile:
                profile_data.update(dev_profile)
            
            # Get skills from various sources
            skills = set()
            
            # Skills from profile
            if "skills" in profile_data:
                skills.update(profile_data["skills"])
            
            # Skills from projects
            projects = list(self.db.projects.find({"user_id": user.get("id") or user.get("_id")}))
            for project in projects:
                if "technologies" in project:
                    skills.update(project["technologies"])
            
            # Skills from work experience
            if "work_experience" in profile_data:
                for exp in profile_data["work_experience"]:
                    if "skills_used" in exp:
                        skills.update(exp["skills_used"])
            
            profile_data["skills"] = list(skills)
            
            return profile_data
            
        except Exception as e:
            self.logger.error(f"Failed to enrich profile for user {user['id']}: {str(e)}")
            return profile_data
    
    async def _initialize_skill_matching(self, developers: List[DeveloperProfile]) -> None:
        """Initialize skill matching system with TF-IDF vectors."""
        try:
            # Collect all skills and create skill corpus
            all_skills = set()
            skill_texts = []
            
            for dev in developers:
                dev_skills = " ".join(dev.skills).lower()
                skill_texts.append(dev_skills)
                all_skills.update([skill.lower() for skill in dev.skills])
            
            # Add common tech skills for better matching
            common_skills = [
                "python", "javascript", "java", "react", "node.js", "sql", "mongodb",
                "aws", "docker", "kubernetes", "git", "api", "rest", "graphql",
                "html", "css", "typescript", "angular", "vue", "django", "flask",
                "spring", "postgresql", "redis", "elasticsearch", "jenkins", "ci/cd"
            ]
            
            all_skills.update(common_skills)
            self.skill_names = list(all_skills)
            
            # Fit vectorizer on skill texts
            if skill_texts:
                self.skill_vectorizer.fit(skill_texts + [" ".join(common_skills)])
                self.skill_vectors = self.skill_vectorizer.transform(skill_texts)
            
            self.logger.info(f"Initialized skill matching with {len(all_skills)} unique skills")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize skill matching: {str(e)}")
    
    async def _find_matches_for_job(
        self,
        job_req: JobRequirement,
        developers: List[DeveloperProfile],
        min_score: float,
        max_matches: int
    ) -> List[MatchScore]:
        """Find matching developers for a specific job."""
        matches = []
        
        try:
            # Calculate match scores for each developer
            for dev in developers:
                match_score = await self._calculate_match_score(job_req, dev)
                
                if match_score.overall_score >= min_score:
                    matches.append(match_score)
            
            # Sort by overall score and return top matches
            matches.sort(key=lambda x: x.overall_score, reverse=True)
            return matches[:max_matches]
            
        except Exception as e:
            self.logger.error(f"Failed to find matches for job {job_req.job_id}: {str(e)}")
            return []
    
    async def _calculate_match_score(self, job_req: JobRequirement, dev: DeveloperProfile) -> MatchScore:
        """Calculate comprehensive match score between job and developer."""
        
        # 1. Skill Match Score (40% weight)
        skill_score, matched_skills, missing_skills = self._calculate_skill_match(job_req, dev)
        
        # 2. Experience Level Match (20% weight)
        experience_score = self._calculate_experience_match(job_req, dev)
        
        # 3. Location/Remote Match (15% weight)
        location_score = self._calculate_location_match(job_req, dev)
        
        # 4. Salary Match (15% weight)
        salary_score = self._calculate_salary_match(job_req, dev)
        
        # 5. Availability Match (5% weight)
        availability_score = self._calculate_availability_match(job_req, dev)
        
        # 6. Cultural Fit Score (5% weight)
        cultural_score = self._calculate_cultural_fit(job_req, dev)
        
        # Calculate weighted overall score
        overall_score = (
            skill_score * 0.40 +
            experience_score * 0.20 +
            location_score * 0.15 +
            salary_score * 0.15 +
            availability_score * 0.05 +
            cultural_score * 0.05
        )
        
        # Generate strengths and concerns
        strengths, concerns = self._analyze_match_quality(
            job_req, dev, skill_score, experience_score, location_score, salary_score
        )
        
        # Generate recommendation
        recommendation = self._generate_recommendation(overall_score, strengths, concerns)
        
        # Determine confidence level
        confidence = self._determine_confidence_level(overall_score, len(matched_skills), len(missing_skills))
        
        return MatchScore(
            developer_id=dev.user_id,
            job_id=job_req.job_id,
            overall_score=round(overall_score, 3),
            skill_match_score=round(skill_score, 3),
            experience_match_score=round(experience_score, 3),
            location_match_score=round(location_score, 3),
            salary_match_score=round(salary_score, 3),
            availability_match_score=round(availability_score, 3),
            cultural_fit_score=round(cultural_score, 3),
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            strengths=strengths,
            concerns=concerns,
            recommendation=recommendation,
            confidence_level=confidence
        )
    
    def _calculate_skill_match(self, job_req: JobRequirement, dev: DeveloperProfile) -> Tuple[float, List[str], List[str]]:
        """Calculate skill match score using TF-IDF similarity."""
        try:
            # Combine required and preferred skills
            job_skills = job_req.required_skills + job_req.preferred_skills
            job_skills_text = " ".join([skill.lower() for skill in job_skills])
            
            dev_skills_text = " ".join([skill.lower() for skill in dev.skills])
            
            if not job_skills_text or not dev_skills_text:
                return 0.0, [], job_skills
            
            # Calculate TF-IDF similarity
            if self.skill_vectorizer and hasattr(self.skill_vectorizer, 'vocabulary_'):
                job_vector = self.skill_vectorizer.transform([job_skills_text])
                dev_vector = self.skill_vectorizer.transform([dev_skills_text])
                
                similarity = cosine_similarity(job_vector, dev_vector)[0][0]
            else:
                # Fallback to simple overlap
                job_skills_set = set([skill.lower() for skill in job_skills])
                dev_skills_set = set([skill.lower() for skill in dev.skills])
                
                if not job_skills_set:
                    similarity = 0.0
                else:
                    similarity = len(job_skills_set.intersection(dev_skills_set)) / len(job_skills_set)
            
            # Find matched and missing skills
            job_skills_lower = [skill.lower() for skill in job_skills]
            dev_skills_lower = [skill.lower() for skill in dev.skills]
            
            matched_skills = []
            missing_skills = []
            
            for job_skill in job_skills:
                job_skill_lower = job_skill.lower()
                if any(job_skill_lower in dev_skill or dev_skill in job_skill_lower 
                       for dev_skill in dev_skills_lower):
                    matched_skills.append(job_skill)
                else:
                    missing_skills.append(job_skill)
            
            return similarity, matched_skills, missing_skills
            
        except Exception as e:
            self.logger.error(f"Skill match calculation failed: {str(e)}")
            return 0.0, [], job_req.required_skills + job_req.preferred_skills
    
    def _calculate_experience_match(self, job_req: JobRequirement, dev: DeveloperProfile) -> float:
        """Calculate experience level match score."""
        if not job_req.experience_level or not dev.experience_level:
            return 0.7  # Neutral score if no data
        
        job_level = job_req.experience_level.upper()
        dev_level = dev.experience_level.upper()
        
        # Experience level mapping
        level_scores = {
            ("JUNIOR", "JUNIOR"): 1.0,
            ("JUNIOR", "MID"): 0.8,
            ("JUNIOR", "SENIOR"): 0.6,
            ("MID", "JUNIOR"): 0.7,
            ("MID", "MID"): 1.0,
            ("MID", "SENIOR"): 0.9,
            ("SENIOR", "JUNIOR"): 0.3,
            ("SENIOR", "MID"): 0.7,
            ("SENIOR", "SENIOR"): 1.0
        }
        
        return level_scores.get((job_level, dev_level), 0.5)
    
    def _calculate_location_match(self, job_req: JobRequirement, dev: DeveloperProfile) -> float:
        """Calculate location/remote work match score."""
        # If job is remote, high score for remote-preferring developers
        if job_req.remote_policy == "REMOTE":
            if dev.remote_preference in ["REMOTE", "HYBRID"]:
                return 1.0
            return 0.7
        
        # If job is hybrid
        if job_req.remote_policy == "HYBRID":
            if dev.remote_preference == "HYBRID":
                return 1.0
            elif dev.remote_preference in ["REMOTE", "ON_SITE"]:
                return 0.8
            return 0.7
        
        # If job is on-site
        if job_req.remote_policy == "ON_SITE":
            if not job_req.location or not dev.location:
                return 0.5  # Unknown location
            
            # Simple location matching (could be enhanced with geocoding)
            if job_req.location.lower() in dev.location.lower() or \
               dev.location.lower() in job_req.location.lower():
                return 1.0
            
            if dev.remote_preference == "ON_SITE":
                return 0.6  # Same preference but different location
            
            return 0.3  # Location mismatch
        
        return 0.7  # Default neutral score
    
    def _calculate_salary_match(self, job_req: JobRequirement, dev: DeveloperProfile) -> float:
        """Calculate salary expectation match score."""
        if not job_req.salary_min or not dev.salary_expectation_min:
            return 0.7  # Neutral if no salary data
        
        job_max = job_req.salary_max or job_req.salary_min
        dev_min = dev.salary_expectation_min
        dev_max = dev.salary_expectation_max or dev_min
        
        # Check for overlap
        if job_max >= dev_min and job_req.salary_min <= dev_max:
            # Calculate overlap percentage
            overlap_start = max(job_req.salary_min, dev_min)
            overlap_end = min(job_max, dev_max)
            overlap = overlap_end - overlap_start
            
            job_range = job_max - job_req.salary_min
            dev_range = dev_max - dev_min
            
            if job_range > 0 and dev_range > 0:
                overlap_score = overlap / min(job_range, dev_range)
                return min(1.0, overlap_score)
        
        # No overlap - check how far apart
        if job_max < dev_min:
            gap = (dev_min - job_max) / dev_min
            return max(0.0, 1.0 - gap)
        
        if job_req.salary_min > dev_max:
            gap = (job_req.salary_min - dev_max) / job_req.salary_min
            return max(0.0, 1.0 - gap)
        
        return 0.5
    
    def _calculate_availability_match(self, job_req: JobRequirement, dev: DeveloperProfile) -> float:
        """Calculate availability match score."""
        if not dev.availability:
            return 0.7  # Neutral if no availability data
        
        availability = dev.availability.lower()
        
        if "immediately" in availability or "available now" in availability:
            return 1.0
        elif "2 weeks" in availability or "1 month" in availability:
            return 0.9
        elif "notice period" in availability or "current project" in availability:
            return 0.7
        elif "not available" in availability or "not looking" in availability:
            return 0.2
        
        return 0.7  # Default
    
    def _calculate_cultural_fit(self, job_req: JobRequirement, dev: DeveloperProfile) -> float:
        """Calculate cultural fit score based on company and role description."""
        # This is a simplified version - could be enhanced with NLP sentiment analysis
        
        # Look for cultural indicators in job description
        description = job_req.description.lower()
        bio = (dev.bio or "").lower()
        
        # Positive cultural indicators
        positive_indicators = [
            "collaborative", "team player", "innovative", "learning", "growth",
            "agile", "startup", "fast-paced", "flexible", "creative"
        ]
        
        # Count matches in both job description and developer bio
        job_indicators = sum(1 for indicator in positive_indicators if indicator in description)
        dev_indicators = sum(1 for indicator in positive_indicators if indicator in bio)
        
        # Simple scoring based on indicator presence
        if job_indicators > 0 and dev_indicators > 0:
            return min(1.0, (job_indicators + dev_indicators) / 10)
        
        return 0.7  # Neutral score
    
    def _analyze_match_quality(
        self,
        job_req: JobRequirement,
        dev: DeveloperProfile,
        skill_score: float,
        experience_score: float,
        location_score: float,
        salary_score: float
    ) -> Tuple[List[str], List[str]]:
        """Analyze match quality and generate strengths and concerns."""
        strengths = []
        concerns = []
        
        # Skill analysis
        if skill_score >= 0.8:
            strengths.append("Excellent technical skill match")
        elif skill_score >= 0.6:
            strengths.append("Good technical skill alignment")
        else:
            concerns.append("Limited technical skill overlap")
        
        # Experience analysis
        if experience_score >= 0.9:
            strengths.append("Perfect experience level match")
        elif experience_score >= 0.7:
            strengths.append("Good experience level fit")
        else:
            concerns.append("Experience level mismatch")
        
        # Location analysis
        if location_score >= 0.9:
            strengths.append("Excellent location/remote work alignment")
        elif location_score < 0.5:
            concerns.append("Location or remote work preference mismatch")
        
        # Salary analysis
        if salary_score >= 0.8:
            strengths.append("Salary expectations align well")
        elif salary_score < 0.5:
            concerns.append("Salary expectations may not align")
        
        # Additional strengths based on profile
        if dev.github_profile:
            strengths.append("Active GitHub profile available")
        
        if dev.portfolio_projects:
            strengths.append(f"Has {len(dev.portfolio_projects)} portfolio projects")
        
        if dev.certifications:
            strengths.append("Has relevant certifications")
        
        return strengths, concerns
    
    def _generate_recommendation(self, overall_score: float, strengths: List[str], concerns: List[str]) -> str:
        """Generate recommendation based on match score and analysis."""
        if overall_score >= 0.85:
            return "Highly recommended - excellent match across all criteria"
        elif overall_score >= 0.75:
            return "Recommended - strong match with minor gaps"
        elif overall_score >= 0.65:
            return "Consider - good potential with some concerns to address"
        elif overall_score >= 0.5:
            return "Possible match - significant gaps but worth evaluating"
        else:
            return "Not recommended - major misalignment in key areas"
    
    def _determine_confidence_level(self, overall_score: float, matched_skills: int, missing_skills: int) -> str:
        """Determine confidence level in the match."""
        if overall_score >= 0.8 and matched_skills >= 5:
            return "HIGH"
        elif overall_score >= 0.65 and matched_skills >= 3:
            return "MEDIUM"
        else:
            return "LOW"
    
    async def _store_matches(self, matches: List[MatchScore]) -> None:
        """Store match results in database."""
        if self.db is None:
            return
        
        try:
            match_docs = []
            for match in matches:
                match_doc = match.dict()
                match_doc["created_at"] = datetime.utcnow()
                match_doc["status"] = "pending"
                match_docs.append(match_doc)
            
            if match_docs:
                self.db.talent_matches.insert_many(match_docs)
                self.logger.info(f"Stored {len(match_docs)} matches in database")
                
        except Exception as e:
            self.logger.error(f"Failed to store matches: {str(e)}")
    
    async def _generate_matching_insights(
        self,
        matches: List[MatchScore],
        job_requirements: List[Dict[str, Any]],
        developers: List[DeveloperProfile]
    ) -> Dict[str, Any]:
        """Generate insights about the matching process."""
        if not matches:
            return {"message": "No matches found"}
        
        # Calculate statistics
        scores = [match.overall_score for match in matches]
        avg_score = sum(scores) / len(scores)
        
        # Most common skills in matches
        all_matched_skills = []
        for match in matches:
            all_matched_skills.extend(match.matched_skills)
        
        skill_counts = {}
        for skill in all_matched_skills:
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Match distribution by confidence
        confidence_dist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for match in matches:
            confidence_dist[match.confidence_level] += 1
        
        return {
            "total_matches": len(matches),
            "average_match_score": round(avg_score, 3),
            "confidence_distribution": confidence_dist,
            "top_matching_skills": [{"skill": skill, "count": count} for skill, count in top_skills],
            "jobs_with_matches": len(set(match.job_id for match in matches)),
            "developers_matched": len(set(match.developer_id for match in matches))
        }