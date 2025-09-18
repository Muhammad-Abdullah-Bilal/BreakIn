"""FastAPI application entrypoint for BreakIn backend.

This file creates and configures the FastAPI app, registers routers, and
manages lifecycle events (startup/shutdown).
"""

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os

# Import existing routes
from app.routes import auth, sprint, feedback, evaluation
from app.routes.auth import router as auth_router

# Import new sprint task routes
from app.routes.sprints.task_routes import router as task_router
from app.routes.sprints.websocket_routes import router as websocket_router

# Import services
from app.services.realtime_service import RealtimeService
from app.config import settings, connect_to_mongodb, close_mongodb_connection

### for gpt5-evaluator
from app.evaluator import evaluate_team_llm
from app.sample_data import example_team  # optional test data

# Initialize realtime service
realtime_service = RealtimeService()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="BreakIn API",
    description="Mentorship-first simulation platform for developer skill verification",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://breakin-demo.vercel.app",  # vercel demo
        "http://localhost:3000",            # local dev
        "http://localhost:3001",           
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(sprint.router, prefix="/sprint", tags=["Sprint"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
app.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"])

# Include new sprint task routes
app.include_router(task_router, prefix="/api/sprints", tags=["Sprint Tasks"])
app.include_router(websocket_router, prefix="/ws", tags=["WebSocket"])

@app.get("/")
def root():
    return {"message": "Backend BreakIn API running 🚀"}

@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection on startup."""
    await connect_to_mongodb()
    logger.info("Database connected successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    await close_mongodb_connection()
    logger.info("Database connection closed")

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# GPT5 Evaluator endpoint
@app.post("/evaluate")
def evaluate_endpoint():
    """Evaluate team performance using GPT5."""
    try:
        result = evaluate_team_llm(example_team)
        return {"evaluation": result, "status": "success"}
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Evaluation failed"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
