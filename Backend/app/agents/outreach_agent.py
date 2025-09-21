"""Outreach AI Agent - Generates personalized company outreach and manages warm introductions."""

import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import re
import json
from pydantic import BaseModel, EmailStr
import openai
from jinja2 import Template

from .base_agent import BaseAgent, AgentConfig, AgentResult


class CompanyProfile(BaseModel):
    """Company profile for outreach targeting."""
    company_name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    hiring_contacts: List[Dict[str, Any]] = []
    recent_job_postings: List[Dict[str, Any]] = []
    company_culture: Optional[str] = None
    tech_stack: List[str] = []
    funding_stage: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None


class OutreachCampaign(BaseModel):
    """Outreach campaign configuration."""
    campaign_id: str
    name: str
    target_companies: List[str] = []
    message_template: str
    subject_template: str
    personalization_fields: List[str] = []
    follow_up_sequence: List[Dict[str, Any]] = []
    success_metrics: Dict[str, Any] = {}
    status: str = "draft"
    created_at: datetime
    scheduled_at: Optional[datetime] = None


class OutreachMessage(BaseModel):
    """Individual outreach message."""
    message_id: str
    campaign_id: str
    company_name: str
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    subject: str
    content: str
    personalization_data: Dict[str, Any] = {}
    status: str = "draft"  # draft, sent, opened, replied, bounced
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    follow_up_count: int = 0
    next_follow_up: Optional[datetime] = None


class OutreachResult(BaseModel):
    """Result of outreach execution."""
    campaign_id: str
    messages_sent: int
    messages_failed: int
    estimated_reach: int
    personalization_score: float
    next_actions: List[str] = []


class OutreachAgent(BaseAgent):
    """AI Agent for generating and managing personalized company outreach."""
    
    def __init__(self, config: AgentConfig, db_connection=None, email_config=None):
        super().__init__(config)
        self.db = db_connection
        self.email_config = email_config or {}
        self.openai_client = None
        
        # Initialize OpenAI if API key is provided
        if self.config.custom_settings.get("openai_api_key"):
            openai.api_key = self.config.custom_settings["openai_api_key"]
            self.openai_client = openai
    
    async def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input parameters."""
        action = input_data.get("action")
        
        if action == "create_campaign":
            required_fields = ["campaign_name", "target_companies", "message_template"]
            return all(field in input_data for field in required_fields)
        elif action == "generate_outreach":
            required_fields = ["company_profiles", "talent_matches"]
            return all(field in input_data for field in required_fields)
        elif action == "send_campaign":
            required_fields = ["campaign_id"]
            return all(field in input_data for field in required_fields)
        
        return False
    
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        """Execute outreach agent functionality."""
        action = input_data.get("action", "generate_outreach")
        start_time = datetime.utcnow()
        
        try:
            if action == "create_campaign":
                result = await self._create_outreach_campaign(input_data)
            elif action == "generate_outreach":
                result = await self._generate_personalized_outreach(input_data)
            elif action == "send_campaign":
                result = await self._send_outreach_campaign(input_data)
            elif action == "analyze_responses":
                result = await self._analyze_outreach_responses(input_data)
            else:
                raise ValueError(f"Unknown action: {action}")
            
            return AgentResult(
                success=True,
                data=result,
                execution_time=0,
                timestamp=start_time,
                agent_name=self.name
            )
            
        except Exception as e:
            self.logger.error(f"Outreach agent execution failed: {str(e)}")
            return AgentResult(
                success=False,
                error=str(e),
                execution_time=0,
                timestamp=start_time,
                agent_name=self.name
            )
    
    async def _create_outreach_campaign(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new outreach campaign."""
        campaign_name = input_data["campaign_name"]
        target_companies = input_data["target_companies"]
        message_template = input_data["message_template"]
        subject_template = input_data.get("subject_template", "Partnership Opportunity with BreakIn")
        
        # Generate campaign ID
        campaign_id = f"campaign_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Create campaign
        campaign = OutreachCampaign(
            campaign_id=campaign_id,
            name=campaign_name,
            target_companies=target_companies,
            message_template=message_template,
            subject_template=subject_template,
            personalization_fields=self._extract_personalization_fields(message_template),
            created_at=datetime.utcnow()
        )
        
        # Store in database
        if self.db:
            await self.db.outreach_campaigns.insert_one(campaign.dict())
        
        return {
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "target_companies_count": len(target_companies),
            "personalization_fields": campaign.personalization_fields,
            "status": "created"
        }
    
    async def _generate_personalized_outreach(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personalized outreach messages for companies."""
        company_profiles = input_data["company_profiles"]
        talent_matches = input_data.get("talent_matches", [])
        message_type = input_data.get("message_type", "warm_introduction")
        
        generated_messages = []
        
        for company_data in company_profiles:
            try:
                company = CompanyProfile(**company_data)
                
                # Get relevant talent matches for this company
                company_matches = [
                    match for match in talent_matches 
                    if match.get("company_name", "").lower() == company.company_name.lower()
                ]
                
                # Generate personalized message
                message = await self._generate_company_message(company, company_matches, message_type)
                
                if message:
                    generated_messages.append(message)
                
            except Exception as e:
                self.logger.error(f"Failed to generate message for {company_data.get('company_name', 'unknown')}: {str(e)}")
                continue
        
        return {
            "messages_generated": len(generated_messages),
            "messages": generated_messages[:5],  # Return first 5 for preview
            "personalization_score": self._calculate_personalization_score(generated_messages),
            "recommended_send_time": self._recommend_send_time()
        }
    
    async def _generate_company_message(
        self,
        company: CompanyProfile,
        talent_matches: List[Dict[str, Any]],
        message_type: str
    ) -> Optional[Dict[str, Any]]:
        """Generate a personalized message for a specific company."""
        
        # Gather personalization data
        personalization_data = await self._gather_personalization_data(company, talent_matches)
        
        # Select appropriate template
        template = self._select_message_template(message_type, company, talent_matches)
        
        # Generate content using AI if available, otherwise use templates
        if self.openai_client:
            content = await self._generate_ai_content(company, personalization_data, message_type)
        else:
            content = self._generate_template_content(template, personalization_data)
        
        # Generate subject line
        subject = self._generate_subject_line(company, talent_matches, message_type)
        
        return {
            "company_name": company.company_name,
            "recipient_email": self._get_primary_contact_email(company),
            "recipient_name": self._get_primary_contact_name(company),
            "subject": subject,
            "content": content,
            "personalization_data": personalization_data,
            "message_type": message_type,
            "estimated_response_rate": self._estimate_response_rate(personalization_data)
        }
    
    async def _gather_personalization_data(
        self,
        company: CompanyProfile,
        talent_matches: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Gather data for personalizing the outreach message."""
        
        data = {
            "company_name": company.company_name,
            "industry": company.industry or "technology",
            "company_size": company.size or "growing company",
            "location": company.location or "",
            "tech_stack": company.tech_stack,
            "recent_jobs_count": len(company.recent_job_postings),
            "matched_candidates_count": len(talent_matches),
            "top_skills_needed": [],
            "hiring_urgency": "moderate"
        }
        
        # Analyze recent job postings
        if company.recent_job_postings:
            all_skills = []
            for job in company.recent_job_postings:
                skills = job.get("required_skills", []) + job.get("preferred_skills", [])
                all_skills.extend(skills)
            
            # Count skill frequency
            skill_counts = {}
            for skill in all_skills:
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            # Get top 5 most requested skills
            top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            data["top_skills_needed"] = [skill for skill, count in top_skills]
            
            # Determine hiring urgency based on posting frequency
            recent_posts = [
                job for job in company.recent_job_postings
                if job.get("posted_date") and 
                datetime.fromisoformat(job["posted_date"].replace("Z", "+00:00")) > datetime.utcnow() - timedelta(days=30)
            ]
            
            if len(recent_posts) >= 3:
                data["hiring_urgency"] = "high"
            elif len(recent_posts) >= 1:
                data["hiring_urgency"] = "moderate"
            else:
                data["hiring_urgency"] = "low"
        
        # Analyze talent matches
        if talent_matches:
            match_scores = [match.get("overall_score", 0) for match in talent_matches]
            data["avg_match_score"] = sum(match_scores) / len(match_scores)
            data["high_quality_matches"] = len([score for score in match_scores if score >= 0.8])
        
        return data
    
    def _select_message_template(
        self,
        message_type: str,
        company: CompanyProfile,
        talent_matches: List[Dict[str, Any]]
    ) -> str:
        """Select appropriate message template based on context."""
        
        templates = {
            "warm_introduction": """
Hi {{recipient_name}},

I noticed {{company_name}} has been actively hiring {{top_skills_needed|join(', ')}} developers. 

At BreakIn, we've built a unique platform where developers prove their skills through real-world projects and receive mentorship from industry experts. We currently have {{matched_candidates_count}} developers who match your recent job requirements with an average match score of {{avg_match_score|round(2)}}.

What makes our developers special:
• They've completed hands-on projects in {{top_skills_needed|join(', ')}}
• Each has been mentored and endorsed by senior engineers
• They're actively seeking opportunities with {{industry}} companies like {{company_name}}

Would you be interested in a 15-minute call to see how we can help accelerate your hiring process?

Best regards,
BreakIn Team
            """,
            
            "talent_showcase": """
Hi {{recipient_name}},

I saw that {{company_name}} is looking for {{top_skills_needed|join(' and ')}} talent. 

We have {{high_quality_matches}} exceptional developers who are perfect matches for your needs:

{% for match in top_matches %}
• {{match.developer_name}} - {{match.experience_level}} developer with {{match.matched_skills|join(', ')}} ({{match.overall_score|round(2)}} match score)
{% endfor %}

These developers have:
✓ Completed real projects in your tech stack
✓ Received mentor endorsements
✓ Proven track record of delivery

Want to see their portfolios and project work? I can set up a quick demo of our platform.

Best,
BreakIn Team
            """,
            
            "partnership_proposal": """
Hi {{recipient_name}},

{{company_name}}'s growth in the {{industry}} space is impressive! I noticed you've been scaling your engineering team with {{recent_jobs_count}} recent postings.

BreakIn offers a unique approach to technical hiring:

🎯 Pre-vetted developers who've completed real projects
📊 AI-powered matching based on actual skills, not just resumes  
⚡ Faster hiring with candidates ready to contribute from day one
💡 Access to emerging talent before they hit the traditional job market

We currently have {{matched_candidates_count}} developers who match your hiring criteria. Many have experience with {{tech_stack|join(', ')}} and are specifically interested in {{industry}} companies.

Would you be open to a brief conversation about how we can support {{company_name}}'s hiring goals?

Best regards,
BreakIn Partnership Team
            """
        }
        
        return templates.get(message_type, templates["warm_introduction"])
    
    async def _generate_ai_content(
        self,
        company: CompanyProfile,
        personalization_data: Dict[str, Any],
        message_type: str
    ) -> str:
        """Generate AI-powered personalized content."""
        
        prompt = f"""
        Write a personalized outreach email for BreakIn (a developer talent platform) to {company.company_name}.

        Company Context:
        - Industry: {company.industry}
        - Size: {company.size}
        - Recent hiring activity: {personalization_data.get('recent_jobs_count', 0)} job postings
        - Top skills needed: {', '.join(personalization_data.get('top_skills_needed', []))}
        - Hiring urgency: {personalization_data.get('hiring_urgency', 'moderate')}

        BreakIn Value Proposition:
        - Developers complete real-world projects before being matched
        - Each developer is mentored and endorsed by senior engineers
        - AI-powered matching based on actual skills and project work
        - Faster hiring process with pre-vetted candidates

        Available Matches:
        - {personalization_data.get('matched_candidates_count', 0)} developers match their requirements
        - Average match score: {personalization_data.get('avg_match_score', 0.7):.2f}

        Email Type: {message_type}

        Write a professional, personalized email that:
        1. Shows we understand their hiring needs
        2. Clearly explains BreakIn's unique value
        3. Includes specific numbers about available matches
        4. Ends with a clear call-to-action
        5. Keeps it under 200 words
        6. Uses a conversational, professional tone

        Email:
        """
        
        try:
            response = await self.openai_client.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at writing personalized B2B outreach emails that get responses."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            self.logger.error(f"AI content generation failed: {str(e)}")
            # Fallback to template
            template = Template(self._select_message_template(message_type, company, []))
            return template.render(**personalization_data)
    
    def _generate_template_content(self, template: str, personalization_data: Dict[str, Any]) -> str:
        """Generate content using Jinja2 templates."""
        try:
            jinja_template = Template(template)
            return jinja_template.render(**personalization_data)
        except Exception as e:
            self.logger.error(f"Template rendering failed: {str(e)}")
            return template  # Return raw template as fallback
    
    def _generate_subject_line(
        self,
        company: CompanyProfile,
        talent_matches: List[Dict[str, Any]],
        message_type: str
    ) -> str:
        """Generate personalized subject line."""
        
        subject_templates = {
            "warm_introduction": [
                f"Pre-vetted {len(talent_matches)} developers for {company.company_name}",
                f"Matching talent for your {company.industry} team",
                f"BreakIn developers ready for {company.company_name}",
            ],
            "talent_showcase": [
                f"{len(talent_matches)} perfect matches for your open roles",
                f"Exceptional developers for {company.company_name}",
                f"Your next hire might be here - {len(talent_matches)} matches",
            ],
            "partnership_proposal": [
                f"Partnership opportunity for {company.company_name}",
                f"Accelerate hiring at {company.company_name}",
                f"Unique talent pipeline for {company.company_name}",
            ]
        }
        
        templates = subject_templates.get(message_type, subject_templates["warm_introduction"])
        return templates[0]  # Use first template for now, could randomize
    
    def _get_primary_contact_email(self, company: CompanyProfile) -> Optional[str]:
        """Get primary contact email for the company."""
        if company.hiring_contacts:
            # Prioritize HR/Recruiting contacts
            for contact in company.hiring_contacts:
                if any(role in contact.get("role", "").lower() 
                      for role in ["hr", "recruiting", "talent", "people"]):
                    return contact.get("email")
            
            # Fallback to first contact
            return company.hiring_contacts[0].get("email")
        
        # Generate common HR email patterns
        if company.domain:
            common_patterns = [
                f"hr@{company.domain}",
                f"recruiting@{company.domain}",
                f"talent@{company.domain}",
                f"careers@{company.domain}",
                f"jobs@{company.domain}"
            ]
            return common_patterns[0]
        
        return None
    
    def _get_primary_contact_name(self, company: CompanyProfile) -> Optional[str]:
        """Get primary contact name for the company."""
        if company.hiring_contacts:
            for contact in company.hiring_contacts:
                if contact.get("name"):
                    return contact["name"]
        
        return "Hiring Team"  # Generic fallback
    
    def _calculate_personalization_score(self, messages: List[Dict[str, Any]]) -> float:
        """Calculate average personalization score for generated messages."""
        if not messages:
            return 0.0
        
        total_score = 0
        for message in messages:
            score = 0
            personalization_data = message.get("personalization_data", {})
            
            # Score based on available personalization data
            if personalization_data.get("company_name"):
                score += 0.2
            if personalization_data.get("top_skills_needed"):
                score += 0.3
            if personalization_data.get("matched_candidates_count", 0) > 0:
                score += 0.2
            if personalization_data.get("industry"):
                score += 0.1
            if personalization_data.get("hiring_urgency") != "moderate":
                score += 0.1
            if personalization_data.get("recent_jobs_count", 0) > 0:
                score += 0.1
            
            total_score += score
        
        return total_score / len(messages)
    
    def _recommend_send_time(self) -> Dict[str, Any]:
        """Recommend optimal send time for outreach."""
        # Based on B2B email best practices
        now = datetime.utcnow()
        
        # Tuesday-Thursday, 10 AM - 2 PM are typically best
        recommended_day = 1  # Tuesday (0=Monday)
        recommended_hour = 10
        
        # Calculate next optimal send time
        days_ahead = (recommended_day - now.weekday()) % 7
        if days_ahead == 0 and now.hour >= recommended_hour:
            days_ahead = 7  # Next week
        
        recommended_time = now.replace(
            hour=recommended_hour,
            minute=0,
            second=0,
            microsecond=0
        ) + timedelta(days=days_ahead)
        
        return {
            "recommended_datetime": recommended_time.isoformat(),
            "reason": "Tuesday-Thursday 10 AM typically have highest open rates for B2B emails",
            "timezone": "UTC"
        }
    
    def _estimate_response_rate(self, personalization_data: Dict[str, Any]) -> float:
        """Estimate response rate based on personalization quality."""
        base_rate = 0.05  # 5% base response rate
        
        # Boost based on personalization factors
        if personalization_data.get("matched_candidates_count", 0) > 0:
            base_rate += 0.03
        
        if personalization_data.get("top_skills_needed"):
            base_rate += 0.02
        
        if personalization_data.get("hiring_urgency") == "high":
            base_rate += 0.02
        
        if personalization_data.get("avg_match_score", 0) > 0.8:
            base_rate += 0.03
        
        return min(base_rate, 0.20)  # Cap at 20%
    
    def _extract_personalization_fields(self, template: str) -> List[str]:
        """Extract personalization fields from template."""
        # Find Jinja2 template variables
        pattern = r'\{\{\s*([^}]+)\s*\}\}'
        matches = re.findall(pattern, template)
        
        fields = []
        for match in matches:
            # Clean up the field name (remove filters, etc.)
            field = match.split('|')[0].strip()
            if field not in fields:
                fields.append(field)
        
        return fields
    
    async def _send_outreach_campaign(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send outreach campaign emails."""
        campaign_id = input_data["campaign_id"]
        test_mode = input_data.get("test_mode", True)
        
        # Load campaign
        if not self.db:
            raise ValueError("Database connection required for sending campaigns")
        
        campaign = await self.db.outreach_campaigns.find_one({"campaign_id": campaign_id})
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")
        
        # Load messages for this campaign
        messages = await self.db.outreach_messages.find({"campaign_id": campaign_id}).to_list(length=None)
        
        sent_count = 0
        failed_count = 0
        
        for message_data in messages:
            try:
                message = OutreachMessage(**message_data)
                
                if test_mode:
                    # In test mode, just mark as sent without actually sending
                    message.status = "sent"
                    message.sent_at = datetime.utcnow()
                    sent_count += 1
                else:
                    # Actually send the email
                    success = await self._send_email(message)
                    if success:
                        message.status = "sent"
                        message.sent_at = datetime.utcnow()
                        sent_count += 1
                    else:
                        message.status = "failed"
                        failed_count += 1
                
                # Update message in database
                await self.db.outreach_messages.update_one(
                    {"message_id": message.message_id},
                    {"$set": message.dict()}
                )
                
                # Rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                self.logger.error(f"Failed to send message {message_data.get('message_id')}: {str(e)}")
                failed_count += 1
        
        # Update campaign status
        await self.db.outreach_campaigns.update_one(
            {"campaign_id": campaign_id},
            {"$set": {"status": "sent", "sent_at": datetime.utcnow()}}
        )
        
        return {
            "campaign_id": campaign_id,
            "messages_sent": sent_count,
            "messages_failed": failed_count,
            "test_mode": test_mode,
            "next_follow_up": (datetime.utcnow() + timedelta(days=3)).isoformat()
        }
    
    async def _send_email(self, message: OutreachMessage) -> bool:
        """Send individual email message."""
        try:
            if not self.email_config:
                self.logger.warning("No email configuration provided")
                return False
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.email_config.get('from_email', 'noreply@breakin.com')
            msg['To'] = message.recipient_email
            msg['Subject'] = message.subject
            
            # Add body
            msg.attach(MIMEText(message.content, 'plain'))
            
            # Send via SMTP
            smtp_server = self.email_config.get('smtp_server', 'localhost')
            smtp_port = self.email_config.get('smtp_port', 587)
            username = self.email_config.get('username')
            password = self.email_config.get('password')
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                if username and password:
                    server.starttls()
                    server.login(username, password)
                
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Email sending failed: {str(e)}")
            return False
    
    async def _analyze_outreach_responses(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze outreach campaign responses and performance."""
        campaign_id = input_data.get("campaign_id")
        
        if not self.db:
            raise ValueError("Database connection required for analysis")
        
        # Get campaign messages
        query = {"campaign_id": campaign_id} if campaign_id else {}
        messages = await self.db.outreach_messages.find(query).to_list(length=None)
        
        if not messages:
            return {"message": "No outreach messages found"}
        
        # Calculate metrics
        total_sent = len([m for m in messages if m.get("status") == "sent"])
        total_opened = len([m for m in messages if m.get("opened_at")])
        total_replied = len([m for m in messages if m.get("replied_at")])
        
        open_rate = (total_opened / total_sent) if total_sent > 0 else 0
        reply_rate = (total_replied / total_sent) if total_sent > 0 else 0
        
        # Analyze response patterns
        response_analysis = {
            "total_messages": len(messages),
            "messages_sent": total_sent,
            "open_rate": round(open_rate, 3),
            "reply_rate": round(reply_rate, 3),
            "responses_by_company_size": {},
            "responses_by_industry": {},
            "best_performing_templates": [],
            "recommended_optimizations": []
        }
        
        # Add optimization recommendations
        if open_rate < 0.20:
            response_analysis["recommended_optimizations"].append("Improve subject lines - current open rate is below average")
        
        if reply_rate < 0.05:
            response_analysis["recommended_optimizations"].append("Increase personalization - current reply rate is low")
        
        if total_sent > 0:
            response_analysis["recommended_optimizations"].append("Consider A/B testing different message templates")
        
        return response_analysis