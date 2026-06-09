"""
Main API router that combines all route modules.
Provides versioned API endpoints under /api/v1.
"""

from fastapi import APIRouter

from app.api.routes import auth, users, geography, campaigns, audit, targets


# Main API router with version prefix
api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(geography.router)
api_router.include_router(campaigns.router)
api_router.include_router(audit.router)
api_router.include_router(targets.router)
