"""
Email service for sending reports and notifications.
Supports campaign creation alerts and weekly report emails via Gmail SMTP.
"""

import asyncio
import logging
from datetime import datetime, date, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Dict, Any

from aiosmtplib import SMTP
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import User, Campaign, Target

logger = logging.getLogger(__name__)

# Jinja2 environment for HTML email templates
_jinja_env = Environment(
    loader=FileSystemLoader("app/templates/emails"),
    autoescape=select_autoescape(["html"]),
)


def _smtp_configured() -> bool:
    """Check if SMTP is properly configured."""
    return bool(settings.SMTP_USER and settings.SMTP_PASSWORD and settings.SMTP_FROM_EMAIL)


async def _send_email(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> bool:
    """
    Send an email via SMTP.

    Args:
        to_emails: List of recipient email addresses
        subject: Email subject
        html_body: HTML content
        text_body: Plain text content (optional)

    Returns:
        True if email was sent successfully, False otherwise
    """
    if not _smtp_configured():
        logger.warning("SMTP not configured. Skipping email send.")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = ", ".join(to_emails)
    msg["Subject"] = subject

    if text_body:
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        smtp = SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            use_tls=settings.SMTP_USE_TLS,
        )
        await smtp.connect()
        await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        await smtp.send_message(msg)
        await smtp.quit()
        logger.info(f"Email sent successfully to {to_emails}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def _get_user_emails(db: Session) -> List[str]:
    """Get all active user emails that have a Gmail or valid email address."""
    users = db.query(User).filter(User.actif == True, User.email != None, User.email != "").all()
    return [u.email for u in users if u.email]


def _build_campaign_creation_html(campaign: Campaign, creator: User) -> str:
    """Build HTML email body for campaign creation notification."""
    try:
        template = _jinja_env.get_template("campaign_created.html")
        return template.render(
            campaign_name=campaign.nom,
            campaign_code=campaign.code,
            campaign_type=campaign.type_campagne,
            date_debut=campaign.date_debut,
            date_fin=campaign.date_fin,
            age_min=campaign.age_min,
            age_max=campaign.age_max,
            sexe=campaign.sexe,
            total_personne=campaign.total_personne,
            creator_name=f"{creator.nom} {creator.prenom or ''}".strip(),
            app_name=settings.APP_NAME,
        )
    except Exception:
        # Fallback simple HTML if template not found
        return f"""
        <html><body style="font-family:Arial,sans-serif;color:#333;">
        <h2 style="color:#0D1B2E;">Nouvelle Campagne Créée</h2>
        <p>Une nouvelle campagne a été créée dans le système <strong>{settings.APP_NAME}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Nom</td><td style="padding:8px;border:1px solid #ddd;">{campaign.nom}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Code</td><td style="padding:8px;border:1px solid #ddd;">{campaign.code}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Type</td><td style="padding:8px;border:1px solid #ddd;">{campaign.type_campagne}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Début</td><td style="padding:8px;border:1px solid #ddd;">{campaign.date_debut}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Fin</td><td style="padding:8px;border:1px solid #ddd;">{campaign.date_fin}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Créé par</td><td style="padding:8px;border:1px solid #ddd;">{creator.nom} {creator.prenom or ''}</td></tr>
        </table>
        </body></html>
        """


def _build_weekly_report_html(
    summary: Dict[str, Any],
    campaigns_data: List[Dict[str, Any]],
    week_start: date,
    week_end: date,
) -> str:
    """Build HTML email body for weekly report."""
    try:
        template = _jinja_env.get_template("weekly_report.html")
        return template.render(
            summary=summary,
            campaigns=campaigns_data,
            week_start=week_start,
            week_end=week_end,
            app_name=settings.APP_NAME,
        )
    except Exception:
        # Fallback simple HTML
        rows = ""
        for c in campaigns_data:
            rows += f"""
            <tr>
              <td style="padding:8px;border:1px solid #ddd;">{c.get('nom','')}</td>
              <td style="padding:8px;border:1px solid #ddd;">{c.get('type','')}</td>
              <td style="padding:8px;border:1px solid #ddd;">{c.get('total_targets',0)}</td>
              <td style="padding:8px;border:1px solid #ddd;">{c.get('vaccinated',0)}</td>
              <td style="padding:8px;border:1px solid #ddd;">{c.get('beneficiaire',0)}</td>
              <td style="padding:8px;border:1px solid #ddd;">{c.get('coverage','0%')}</td>
            </tr>"""
        return f"""
        <html><body style="font-family:Arial,sans-serif;color:#333;">
        <h2 style="color:#0D1B2E;">Rapport Hebdomadaire</h2>
        <p>Période : <strong>{week_start}</strong> au <strong>{week_end}</strong></p>
        <h3>Résumé Global</h3>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Total Cibles</td><td style="padding:8px;border:1px solid #ddd;">{summary.get('total_targets',0)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Vaccinés</td><td style="padding:8px;border:1px solid #ddd;">{summary.get('vaccinated',0)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Bénéficiaires</td><td style="padding:8px;border:1px solid #ddd;">{summary.get('beneficiaire',0)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Taux de couverture</td><td style="padding:8px;border:1px solid #ddd;">{summary.get('coverage_rate','0%')}</td></tr>
        </table>
        <h3>Détail par Campagne</h3>
        <table style="border-collapse:collapse;width:100%;max-width:700px;">
        <tr style="background:#0D1B2E;color:#fff;">
          <th style="padding:8px;border:1px solid #ddd;">Campagne</th>
          <th style="padding:8px;border:1px solid #ddd;">Type</th>
          <th style="padding:8px;border:1px solid #ddd;">Cibles</th>
          <th style="padding:8px;border:1px solid #ddd;">Vaccinés</th>
          <th style="padding:8px;border:1px solid #ddd;">Bénéficiaires</th>
          <th style="padding:8px;border:1px solid #ddd;">Couverture</th>
        </tr>
        {rows}
        </table>
        </body></html>
        """


async def send_campaign_creation_email(db: Session, campaign: Campaign, creator: User) -> bool:
    """
    Send email notification to all active users when a new campaign is created.

    Args:
        db: Database session
        campaign: The newly created campaign
        creator: The user who created the campaign

    Returns:
        True if email was sent successfully
    """
    emails = _get_user_emails(db)
    if not emails:
        logger.info("No user emails found. Skipping campaign creation email.")
        return False

    html_body = _build_campaign_creation_html(campaign, creator)
    subject = f"[{settings.APP_NAME}] Nouvelle Campagne : {campaign.nom}"

    return await _send_email(
        to_emails=emails,
        subject=subject,
        html_body=html_body,
        text_body=f"Nouvelle campagne créée : {campaign.nom} ({campaign.code}) - Du {campaign.date_debut} au {campaign.date_fin}",
    )


async def send_weekly_report_email(db: Session) -> bool:
    """
    Send weekly report email to all active users with Gmail addresses.

    The report includes:
    - Global summary (total targets, vaccinated, beneficiaries, coverage rate)
    - Per-campaign breakdown

    Args:
        db: Database session

    Returns:
        True if email was sent successfully
    """
    emails = _get_user_emails(db)
    if not emails:
        logger.info("No user emails found. Skipping weekly report email.")
        return False

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # Build global summary
    total_targets = db.query(Target).count()
    vaccinated = db.query(Target).filter(Target.vaccinate == True).count()
    beneficiaire = db.query(Target).filter(Target.beneficiaire == True).count()
    coverage_rate = f"{(vaccinated / total_targets * 100):.1f}%" if total_targets > 0 else "0%"

    summary = {
        "total_targets": total_targets,
        "vaccinated": vaccinated,
        "beneficiaire": beneficiaire,
        "coverage_rate": coverage_rate,
    }

    # Build per-campaign data
    active_campaigns = db.query(Campaign).filter(Campaign.actif == True).all()
    campaigns_data = []
    for c in active_campaigns:
        c_targets = db.query(Target).filter(Target.id_campain == c.id_campaign).count()
        c_vaccinated = db.query(Target).filter(
            Target.id_campain == c.id_campaign, Target.vaccinate == True
        ).count()
        c_beneficiaire = db.query(Target).filter(
            Target.id_campain == c.id_campaign, Target.beneficiaire == True
        ).count()
        c_coverage = f"{(c_vaccinated / c_targets * 100):.1f}%" if c_targets > 0 else "0%"
        campaigns_data.append({
            "nom": c.nom,
            "type": c.type_campagne,
            "total_targets": c_targets,
            "vaccinated": c_vaccinated,
            "beneficiaire": c_beneficiaire,
            "coverage": c_coverage,
        })

    html_body = _build_weekly_report_html(summary, campaigns_data, week_start, week_end)
    subject = f"[{settings.APP_NAME}] Rapport Hebdomadaire - Semaine du {week_start.strftime('%d/%m/%Y')}"

    return await _send_email(
        to_emails=emails,
        subject=subject,
        html_body=html_body,
        text_body=f"Rapport hebdomadaire : {total_targets} cibles, {vaccinated} vaccinés, {beneficiaire} bénéficiaires, couverture {coverage_rate}",
    )


def send_campaign_creation_email_sync(db: Session, campaign: Campaign, creator: User) -> None:
    """Synchronous wrapper for campaign creation email (fire-and-forget)."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(send_campaign_creation_email(db, campaign, creator))
        else:
            loop.run_until_complete(send_campaign_creation_email(db, campaign, creator))
    except RuntimeError:
        asyncio.run(send_campaign_creation_email(db, campaign, creator))


def send_weekly_report_email_sync(db: Session) -> None:
    """Synchronous wrapper for weekly report email."""
    try:
        asyncio.run(send_weekly_report_email(db))
    except Exception as e:
        logger.error(f"Failed to send weekly report: {e}")
