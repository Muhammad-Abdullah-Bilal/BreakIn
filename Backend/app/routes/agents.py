"""API routes for AI Agents system."""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from ..config import get_database
from ..agents.orchestrator import AgentOrchestrator
from ..agents.base_agent import AgentConfig
from pydantic import BaseModel

# Initialize router
router = APIRouter(prefix="/agents", tags=["AI Agents"])
logger = logging.getLogger(__name__)

# Global orchestrator instance
orchestrator = None

def get_orchestrator():
    """Get or create the agent orchestrator."""
    global orchestrator
    if orchestrator is None:
        db = get_database()
        config = {
            "job_radar": {
                "max_jobs_per_source": 100,
                "default_keywords": ["python", "javascript", "react", "node.js", "full-stack"]
            },
            "talent_matching": {
                "default_match_threshold": 0.7,
                "max_matches_per_job": 5
            },
            "outreach": {
                "openai_api_key": None,  # Set from environment
                "default_message_type": "warm_introduction"
            },
            "email_config": {
                "from_email": "partnerships@breakin.com",
                "smtp_server": "localhost",
                "smtp_port": 587
            }
        }
        orchestrator = AgentOrchestrator(db, config)
    return orchestrator


# Request/Response Models
class WorkflowCreateRequest(BaseModel):
    template_name: str
    workflow_name: Optional[str] = None
    custom_input: Optional[Dict[str, Any]] = None


class AgentExecuteRequest(BaseModel):
    agent_name: str
    action: str
    input_data: Dict[str, Any]


class WorkflowResponse(BaseModel):
    workflow_id: str
    status: str
    message: Optional[str] = None


@router.get("/health")
async def get_agents_health():
    """Get health status of all AI agents."""
    try:
        orchestrator = get_orchestrator()
        health_status = await orchestrator.get_agent_health()
        return health_status
    except Exception as e:
        logger.error(f"Failed to get agent health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflows/templates")
async def list_workflow_templates():
    """List available workflow templates."""
    try:
        orchestrator = get_orchestrator()
        templates = []
        
        for template_name, template_config in orchestrator.workflow_templates.items():
            templates.append({
                "template_name": template_name,
                "name": template_config["name"],
                "description": template_config["description"],
                "task_count": len(template_config["tasks"]),
                "estimated_duration": "5-15 minutes"  # Could be calculated based on tasks
            })
        
        return {"templates": templates}
    except Exception as e:
        logger.error(f"Failed to list workflow templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(request: WorkflowCreateRequest, background_tasks: BackgroundTasks):
    """Create a new workflow from a template."""
    try:
        orchestrator = get_orchestrator()
        
        workflow_id = await orchestrator.create_workflow(
            template_name=request.template_name,
            workflow_name=request.workflow_name,
            custom_input=request.custom_input,
            created_by="api_user"  # Could be extracted from auth
        )
        
        return WorkflowResponse(
            workflow_id=workflow_id,
            status="created",
            message=f"Workflow created successfully from template '{request.template_name}'"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowResponse)
async def execute_workflow(workflow_id: str, background_tasks: BackgroundTasks):
    """Execute a workflow."""
    try:
        orchestrator = get_orchestrator()
        
        # Execute workflow in background
        background_tasks.add_task(orchestrator.execute_workflow, workflow_id)
        
        return WorkflowResponse(
            workflow_id=workflow_id,
            status="started",
            message="Workflow execution started in background"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to execute workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflows/{workflow_id}/status")
async def get_workflow_status(workflow_id: str):
    """Get current status of a workflow."""
    try:
        orchestrator = get_orchestrator()
        status = await orchestrator.get_workflow_status(workflow_id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get workflow status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflows")
async def list_workflows(status: Optional[str] = None):
    """List all workflows, optionally filtered by status."""
    try:
        orchestrator = get_orchestrator()
        workflows = await orchestrator.list_workflows(status=status)
        return {"workflows": workflows}
    except Exception as e:
        logger.error(f"Failed to list workflows: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/workflows/{workflow_id}")
async def cancel_workflow(workflow_id: str):
    """Cancel a running workflow."""
    try:
        orchestrator = get_orchestrator()
        result = await orchestrator.cancel_workflow(workflow_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to cancel workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_agent_directly(request: AgentExecuteRequest):
    """Execute a single agent directly (for testing/debugging)."""
    try:
        orchestrator = get_orchestrator()
        
        if request.agent_name not in orchestrator.agents:
            raise HTTPException(status_code=400, detail=f"Unknown agent: {request.agent_name}")
        
        agent = orchestrator.agents[request.agent_name]
        
        # Prepare input data
        input_data = request.input_data.copy()
        input_data["action"] = request.action
        
        # Execute agent
        result = await agent.execute(input_data)
        
        return {
            "success": result.success,
            "data": result.data,
            "error": result.error,
            "execution_time": result.execution_time,
            "timestamp": result.timestamp.isoformat() if result.timestamp else None,
            "agent_name": result.agent_name
        }
        
    except Exception as e:
        logger.error(f"Failed to execute agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Specific agent endpoints

@router.post("/job-radar/execute")
async def execute_job_radar(
    background_tasks: BackgroundTasks,
    sources: List[str] = ["stackoverflow_jobs", "github_jobs", "remoteok"],
    keywords: List[str] = ["python", "javascript", "react", "node.js"],
    max_jobs_per_source: int = 50
):
    """Execute the Job Radar agent to scrape and analyze job postings."""
    try:
        orchestrator = get_orchestrator()
        
        # Get the job radar agent
        agent = orchestrator.get_agent("job_radar")
        if not agent:
            raise HTTPException(status_code=404, detail="Job Radar agent not found")
        
        # Prepare input data
        input_data = {
            "sources": sources,
            "keywords": keywords,
            "max_jobs_per_source": max_jobs_per_source,
            "action": "scrape_and_analyze"
        }
        
        # Execute agent
        result = await agent.execute(input_data)
        
        return {
            "success": result.success,
            "data": result.data,
            "error": result.error,
            "execution_time": result.execution_time,
            "timestamp": result.timestamp.isoformat() if result.timestamp else None,
            "agent_name": result.agent_name,
            "sources_processed": sources,
            "keywords_used": keywords
        }
        
    except Exception as e:
        logger.error(f"Failed to execute job radar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Specific workflow endpoints for common use cases

@router.post("/workflows/reverse-talent-radar")
async def start_reverse_talent_radar(
    background_tasks: BackgroundTasks,
    sources: List[str] = ["stackoverflow_jobs", "github_jobs", "remoteok"],
    keywords: List[str] = ["python", "javascript", "react", "node.js"],
    max_jobs_per_source: int = 50
):
    """Start the complete Reverse Talent Radar workflow."""
    try:
        orchestrator = get_orchestrator()
        
        custom_input = {
            "scrape_jobs": {
                "sources": sources,
                "keywords": keywords,
                "max_jobs_per_source": max_jobs_per_source
            }
        }
        
        workflow_id = await orchestrator.create_workflow(
            template_name="reverse_talent_radar",
            workflow_name="Reverse Talent Radar - API Triggered",
            custom_input=custom_input,
            created_by="api_user"
        )
        
        # Execute in background
        background_tasks.add_task(orchestrator.execute_workflow, workflow_id)
        
        return {
            "workflow_id": workflow_id,
            "status": "started",
            "message": "Reverse Talent Radar workflow started",
            "estimated_completion": "10-15 minutes",
            "sources": sources,
            "keywords": keywords
        }
        
    except Exception as e:
        logger.error(f"Failed to start reverse talent radar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/workflows/daily-monitor")
async def start_daily_job_monitor(background_tasks: BackgroundTasks):
    """Start the daily job monitoring workflow."""
    try:
        orchestrator = get_orchestrator()
        
        workflow_id = await orchestrator.create_workflow(
            template_name="daily_job_monitor",
            workflow_name=f"Daily Job Monitor - {datetime.utcnow().strftime('%Y-%m-%d')}",
            created_by="api_user"
        )
        
        # Execute in background
        background_tasks.add_task(orchestrator.execute_workflow, workflow_id)
        
        return {
            "workflow_id": workflow_id,
            "status": "started",
            "message": "Daily job monitoring workflow started",
            "estimated_completion": "5-10 minutes"
        }
        
    except Exception as e:
        logger.error(f"Failed to start daily monitor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/workflows/targeted-outreach")
async def start_targeted_outreach(
    background_tasks: BackgroundTasks,
    company_names: List[str],
    message_type: str = "partnership_proposal"
):
    """Start targeted company outreach workflow."""
    try:
        if not company_names:
            raise HTTPException(status_code=400, detail="At least one company name is required")
        
        orchestrator = get_orchestrator()
        
        custom_input = {
            "company_research": {
                "company_names": company_names,
                "research_depth": "detailed"
            },
            "create_outreach": {
                "message_type": message_type
            }
        }
        
        workflow_id = await orchestrator.create_workflow(
            template_name="targeted_outreach",
            workflow_name=f"Targeted Outreach - {', '.join(company_names[:3])}{'...' if len(company_names) > 3 else ''}",
            custom_input=custom_input,
            created_by="api_user"
        )
        
        # Execute in background
        background_tasks.add_task(orchestrator.execute_workflow, workflow_id)
        
        return {
            "workflow_id": workflow_id,
            "status": "started",
            "message": f"Targeted outreach workflow started for {len(company_names)} companies",
            "companies": company_names,
            "message_type": message_type,
            "estimated_completion": "8-12 minutes"
        }
        
    except Exception as e:
        logger.error(f"Failed to start targeted outreach: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Analytics and insights endpoints

@router.get("/analytics/job-trends")
async def get_job_trends():
    """Get job market trends from scraped data."""
    try:
        db = get_database()
        
        # Get recent job postings
        recent_jobs = await db.job_postings.find({
            "scraped_at": {"$gte": datetime.utcnow().replace(day=1)}  # This month
        }).to_list(length=1000)
        
        if not recent_jobs:
            return {
                "message": "No recent job data available",
                "trends": {},
                "recommendations": ["Run the Reverse Talent Radar workflow to collect job data"]
            }
        
        # Analyze trends
        skill_counts = {}
        company_counts = {}
        location_counts = {}
        
        for job in recent_jobs:
            # Count skills
            for skill in job.get("required_skills", []) + job.get("preferred_skills", []):
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            # Count companies
            company = job.get("company_name", "Unknown")
            company_counts[company] = company_counts.get(company, 0) + 1
            
            # Count locations
            location = job.get("location", "Remote")
            location_counts[location] = location_counts.get(location, 0) + 1
        
        # Get top trends
        top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_companies = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "period": "Current Month",
            "total_jobs_analyzed": len(recent_jobs),
            "trends": {
                "top_skills": [{"skill": skill, "count": count} for skill, count in top_skills],
                "most_active_companies": [{"company": company, "job_count": count} for company, count in top_companies],
                "popular_locations": [{"location": location, "count": count} for location, count in top_locations]
            },
            "insights": [
                f"Most in-demand skill: {top_skills[0][0] if top_skills else 'N/A'}",
                f"Most active hiring company: {top_companies[0][0] if top_companies else 'N/A'}",
                f"Total unique companies hiring: {len(company_counts)}"
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get job trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/matching-performance")
async def get_matching_performance():
    """Get talent matching performance analytics."""
    try:
        db = get_database()
        
        # Get recent matches
        recent_matches = await db.talent_matches.find({
            "created_at": {"$gte": datetime.utcnow().replace(day=1)}
        }).to_list(length=1000)
        
        if not recent_matches:
            return {
                "message": "No recent matching data available",
                "performance": {},
                "recommendations": ["Run talent matching workflows to generate data"]
            }
        
        # Calculate performance metrics
        total_matches = len(recent_matches)
        high_quality_matches = len([m for m in recent_matches if m.get("overall_score", 0) >= 0.8])
        avg_score = sum(m.get("overall_score", 0) for m in recent_matches) / total_matches
        
        # Skill distribution
        skill_performance = {}
        for match in recent_matches:
            for skill in match.get("matched_skills", []):
                if skill not in skill_performance:
                    skill_performance[skill] = {"count": 0, "avg_score": 0, "scores": []}
                skill_performance[skill]["count"] += 1
                skill_performance[skill]["scores"].append(match.get("overall_score", 0))
        
        # Calculate average scores for each skill
        for skill in skill_performance:
            scores = skill_performance[skill]["scores"]
            skill_performance[skill]["avg_score"] = sum(scores) / len(scores)
        
        top_performing_skills = sorted(
            skill_performance.items(),
            key=lambda x: x[1]["avg_score"],
            reverse=True
        )[:10]
        
        return {
            "period": "Current Month",
            "performance": {
                "total_matches": total_matches,
                "high_quality_matches": high_quality_matches,
                "high_quality_rate": round(high_quality_matches / total_matches, 3) if total_matches > 0 else 0,
                "average_match_score": round(avg_score, 3),
                "top_performing_skills": [
                    {
                        "skill": skill,
                        "match_count": data["count"],
                        "avg_score": round(data["avg_score"], 3)
                    }
                    for skill, data in top_performing_skills
                ]
            },
            "insights": [
                f"High-quality match rate: {round((high_quality_matches / total_matches) * 100, 1)}%" if total_matches > 0 else "No matches yet",
                f"Best performing skill: {top_performing_skills[0][0] if top_performing_skills else 'N/A'}",
                f"Average match quality: {round(avg_score * 100, 1)}%" if total_matches > 0 else "N/A"
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get matching performance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))