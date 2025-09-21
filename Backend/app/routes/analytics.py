"""API routes for Analytics and Reporting system."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from enum import Enum
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
import json
from io import StringIO
import csv

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Enums
class ReportType(str, Enum):
    HIRING_METRICS = "hiring_metrics"
    CANDIDATE_PERFORMANCE = "candidate_performance"
    SPRINT_ANALYTICS = "sprint_analytics"
    AGENT_PERFORMANCE = "agent_performance"
    PIPELINE_ANALYTICS = "pipeline_analytics"
    COST_ANALYSIS = "cost_analysis"

class TimeRange(str, Enum):
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    LAST_90_DAYS = "last_90_days"
    LAST_6_MONTHS = "last_6_months"
    LAST_YEAR = "last_year"
    CUSTOM = "custom"

class ExportFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"
    JSON = "json"
    EXCEL = "excel"

# Pydantic Models
class MetricValue(BaseModel):
    value: float
    change: Optional[float] = None
    change_percentage: Optional[float] = None
    trend: Optional[str] = None  # "up", "down", "stable"

class HiringMetrics(BaseModel):
    total_candidates: MetricValue
    active_positions: MetricValue
    successful_hires: MetricValue
    time_to_hire: MetricValue  # in days
    cost_per_hire: MetricValue
    candidate_satisfaction: MetricValue
    offer_acceptance_rate: MetricValue
    pipeline_conversion_rate: MetricValue

class CandidatePerformance(BaseModel):
    candidate_id: str
    candidate_name: str
    codename: str
    total_sprints: int
    completed_sprints: int
    success_rate: float
    average_score: float
    skills_growth: List[str]
    endorsements_received: int
    time_to_completion: float  # average days
    difficulty_preference: str
    collaboration_score: float

class SprintAnalytics(BaseModel):
    sprint_id: str
    sprint_name: str
    difficulty_level: str
    total_participants: int
    completion_rate: float
    average_score: float
    average_time: float  # hours
    skill_categories: List[str]
    employer_satisfaction: float
    candidate_feedback_score: float

class AgentPerformance(BaseModel):
    agent_type: str
    agent_name: str
    total_operations: int
    success_rate: float
    average_response_time: float  # seconds
    cost_savings: float
    accuracy_score: float
    user_satisfaction: float
    uptime_percentage: float

class PipelineAnalytics(BaseModel):
    stage_name: str
    total_candidates: int
    conversion_rate: float
    average_time_in_stage: float  # days
    drop_off_rate: float
    bottleneck_score: float  # 0-100, higher means more bottleneck

class CostAnalysis(BaseModel):
    category: str
    total_cost: float
    cost_per_hire: float
    roi: float
    budget_utilization: float
    cost_trend: str

class ReportRequest(BaseModel):
    report_type: ReportType
    time_range: TimeRange
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    filters: Optional[Dict[str, Any]] = None
    export_format: Optional[ExportFormat] = ExportFormat.JSON

class DashboardConfig(BaseModel):
    widgets: List[Dict[str, Any]]
    layout: Dict[str, Any]
    refresh_interval: int = 300  # seconds
    auto_refresh: bool = True

# Mock Database Functions
def get_hiring_metrics(time_range: TimeRange, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> HiringMetrics:
    """Get hiring metrics for the specified time range."""
    return HiringMetrics(
        total_candidates=MetricValue(value=247, change=23, change_percentage=10.3, trend="up"),
        active_positions=MetricValue(value=12, change=-2, change_percentage=-14.3, trend="down"),
        successful_hires=MetricValue(value=34, change=8, change_percentage=30.8, trend="up"),
        time_to_hire=MetricValue(value=18.5, change=-2.3, change_percentage=-11.0, trend="down"),
        cost_per_hire=MetricValue(value=3200, change=-450, change_percentage=-12.3, trend="down"),
        candidate_satisfaction=MetricValue(value=4.7, change=0.2, change_percentage=4.4, trend="up"),
        offer_acceptance_rate=MetricValue(value=87.5, change=5.2, change_percentage=6.3, trend="up"),
        pipeline_conversion_rate=MetricValue(value=23.8, change=3.1, change_percentage=15.0, trend="up")
    )

def get_candidate_performance_data(time_range: TimeRange, filters: Optional[Dict] = None) -> List[CandidatePerformance]:
    """Get candidate performance data."""
    return [
        CandidatePerformance(
            candidate_id="cand_001",
            candidate_name="Alex Chen",
            codename="ReactNinja_2024",
            total_sprints=15,
            completed_sprints=14,
            success_rate=93.3,
            average_score=8.7,
            skills_growth=["React", "TypeScript", "GraphQL"],
            endorsements_received=8,
            time_to_completion=4.2,
            difficulty_preference="Advanced",
            collaboration_score=9.1
        ),
        CandidatePerformance(
            candidate_id="cand_002",
            candidate_name="Sarah Johnson",
            codename="FullStackPro_2024",
            total_sprints=12,
            completed_sprints=11,
            success_rate=91.7,
            average_score=8.4,
            skills_growth=["Node.js", "MongoDB", "Docker"],
            endorsements_received=6,
            time_to_completion=3.8,
            difficulty_preference="Intermediate",
            collaboration_score=8.9
        )
    ]

def get_sprint_analytics_data(time_range: TimeRange, filters: Optional[Dict] = None) -> List[SprintAnalytics]:
    """Get sprint analytics data."""
    return [
        SprintAnalytics(
            sprint_id="sprint_001",
            sprint_name="E-commerce Platform",
            difficulty_level="Advanced",
            total_participants=23,
            completion_rate=87.0,
            average_score=8.2,
            average_time=32.5,
            skill_categories=["Frontend", "Backend", "Database"],
            employer_satisfaction=9.1,
            candidate_feedback_score=8.8
        ),
        SprintAnalytics(
            sprint_id="sprint_002",
            sprint_name="Mobile App Development",
            difficulty_level="Intermediate",
            total_participants=31,
            completion_rate=92.3,
            average_score=7.9,
            average_time=28.7,
            skill_categories=["React Native", "API Integration"],
            employer_satisfaction=8.7,
            candidate_feedback_score=9.0
        )
    ]

def get_agent_performance_data(time_range: TimeRange) -> List[AgentPerformance]:
    """Get AI agent performance data."""
    return [
        AgentPerformance(
            agent_type="job_radar",
            agent_name="Talent Scout",
            total_operations=1247,
            success_rate=94.2,
            average_response_time=2.3,
            cost_savings=12500.0,
            accuracy_score=96.8,
            user_satisfaction=4.8,
            uptime_percentage=99.7
        ),
        AgentPerformance(
            agent_type="talent_matching",
            agent_name="Match Maker",
            total_operations=856,
            success_rate=91.5,
            average_response_time=1.8,
            cost_savings=8900.0,
            accuracy_score=93.4,
            user_satisfaction=4.6,
            uptime_percentage=99.2
        )
    ]

def get_pipeline_analytics_data(time_range: TimeRange) -> List[PipelineAnalytics]:
    """Get pipeline analytics data."""
    return [
        PipelineAnalytics(
            stage_name="Application Review",
            total_candidates=247,
            conversion_rate=78.5,
            average_time_in_stage=2.3,
            drop_off_rate=21.5,
            bottleneck_score=25.0
        ),
        PipelineAnalytics(
            stage_name="Technical Interview",
            total_candidates=194,
            conversion_rate=85.6,
            average_time_in_stage=5.2,
            drop_off_rate=14.4,
            bottleneck_score=65.0
        ),
        PipelineAnalytics(
            stage_name="Final Interview",
            total_candidates=166,
            conversion_rate=92.8,
            average_time_in_stage=3.1,
            drop_off_rate=7.2,
            bottleneck_score=15.0
        )
    ]

def get_cost_analysis_data(time_range: TimeRange) -> List[CostAnalysis]:
    """Get cost analysis data."""
    return [
        CostAnalysis(
            category="Recruitment Platform",
            total_cost=15000.0,
            cost_per_hire=441.2,
            roi=3.2,
            budget_utilization=78.5,
            cost_trend="decreasing"
        ),
        CostAnalysis(
            category="AI Agents",
            total_cost=8500.0,
            cost_per_hire=250.0,
            roi=4.8,
            budget_utilization=65.2,
            cost_trend="stable"
        ),
        CostAnalysis(
            category="Sprint Challenges",
            total_cost=12000.0,
            cost_per_hire=352.9,
            roi=2.9,
            budget_utilization=82.1,
            cost_trend="increasing"
        )
    ]

# API Endpoints
@router.get("/metrics/hiring", response_model=HiringMetrics)
async def get_hiring_metrics_endpoint(
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """Get comprehensive hiring metrics."""
    return get_hiring_metrics(time_range, start_date, end_date)

@router.get("/performance/candidates", response_model=List[CandidatePerformance])
async def get_candidate_performance_endpoint(
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    skill_filter: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    limit: int = Query(50)
):
    """Get candidate performance analytics."""
    filters = {}
    if skill_filter:
        filters["skills"] = skill_filter.split(",")
    if min_score:
        filters["min_score"] = min_score
    
    data = get_candidate_performance_data(time_range, filters)
    return data[:limit]

@router.get("/performance/sprints", response_model=List[SprintAnalytics])
async def get_sprint_analytics_endpoint(
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    difficulty: Optional[str] = Query(None),
    skill_category: Optional[str] = Query(None)
):
    """Get sprint performance analytics."""
    filters = {}
    if difficulty:
        filters["difficulty"] = difficulty
    if skill_category:
        filters["skill_category"] = skill_category
    
    return get_sprint_analytics_data(time_range, filters)

@router.get("/performance/agents", response_model=List[AgentPerformance])
async def get_agent_performance_endpoint(
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    agent_type: Optional[str] = Query(None)
):
    """Get AI agent performance analytics."""
    data = get_agent_performance_data(time_range)
    if agent_type:
        data = [agent for agent in data if agent.agent_type == agent_type]
    return data

@router.get("/pipeline", response_model=List[PipelineAnalytics])
async def get_pipeline_analytics_endpoint(
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS)
):
    """Get candidate pipeline analytics."""
    return get_pipeline_analytics_data(time_range)

@router.get("/costs", response_model=List[CostAnalysis])
async def get_cost_analysis_endpoint(
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    category: Optional[str] = Query(None)
):
    """Get cost analysis data."""
    data = get_cost_analysis_data(time_range)
    if category:
        data = [cost for cost in data if cost.category.lower() == category.lower()]
    return data

@router.post("/reports/generate")
async def generate_report(request: ReportRequest):
    """Generate a comprehensive report based on the request."""
    report_data = {}
    
    if request.report_type == ReportType.HIRING_METRICS:
        report_data = get_hiring_metrics(request.time_range, request.start_date, request.end_date)
    elif request.report_type == ReportType.CANDIDATE_PERFORMANCE:
        report_data = get_candidate_performance_data(request.time_range, request.filters)
    elif request.report_type == ReportType.SPRINT_ANALYTICS:
        report_data = get_sprint_analytics_data(request.time_range, request.filters)
    elif request.report_type == ReportType.AGENT_PERFORMANCE:
        report_data = get_agent_performance_data(request.time_range)
    elif request.report_type == ReportType.PIPELINE_ANALYTICS:
        report_data = get_pipeline_analytics_data(request.time_range)
    elif request.report_type == ReportType.COST_ANALYSIS:
        report_data = get_cost_analysis_data(request.time_range)
    
    # Format based on export format
    if request.export_format == ExportFormat.JSON:
        return {
            "report_type": request.report_type,
            "generated_at": datetime.now().isoformat(),
            "time_range": request.time_range,
            "data": report_data
        }
    elif request.export_format == ExportFormat.CSV:
        # Convert to CSV format
        if isinstance(report_data, list):
            output = StringIO()
            if report_data:
                writer = csv.DictWriter(output, fieldnames=report_data[0].__dict__.keys())
                writer.writeheader()
                for item in report_data:
                    writer.writerow(item.__dict__)
            csv_content = output.getvalue()
            output.close()
            return {
                "format": "csv",
                "content": csv_content,
                "filename": f"{request.report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
    
    return {"error": "Unsupported export format"}

@router.get("/dashboard/config")
async def get_dashboard_config():
    """Get dashboard configuration."""
    return {
        "widgets": [
            {
                "id": "hiring_metrics",
                "type": "metrics_grid",
                "title": "Hiring Metrics",
                "position": {"x": 0, "y": 0, "w": 12, "h": 4},
                "config": {
                    "metrics": ["total_candidates", "successful_hires", "time_to_hire", "cost_per_hire"]
                }
            },
            {
                "id": "pipeline_funnel",
                "type": "funnel_chart",
                "title": "Candidate Pipeline",
                "position": {"x": 0, "y": 4, "w": 6, "h": 6},
                "config": {
                    "stages": ["Application", "Technical", "Final", "Offer"]
                }
            },
            {
                "id": "agent_performance",
                "type": "performance_chart",
                "title": "AI Agent Performance",
                "position": {"x": 6, "y": 4, "w": 6, "h": 6},
                "config": {
                    "metrics": ["success_rate", "cost_savings", "accuracy_score"]
                }
            },
            {
                "id": "cost_breakdown",
                "type": "pie_chart",
                "title": "Cost Breakdown",
                "position": {"x": 0, "y": 10, "w": 6, "h": 4},
                "config": {
                    "categories": ["platform", "agents", "sprints", "other"]
                }
            },
            {
                "id": "recent_activity",
                "type": "activity_feed",
                "title": "Recent Activity",
                "position": {"x": 6, "y": 10, "w": 6, "h": 4},
                "config": {
                    "limit": 10,
                    "types": ["hire", "interview", "application"]
                }
            }
        ],
        "layout": {
            "cols": 12,
            "rowHeight": 60,
            "margin": [10, 10]
        },
        "refresh_interval": 300,
        "auto_refresh": True
    }

@router.post("/dashboard/config")
async def update_dashboard_config(config: DashboardConfig):
    """Update dashboard configuration."""
    # In a real app, save to database
    return {
        "message": "Dashboard configuration updated successfully",
        "config": config
    }

@router.get("/insights")
async def get_insights(
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS)
):
    """Get AI-generated insights and recommendations."""
    return {
        "insights": [
            {
                "type": "trend",
                "title": "Hiring Velocity Increasing",
                "description": "Your time-to-hire has decreased by 11% this month, indicating improved process efficiency.",
                "impact": "positive",
                "confidence": 0.92,
                "recommendation": "Consider scaling your current processes to handle increased volume."
            },
            {
                "type": "bottleneck",
                "title": "Technical Interview Bottleneck",
                "description": "Candidates spend 65% longer in technical interviews compared to industry average.",
                "impact": "negative",
                "confidence": 0.87,
                "recommendation": "Consider implementing automated technical assessments or additional interviewers."
            },
            {
                "type": "opportunity",
                "title": "AI Agent ROI Opportunity",
                "description": "Your AI agents show 4.8x ROI. Consider expanding their usage to other hiring stages.",
                "impact": "positive",
                "confidence": 0.95,
                "recommendation": "Deploy additional agents for candidate screening and initial outreach."
            }
        ],
        "generated_at": datetime.now().isoformat(),
        "time_range": time_range
    }

@router.get("/benchmarks")
async def get_industry_benchmarks():
    """Get industry benchmarks for comparison."""
    return {
        "benchmarks": {
            "time_to_hire": {
                "your_value": 18.5,
                "industry_average": 23.2,
                "top_quartile": 15.8,
                "unit": "days"
            },
            "cost_per_hire": {
                "your_value": 3200,
                "industry_average": 4129,
                "top_quartile": 2850,
                "unit": "USD"
            },
            "offer_acceptance_rate": {
                "your_value": 87.5,
                "industry_average": 82.3,
                "top_quartile": 91.2,
                "unit": "percentage"
            },
            "candidate_satisfaction": {
                "your_value": 4.7,
                "industry_average": 4.2,
                "top_quartile": 4.8,
                "unit": "rating"
            }
        },
        "industry": "Technology",
        "company_size": "50-200 employees",
        "last_updated": datetime.now().isoformat()
    }

@router.get("/export/{report_id}")
async def export_report(
    report_id: str,
    format: ExportFormat = Query(ExportFormat.PDF)
):
    """Export a previously generated report."""
    # In a real app, retrieve report from database
    return {
        "download_url": f"/api/v1/analytics/downloads/{report_id}.{format.value}",
        "expires_at": (datetime.now() + timedelta(hours=24)).isoformat(),
        "format": format.value,
        "size_bytes": 1024000  # Mock size
    }