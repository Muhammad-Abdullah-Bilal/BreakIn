"""FastAPI application entrypoint for BreakIn backend.

This file creates and configures the FastAPI app, registers routers, and
manages lifecycle events (startup/shutdown).
"""

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as StarletteHTTPException
from fastapi import HTTPException
import logging
import os

# Import existing routes
from app.routes import auth, sprint, feedback, health
try:
    from app.routes import evaluation
    EVALUATION_AVAILABLE = True
except ImportError:
    EVALUATION_AVAILABLE = False

# Import new sprint task routes
try:
    from app.routes.sprints.task_routes import router as task_router
    TASK_ROUTES_AVAILABLE = True
except ImportError:
    TASK_ROUTES_AVAILABLE = False

try:
    from app.routes.sprints.websocket_routes import router as websocket_router
    WEBSOCKET_ROUTES_AVAILABLE = True
except ImportError:
    WEBSOCKET_ROUTES_AVAILABLE = False

try:
    from app.routes.employer import employer_router
    EMPLOYER_AVAILABLE = True
except ImportError:
    EMPLOYER_AVAILABLE = False

try:
    from app.routes import agents
    AGENTS_AVAILABLE = True
except ImportError:
    AGENTS_AVAILABLE = False

# Import contracts routes if available
try:
    from app.routes import contracts
    CONTRACTS_AVAILABLE = True
except ImportError:
    CONTRACTS_AVAILABLE = False
    print("Warning: Contracts routes not available")

# Import pipeline routes
try:
    from app.routes import pipeline
    PIPELINE_AVAILABLE = True
except ImportError:
    PIPELINE_AVAILABLE = False

# Import analytics routes
try:
    from app.routes import analytics
    ANALYTICS_AVAILABLE = True
except ImportError:
    ANALYTICS_AVAILABLE = False
    print("Warning: Analytics routes not available")

# Import websocket routes
try:
    from app.routes import websocket
    WEBSOCKET_AVAILABLE = True
except ImportError as e:
    print(f"WebSocket routes not available: {e}")
    WEBSOCKET_AVAILABLE = False

# Import jobs routes
try:
    from app.routes import jobs
    JOBS_AVAILABLE = True
except ImportError as e:
    print(f"Jobs routes not available: {e}")
    JOBS_AVAILABLE = False

# Import intelligent jobs routes
try:
    from app.routes import intelligent_jobs
    INTELLIGENT_JOBS_AVAILABLE = True
except ImportError as e:
    print(f"Intelligent jobs routes not available: {e}")
    INTELLIGENT_JOBS_AVAILABLE = False

# Import services
try:
    from app.services.realtime_service import RealtimeService
    realtime_service = RealtimeService()
    REALTIME_SERVICE_AVAILABLE = True
except ImportError:
    REALTIME_SERVICE_AVAILABLE = False

# Import configuration and database
try:
    from app.config import settings, connect_to_mongodb, close_mongodb_connection
    from app.logging_config import configure_logging
    from app.exceptions import ServiceUnavailable
    CONFIG_AVAILABLE = True
except ImportError:
    CONFIG_AVAILABLE = False

# Import evaluator components
try:
    from app.evaluator import evaluate_team_llm
    from app.sample_data import example_team
    EVALUATOR_AVAILABLE = True
except ImportError:
    EVALUATOR_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    app = FastAPI(
        title="BreakIn API",
        description="Mentorship-first simulation platform for developer skill verification",
        version="1.0.0",
    )

    # CORS configuration
    if CONFIG_AVAILABLE:
        origins = [str(o) for o in settings.ALLOWED_ORIGINS]
    else:
        origins = [
            "https://breakin-demo.vercel.app",
            "https://*.vercel.app",  # All Vercel deployments
            "https://breakin.vercel.app",  # Production domain placeholder
            "https://breakin-frontend.vercel.app",  # Alternative naming
            "http://localhost:3000",  # Local development
            "http://localhost:3001",  # Alternative local port
            "http://127.0.0.1:3000",  # IPv4 localhost
        ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(sprint.router, prefix="/sprint", tags=["Sprint"])
    app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
    
    if EVALUATION_AVAILABLE:
        app.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"])
    
    # Include new sprint task routes
    if TASK_ROUTES_AVAILABLE:
        app.include_router(task_router, prefix="/api/sprints", tags=["Sprint Tasks"])
    
    if WEBSOCKET_ROUTES_AVAILABLE:
        app.include_router(websocket_router, prefix="/ws", tags=["WebSocket"])
    
    if EMPLOYER_AVAILABLE:
        app.include_router(employer_router)
    
    if AGENTS_AVAILABLE:
        app.include_router(agents.router, prefix="/api/v1")
    
    # Include contracts routes if available
    if CONTRACTS_AVAILABLE:
        app.include_router(contracts.router, prefix="/api/v1")
    
    # Include pipeline routes if available
    if PIPELINE_AVAILABLE:
        app.include_router(pipeline.router, prefix="/api/v1")
    
    # Include analytics routes if available
    if ANALYTICS_AVAILABLE:
        app.include_router(analytics.router, prefix="/api/v1")
    
    # Include websocket routes if available
    if WEBSOCKET_AVAILABLE:
        app.include_router(websocket.router)
    
    # Include jobs routes if available
    if JOBS_AVAILABLE:
        app.include_router(jobs.router)
    
    # Include intelligent jobs routes if available
    if INTELLIGENT_JOBS_AVAILABLE:
        app.include_router(intelligent_jobs.router)
    
    try:
        app.include_router(health.router, prefix="/health", tags=["Health"])
    except:
        pass  # Health router is optional

    # Exception handlers
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    # Root endpoint
    @app.get("/")
    async def root():
        return {"message": "Backend BreakIn API running 🚀"}

    # GPT5 evaluator endpoints (if available)
    if EVALUATOR_AVAILABLE:
        @app.get("/gpt5")
        def gpt5_root():
            return {"message": "Welcome to AI Team Evaluator API"}

        @app.post("/evaluate")
        def evaluate_team(team_data: dict):
            """Accept JSON input and return LLM evaluation."""
            return evaluate_team_llm(team_data)

        @app.get("/test")
        def test_eval():
            return evaluate_team_llm(example_team)

    return app

app = create_app()

# Startup and shutdown events
if CONFIG_AVAILABLE:
    @app.on_event("startup")
    async def on_startup():
        configure_logging(settings.LOG_LEVEL)
        logger.info("Starting BreakIn backend — connecting to services")
        ok = connect_to_mongodb()
        if not ok:
            logger.error("MongoDB connection failed during startup")
            raise ServiceUnavailable("MongoDB not reachable")

    @app.on_event("shutdown")
    async def on_shutdown():
        logger.info("Shutting down — closing DB connections")
        close_mongodb_connection()
else:
    @app.on_event("startup")
    async def startup_db_client():
        """Initialize database connection on startup."""
        connect_to_mongodb()
        logger.info("Database connected successfully")

    @app.on_event("shutdown")
    async def shutdown_db_client():
        """Close database connection on shutdown."""
        close_mongodb_connection()
        logger.info("Database connection closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
