"""
Email management API routes.
Provides endpoints for sending reports and configuring email settings.
"""

import logging
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import User
from app.core.config import settings
from app.services.email_service import (
    send_weekly_report_email,
    send_campaign_creation_email_sync,
    _smtp_configured,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/emails", tags=["Emails"])


class EmailTestRequest(BaseModel):
    to_email: EmailStr


class EmailConfigResponse(BaseModel):
    smtp_configured: bool
    smtp_host: str
    smtp_port: int
    smtp_user: str
    from_email: str
    weekly_report_day: int
    weekly_report_hour: int

    class Config:
        from_attributes = True


class SmtpConfigUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    weekly_report_day: Optional[int] = None
    weekly_report_hour: Optional[int] = None


@router.get("/config", response_model=EmailConfigResponse)
def get_email_config(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get current email/SMTP configuration."""
    return EmailConfigResponse(
        smtp_configured=_smtp_configured(),
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_user=settings.SMTP_USER or "",
        from_email=settings.SMTP_FROM_EMAIL or "",
        weekly_report_day=settings.WEEKLY_REPORT_DAY,
        weekly_report_hour=settings.WEEKLY_REPORT_HOUR,
    )


@router.put("/config", response_model=EmailConfigResponse)
def update_email_config(
    config_in: SmtpConfigUpdate,
    current_user: User = Depends(deps.require_national_manager),
) -> Any:
    """Update SMTP configuration (National Manager or higher)."""
    if config_in.smtp_host is not None:
        settings.__dict__["SMTP_HOST"] = config_in.smtp_host
    if config_in.smtp_port is not None:
        settings.__dict__["SMTP_PORT"] = config_in.smtp_port
    if config_in.smtp_user is not None:
        settings.__dict__["SMTP_USER"] = config_in.smtp_user
    if config_in.smtp_password is not None:
        settings.__dict__["SMTP_PASSWORD"] = config_in.smtp_password
    if config_in.smtp_from_email is not None:
        settings.__dict__["SMTP_FROM_EMAIL"] = config_in.smtp_from_email
    if config_in.smtp_use_tls is not None:
        settings.__dict__["SMTP_USE_TLS"] = config_in.smtp_use_tls
    if config_in.weekly_report_day is not None:
        settings.__dict__["WEEKLY_REPORT_DAY"] = config_in.weekly_report_day
    if config_in.weekly_report_hour is not None:
        settings.__dict__["WEEKLY_REPORT_HOUR"] = config_in.weekly_report_hour

    return EmailConfigResponse(
        smtp_configured=_smtp_configured(),
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_user=settings.SMTP_USER or "",
        from_email=settings.SMTP_FROM_EMAIL or "",
        weekly_report_day=settings.WEEKLY_REPORT_DAY,
        weekly_report_hour=settings.WEEKLY_REPORT_HOUR,
    )


@router.post("/test")
async def send_test_email(
    req: EmailTestRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Send a test email to verify SMTP configuration."""
    if not _smtp_configured():
        raise HTTPException(status_code=400, detail="SMTP is not configured. Please set SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL.")

    from app.services.email_service import _send_email

    html = f"""
    <html><body style="font-family:Arial,sans-serif;">
    <h2 style="color:#0D1B2E;">Test Email</h2>
    <p>Ceci est un email de test depuis <strong>{settings.APP_NAME}</strong>.</p>
    <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
    </body></html>
    """
    success = await _send_email(
        to_emails=[req.to_email],
        subject=f"[{settings.APP_NAME}] Test Email",
        html_body=html,
    )
    if success:
        return {"message": "Test email sent successfully"}
    raise HTTPException(status_code=500, detail="Failed to send test email. Check SMTP credentials.")


@router.post("/weekly-report")
async def trigger_weekly_report(
    current_user: User = Depends(deps.require_national_manager),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Manually trigger a weekly report email to all active users."""
    if not _smtp_configured():
        raise HTTPException(status_code=400, detail="SMTP is not configured.")

    success = await send_weekly_report_email(db)
    if success:
        return {"message": "Weekly report email sent successfully"}
    raise HTTPException(status_code=500, detail="Failed to send weekly report email.")
