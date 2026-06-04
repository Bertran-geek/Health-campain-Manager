"""
Audit log API routes.
Provides read-only access to audit trail for administrators.
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_super_admin
from app.models.models import User, AuditLog
from app.schemas.audit import AuditLogResponse, AuditLogListResponse


router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=AuditLogListResponse, dependencies=[Depends(require_super_admin)])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    table_name: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    record_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> AuditLogListResponse:
    """
    Get paginated audit logs with filters (Super Admin only).
    
    Args:
        page: Page number
        page_size: Items per page
        table_name: Filter by table name
        action: Filter by action (CREATE, UPDATE, DELETE, LOGIN, etc.)
        user_id: Filter by user who performed the action
        record_id: Filter by affected record ID
        date_from: Filter logs after this date
        date_to: Filter logs before this date
    """
    query = db.query(AuditLog)
    
    if table_name:
        query = query.filter(AuditLog.table_name == table_name)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.id_user == user_id)
    if record_id:
        query = query.filter(AuditLog.record_id == record_id)
    if date_from:
        query = query.filter(AuditLog.created_at >= date_from)
    if date_to:
        query = query.filter(AuditLog.created_at <= date_to)
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Build response with username
    items = []
    for log in logs:
        username = None
        if log.id_user:
            user = db.query(User).filter(User.id_user == log.id_user).first()
            if user:
                username = user.username
        
        items.append(AuditLogResponse(
            id=log.id,
            id_user=log.id_user,
            action=log.action,
            table_name=log.table_name,
            record_id=log.record_id,
            ancienne_valeur=log.ancienne_valeur,
            nouvelle_valeur=log.nouvelle_valeur,
            created_at=log.created_at,
            username=username,
        ))
    
    return AuditLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/tables")
def get_audited_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get list of tables that have audit logs."""
    tables = db.query(AuditLog.table_name).distinct().all()
    return {"tables": [t[0] for t in tables]}


@router.get("/actions")
def get_audit_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get list of actions recorded in audit logs."""
    actions = db.query(AuditLog.action).distinct().all()
    return {"actions": [a[0] for a in actions]}
