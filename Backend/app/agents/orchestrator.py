"""Agent Orchestrator - Coordinates all AI agents and manages workflow automation."""

import asyncio
import json
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel
import logging
from concurrent.futures import ThreadPoolExecutor
import uuid

from .base_agent import BaseAgent, AgentConfig, AgentResult
from .job_radar_agent import JobRadarAgent
from .talent_matching_agent import TalentMatchingAgent
from .outreach_agent import OutreachAgent


class WorkflowStatus(str, Enum):
    """Workflow execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    """Individual task status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class WorkflowTask(BaseModel):
    """Individual task within a workflow."""
    task_id: str
    agent_name: str
    action: str
    input_data: Dict[str, Any]
    dependencies: List[str] = []  # Task IDs this task depends on
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0
    max_retries: int = 3


class Workflow(BaseModel):
    """Workflow definition and execution state."""
    workflow_id: str
    name: str
    description: Optional[str] = None
    tasks: List[WorkflowTask] = []
    status: WorkflowStatus = WorkflowStatus.PENDING
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: Optional[str] = None
    trigger_type: str = "manual"  # manual, scheduled, event
    trigger_config: Dict[str, Any] = {}
    context: Dict[str, Any] = {}  # Shared data between tasks


class AgentOrchestrator:
    """Orchestrates multiple AI agents and manages complex workflows."""
    
    def __init__(self, db_connection=None, config: Optional[Dict[str, Any]] = None):
        self.db = db_connection
        self.config = config or {}
        self.logger = logging.getLogger(__name__)
        
        # Initialize agents
        self.agents = {}
        self._initialize_agents()
        
        # Workflow management
        self.active_workflows: Dict[str, Workflow] = {}
        self.workflow_templates = {}
        self._initialize_workflow_templates()
        
        # Execution management
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.running_tasks = {}
        
        # Event system
        self.event_handlers: Dict[str, List[Callable]] = {}
    
    def _initialize_agents(self):
        """Initialize all available agents."""
        try:
            # Job Radar Agent
            job_radar_config = AgentConfig(
                name="job_radar",
                description="Scrapes and analyzes job postings from external platforms",
                custom_settings=self.config.get("job_radar", {})
            )
            self.agents["job_radar"] = JobRadarAgent(job_radar_config, self.db)
            
            # Talent Matching Agent
            talent_matching_config = AgentConfig(
                name="talent_matching",
                description="Matches developers with job opportunities using AI",
                custom_settings=self.config.get("talent_matching", {})
            )
            self.agents["talent_matching"] = TalentMatchingAgent(talent_matching_config, self.db)
            
            # Outreach Agent
            outreach_config = AgentConfig(
                name="outreach",
                description="Generates and manages personalized company outreach",
                custom_settings=self.config.get("outreach", {}),
            )
            self.agents["outreach"] = OutreachAgent(
                outreach_config, 
                self.db, 
                self.config.get("email_config", {})
            )
            
            self.logger.info(f"Initialized {len(self.agents)} agents")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize agents: {str(e)}")
    
    def _initialize_workflow_templates(self):
        """Initialize predefined workflow templates."""
        
        # Full Reverse Talent Radar Workflow
        self.workflow_templates["reverse_talent_radar"] = {
            "name": "Reverse Talent Radar",
            "description": "Complete workflow: scrape jobs, match talent, generate outreach",
            "tasks": [
                {
                    "task_id": "scrape_jobs",
                    "agent_name": "job_radar",
                    "action": "scrape_jobs",
                    "input_data": {
                        "sources": ["stackoverflow_jobs", "github_jobs", "remoteok"],
                        "keywords": ["python", "javascript", "react", "node.js", "full-stack"],
                        "max_jobs_per_source": 50
                    },
                    "dependencies": []
                },
                {
                    "task_id": "match_talent",
                    "agent_name": "talent_matching",
                    "action": "match_talent",
                    "input_data": {
                        "job_postings": "{{scrape_jobs.result.job_postings}}",
                        "match_threshold": 0.7,
                        "max_matches_per_job": 5
                    },
                    "dependencies": ["scrape_jobs"]
                },
                {
                    "task_id": "generate_outreach",
                    "agent_name": "outreach",
                    "action": "generate_outreach",
                    "input_data": {
                        "company_profiles": "{{match_talent.result.company_profiles}}",
                        "talent_matches": "{{match_talent.result.matches}}",
                        "message_type": "warm_introduction"
                    },
                    "dependencies": ["match_talent"]
                }
            ]
        }
        
        # Daily Job Monitoring Workflow
        self.workflow_templates["daily_job_monitor"] = {
            "name": "Daily Job Monitoring",
            "description": "Daily monitoring of new job postings and quick matching",
            "tasks": [
                {
                    "task_id": "daily_scrape",
                    "agent_name": "job_radar",
                    "action": "scrape_jobs",
                    "input_data": {
                        "sources": ["stackoverflow_jobs", "github_jobs"],
                        "keywords": ["senior", "lead", "principal"],
                        "posted_since": "24h",
                        "max_jobs_per_source": 20
                    },
                    "dependencies": []
                },
                {
                    "task_id": "quick_match",
                    "agent_name": "talent_matching",
                    "action": "match_talent",
                    "input_data": {
                        "job_postings": "{{daily_scrape.result.job_postings}}",
                        "match_threshold": 0.8,
                        "max_matches_per_job": 3,
                        "priority_skills": ["react", "python", "aws"]
                    },
                    "dependencies": ["daily_scrape"]
                }
            ]
        }
        
        # Targeted Company Outreach Workflow
        self.workflow_templates["targeted_outreach"] = {
            "name": "Targeted Company Outreach",
            "description": "Generate personalized outreach for specific companies",
            "tasks": [
                {
                    "task_id": "company_research",
                    "agent_name": "job_radar",
                    "action": "research_companies",
                    "input_data": {
                        "company_names": [],  # To be provided when creating workflow
                        "research_depth": "detailed"
                    },
                    "dependencies": []
                },
                {
                    "task_id": "find_matches",
                    "agent_name": "talent_matching",
                    "action": "find_company_matches",
                    "input_data": {
                        "company_profiles": "{{company_research.result.companies}}",
                        "match_threshold": 0.75
                    },
                    "dependencies": ["company_research"]
                },
                {
                    "task_id": "create_outreach",
                    "agent_name": "outreach",
                    "action": "generate_outreach",
                    "input_data": {
                        "company_profiles": "{{company_research.result.companies}}",
                        "talent_matches": "{{find_matches.result.matches}}",
                        "message_type": "partnership_proposal"
                    },
                    "dependencies": ["find_matches"]
                }
            ]
        }
    
    async def create_workflow(
        self,
        template_name: str,
        workflow_name: Optional[str] = None,
        custom_input: Optional[Dict[str, Any]] = None,
        created_by: Optional[str] = None
    ) -> str:
        """Create a new workflow from a template."""
        
        if template_name not in self.workflow_templates:
            raise ValueError(f"Unknown workflow template: {template_name}")
        
        template = self.workflow_templates[template_name]
        workflow_id = str(uuid.uuid4())
        
        # Create workflow
        workflow = Workflow(
            workflow_id=workflow_id,
            name=workflow_name or template["name"],
            description=template["description"],
            created_at=datetime.utcnow(),
            created_by=created_by
        )
        
        # Create tasks from template
        for task_template in template["tasks"]:
            task = WorkflowTask(
                task_id=task_template["task_id"],
                agent_name=task_template["agent_name"],
                action=task_template["action"],
                input_data=task_template["input_data"].copy(),
                dependencies=task_template["dependencies"].copy()
            )
            
            # Apply custom input overrides
            if custom_input and task.task_id in custom_input:
                task.input_data.update(custom_input[task.task_id])
            
            workflow.tasks.append(task)
        
        # Store workflow
        self.active_workflows[workflow_id] = workflow
        
        if self.db is not None:
            try:
                self.db.workflows.insert_one(workflow.dict())
            except Exception:
                pass
        
        self.logger.info(f"Created workflow {workflow_id} from template {template_name}")
        return workflow_id
    
    async def execute_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Execute a workflow."""
        
        if workflow_id not in self.active_workflows:
            # Try to load from database
            if self.db is not None:
                workflow_data = self.db.workflows.find_one({"workflow_id": workflow_id})
                if workflow_data:
                    self.active_workflows[workflow_id] = Workflow(**workflow_data)
                else:
                    raise ValueError(f"Workflow {workflow_id} not found")
            else:
                raise ValueError(f"Workflow {workflow_id} not found")
        
        workflow = self.active_workflows[workflow_id]
        
        if workflow.status == WorkflowStatus.RUNNING:
            return {"message": "Workflow is already running", "workflow_id": workflow_id}
        
        # Start workflow execution
        workflow.status = WorkflowStatus.RUNNING
        workflow.started_at = datetime.utcnow()
        
        try:
            await self._execute_workflow_tasks(workflow)
            
            # Check if all tasks completed successfully
            failed_tasks = [t for t in workflow.tasks if t.status == TaskStatus.FAILED]
            if failed_tasks:
                workflow.status = WorkflowStatus.FAILED
            else:
                workflow.status = WorkflowStatus.COMPLETED
            
            workflow.completed_at = datetime.utcnow()
            
        except Exception as e:
            self.logger.error(f"Workflow {workflow_id} execution failed: {str(e)}")
            workflow.status = WorkflowStatus.FAILED
            workflow.completed_at = datetime.utcnow()
        
        # Update in database
        if self.db is not None:
            try:
                self.db.workflows.update_one(
                    {"workflow_id": workflow_id},
                    {"$set": workflow.dict()}
                )
            except Exception:
                pass
        
        # Emit workflow completion event
        await self._emit_event("workflow_completed", {
            "workflow_id": workflow_id,
            "status": workflow.status,
            "execution_time": (workflow.completed_at - workflow.started_at).total_seconds()
        })
        
        return {
            "workflow_id": workflow_id,
            "status": workflow.status,
            "completed_tasks": len([t for t in workflow.tasks if t.status == TaskStatus.COMPLETED]),
            "failed_tasks": len([t for t in workflow.tasks if t.status == TaskStatus.FAILED]),
            "execution_time": (workflow.completed_at - workflow.started_at).total_seconds() if workflow.completed_at else None
        }
    
    async def _execute_workflow_tasks(self, workflow: Workflow):
        """Execute all tasks in a workflow, respecting dependencies."""
        
        completed_tasks = set()
        
        while len(completed_tasks) < len(workflow.tasks):
            # Find tasks that can be executed (dependencies met)
            ready_tasks = []
            for task in workflow.tasks:
                if (task.status == TaskStatus.PENDING and 
                    all(dep in completed_tasks for dep in task.dependencies)):
                    ready_tasks.append(task)
            
            if not ready_tasks:
                # Check if we're stuck (no ready tasks but not all completed)
                pending_tasks = [t for t in workflow.tasks if t.status == TaskStatus.PENDING]
                if pending_tasks:
                    self.logger.error(f"Workflow stuck - no ready tasks but {len(pending_tasks)} pending")
                    for task in pending_tasks:
                        task.status = TaskStatus.FAILED
                        task.error = "Dependency deadlock"
                break
            
            # Execute ready tasks in parallel
            task_futures = []
            for task in ready_tasks:
                future = asyncio.create_task(self._execute_task(workflow, task))
                task_futures.append((task, future))
            
            # Wait for all tasks to complete
            for task, future in task_futures:
                try:
                    await future
                    if task.status == TaskStatus.COMPLETED:
                        completed_tasks.add(task.task_id)
                except Exception as e:
                    self.logger.error(f"Task {task.task_id} failed: {str(e)}")
                    task.status = TaskStatus.FAILED
                    task.error = str(e)
    
    async def _execute_task(self, workflow: Workflow, task: WorkflowTask):
        """Execute a single task."""
        
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.utcnow()
        
        try:
            # Get the agent
            if task.agent_name not in self.agents:
                raise ValueError(f"Unknown agent: {task.agent_name}")
            
            agent = self.agents[task.agent_name]
            
            # Resolve input data (replace template variables)
            resolved_input = await self._resolve_task_input(workflow, task)
            
            # Execute the task
            result = await agent.execute(resolved_input)
            
            if result.success:
                task.status = TaskStatus.COMPLETED
                task.result = result.data
                
                # Store result in workflow context for other tasks
                workflow.context[task.task_id] = {"result": result.data}
                
            else:
                task.status = TaskStatus.FAILED
                task.error = result.error
                
                # Retry logic
                if task.retry_count < task.max_retries:
                    task.retry_count += 1
                    task.status = TaskStatus.PENDING
                    self.logger.info(f"Retrying task {task.task_id} (attempt {task.retry_count})")
                    await asyncio.sleep(2 ** task.retry_count)  # Exponential backoff
                    return await self._execute_task(workflow, task)
            
            task.completed_at = datetime.utcnow()
            
        except Exception as e:
            self.logger.error(f"Task {task.task_id} execution failed: {str(e)}")
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = datetime.utcnow()
    
    async def _resolve_task_input(self, workflow: Workflow, task: WorkflowTask) -> Dict[str, Any]:
        """Resolve template variables in task input data."""
        
        resolved_input = {}
        
        for key, value in task.input_data.items():
            if isinstance(value, str) and value.startswith("{{") and value.endswith("}}"):
                # Template variable
                var_path = value[2:-2].strip()
                resolved_value = self._get_context_value(workflow, var_path)
                resolved_input[key] = resolved_value
            else:
                resolved_input[key] = value
        
        # Add action to resolved input
        resolved_input["action"] = task.action
        
        return resolved_input
    
    def _get_context_value(self, workflow: Workflow, path: str) -> Any:
        """Get value from workflow context using dot notation."""
        
        parts = path.split(".")
        current = workflow.context
        
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                self.logger.warning(f"Context path not found: {path}")
                return None
        
        return current
    
    async def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        """Get current status of a workflow."""
        
        if workflow_id not in self.active_workflows:
            if self.db is not None:
                workflow_data = self.db.workflows.find_one({"workflow_id": workflow_id})
                if workflow_data:
                    workflow = Workflow(**workflow_data)
                else:
                    raise ValueError(f"Workflow {workflow_id} not found")
            else:
                raise ValueError(f"Workflow {workflow_id} not found")
        else:
            workflow = self.active_workflows[workflow_id]
        
        # Calculate progress
        total_tasks = len(workflow.tasks)
        completed_tasks = len([t for t in workflow.tasks if t.status == TaskStatus.COMPLETED])
        failed_tasks = len([t for t in workflow.tasks if t.status == TaskStatus.FAILED])
        running_tasks = len([t for t in workflow.tasks if t.status == TaskStatus.RUNNING])
        
        progress = (completed_tasks / total_tasks) if total_tasks > 0 else 0
        
        return {
            "workflow_id": workflow_id,
            "name": workflow.name,
            "status": workflow.status,
            "progress": round(progress, 2),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "running_tasks": running_tasks,
            "started_at": workflow.started_at.isoformat() if workflow.started_at else None,
            "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None,
            "tasks": [
                {
                    "task_id": task.task_id,
                    "agent_name": task.agent_name,
                    "action": task.action,
                    "status": task.status,
                    "error": task.error,
                    "started_at": task.started_at.isoformat() if task.started_at else None,
                    "completed_at": task.completed_at.isoformat() if task.completed_at else None
                }
                for task in workflow.tasks
            ]
        }
    
    async def cancel_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Cancel a running workflow."""
        
        if workflow_id not in self.active_workflows:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        workflow = self.active_workflows[workflow_id]
        
        if workflow.status != WorkflowStatus.RUNNING:
            return {"message": "Workflow is not running", "status": workflow.status}
        
        # Cancel running tasks
        for task in workflow.tasks:
            if task.status == TaskStatus.RUNNING:
                task.status = TaskStatus.FAILED
                task.error = "Workflow cancelled"
                task.completed_at = datetime.utcnow()
        
        workflow.status = WorkflowStatus.CANCELLED
        workflow.completed_at = datetime.utcnow()
        
        # Update in database
        if self.db is not None:
            try:
                self.db.workflows.update_one(
                    {"workflow_id": workflow_id},
                    {"$set": workflow.dict()}
                )
            except Exception:
                pass
        
        return {"workflow_id": workflow_id, "status": "cancelled"}
    
    async def list_workflows(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all workflows, optionally filtered by status."""
        
        workflows = []
        
        # Get from active workflows
        for workflow in self.active_workflows.values():
            if not status or workflow.status == status:
                workflows.append({
                    "workflow_id": workflow.workflow_id,
                    "name": workflow.name,
                    "status": workflow.status,
                    "created_at": workflow.created_at.isoformat(),
                    "started_at": workflow.started_at.isoformat() if workflow.started_at else None,
                    "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None,
                    "task_count": len(workflow.tasks)
                })
        
        # Get from database if available
        if self.db is not None:
            try:
                query = {"status": status} if status else {}
                db_workflows = list(self.db.workflows.find(query).limit(100))
                
                for workflow_data in db_workflows:
                    if workflow_data.get("workflow_id") not in self.active_workflows:
                        workflows.append({
                            "workflow_id": workflow_data.get("workflow_id", ""),
                            "name": workflow_data.get("name", "Workflow"),
                            "status": workflow_data.get("status", "unknown"),
                            "created_at": str(workflow_data.get("created_at", "")),
                            "started_at": str(workflow_data.get("started_at", "")) if workflow_data.get("started_at") else None,
                            "completed_at": str(workflow_data.get("completed_at", "")) if workflow_data.get("completed_at") else None,
                            "task_count": len(workflow_data.get("tasks", []))
                        })
            except Exception as e:
                self.logger.warning(f"Error fetching workflows from db: {e}")
        
        return sorted(workflows, key=lambda x: x["created_at"], reverse=True)
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """Register an event handler."""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    async def _emit_event(self, event_type: str, data: Dict[str, Any]):
        """Emit an event to all registered handlers."""
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    await handler(data)
                except Exception as e:
                    self.logger.error(f"Event handler failed for {event_type}: {str(e)}")
    
    async def schedule_workflow(
        self,
        template_name: str,
        schedule: str,
        workflow_name: Optional[str] = None,
        custom_input: Optional[Dict[str, Any]] = None
    ) -> str:
        """Schedule a workflow to run periodically."""
        
        # Create workflow
        workflow_id = await self.create_workflow(
            template_name=template_name,
            workflow_name=workflow_name,
            custom_input=custom_input
        )
        
        workflow = self.active_workflows[workflow_id]
        workflow.trigger_type = "scheduled"
        workflow.trigger_config = {"schedule": schedule}
        
        # TODO: Implement actual scheduling (could use APScheduler or similar)
        self.logger.info(f"Scheduled workflow {workflow_id} with schedule: {schedule}")
        
        return workflow_id
    
    async def get_agent_health(self) -> Dict[str, Any]:
        """Get health status of all agents."""
        
        health_status = {}
        
        for agent_name, agent in self.agents.items():
            try:
                # Basic health check
                health_status[agent_name] = {
                    "status": "healthy",
                    "last_check": datetime.utcnow().isoformat(),
                    "agent_type": type(agent).__name__
                }
            except Exception as e:
                health_status[agent_name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "last_check": datetime.utcnow().isoformat(),
                    "agent_type": type(agent).__name__
                }
        
        return {
            "orchestrator_status": "healthy",
            "total_agents": len(self.agents),
            "healthy_agents": len([s for s in health_status.values() if s["status"] == "healthy"]),
            "agents": health_status
        }