"""
FastAPI application entry point.
Configures middleware, CORS, and includes all API routes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import api_router


# Weekly report scheduler
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger


def _weekly_report_job():
    """Background job to send weekly report emails."""
    from app.core.database import SessionLocal
    from app.services.email_service import send_weekly_report_email_sync
    db = SessionLocal()
    try:
        send_weekly_report_email_sync(db)
    finally:
        db.close()


scheduler = BackgroundScheduler()


# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs on startup and shutdown.
    """
    # Startup
    logger.info("Starting Health Campaign Manager API...")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Start weekly report scheduler
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        day_map = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
        day_str = day_map.get(settings.WEEKLY_REPORT_DAY, "mon")
        scheduler.add_job(
            _weekly_report_job,
            CronTrigger(day_of_week=day_str, hour=settings.WEEKLY_REPORT_HOUR, minute=0),
            id="weekly_report",
            replace_existing=True,
        )
        scheduler.start()
        logger.info(f"Weekly report scheduler started (day={day_str}, hour={settings.WEEKLY_REPORT_HOUR})")
    else:
        logger.info("SMTP not configured, weekly report scheduler disabled")
    
    # Create database tables if they don't exist
    # Note: In production, use Alembic migrations instead
    # Base.metadata.create_all(bind=engine)
    
    yield
    
    # Shutdown
    if scheduler.running:
        scheduler.shutdown(wait=False)
    logger.info("Shutting down Health Campaign Manager API...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    Health Campaign Manager API
    
    A comprehensive API for managing health campaigns, including:
    - User authentication and authorization
    - Geographic hierarchy management (Regions, Departments, PHCs, CHWs)
    - Campaign management with molecule/vaccine tracking
    - Audit logging for all data modifications
    
    ## Authentication
    
    Use the `/api/v1/auth/login` endpoint to obtain JWT tokens.
    Include the access token in the `Authorization` header as `Bearer <token>`.
    
    ## Roles
    
    - **SUPER_ADMIN**: Full system access
    - **NATIONAL_MANAGER**: National level management
    - **REGION_MANAGER**: Regional level management
    - **DPT_MANAGER**: Department level management
    - **PHC_MANAGER**: PHC level management
    - **CHW**: Community Health Worker access
    """,
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan,
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages."""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors,
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors."""
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database error occurred"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"},
    )


# Include API router
app.include_router(api_router)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to Health Campaign Manager API",
        "version": settings.APP_VERSION,
        "docs": "/api/v1/docs",
        "redoc": "/api/v1/redoc",
    }
