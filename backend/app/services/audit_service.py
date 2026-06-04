"""
Audit logging service.
Provides centralized audit trail functionality for all data modifications.
"""

from typing import Optional, Any
from sqlalchemy.orm import Session

from app.models.models import AuditLog


def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    table_name: str,
    record_id: Optional[int] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
) -> AuditLog:
    """
    Create an audit log entry for tracking data modifications.
    
    Args:
        db: Database session
        user_id: ID of the user performing the action (None for system actions)
        action: Type of action (CREATE, UPDATE, DELETE, LOGIN, etc.)
        table_name: Name of the affected table
        record_id: ID of the affected record
        old_value: Previous values before modification (for UPDATE/DELETE)
        new_value: New values after modification (for CREATE/UPDATE)
        
    Returns:
        Created AuditLog instance
    """
    audit_log = AuditLog(
        id_user=user_id,
        action=action,
        table_name=table_name,
        record_id=record_id,
        ancienne_valeur=old_value,
        nouvelle_valeur=new_value,
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    return audit_log


def log_create(
    db: Session,
    user_id: int,
    table_name: str,
    record_id: int,
    data: dict,
) -> AuditLog:
    """
    Log a CREATE action.
    
    Args:
        db: Database session
        user_id: ID of the user creating the record
        table_name: Name of the table
        record_id: ID of the created record
        data: Data of the created record
        
    Returns:
        Created AuditLog instance
    """
    return create_audit_log(
        db=db,
        user_id=user_id,
        action="CREATE",
        table_name=table_name,
        record_id=record_id,
        new_value=data,
    )


def log_update(
    db: Session,
    user_id: int,
    table_name: str,
    record_id: int,
    old_data: dict,
    new_data: dict,
) -> AuditLog:
    """
    Log an UPDATE action.
    
    Args:
        db: Database session
        user_id: ID of the user updating the record
        table_name: Name of the table
        record_id: ID of the updated record
        old_data: Previous values
        new_data: New values
        
    Returns:
        Created AuditLog instance
    """
    return create_audit_log(
        db=db,
        user_id=user_id,
        action="UPDATE",
        table_name=table_name,
        record_id=record_id,
        old_value=old_data,
        new_value=new_data,
    )


def log_delete(
    db: Session,
    user_id: int,
    table_name: str,
    record_id: int,
    data: dict,
) -> AuditLog:
    """
    Log a DELETE action.
    
    Args:
        db: Database session
        user_id: ID of the user deleting the record
        table_name: Name of the table
        record_id: ID of the deleted record
        data: Data of the deleted record
        
    Returns:
        Created AuditLog instance
    """
    return create_audit_log(
        db=db,
        user_id=user_id,
        action="DELETE",
        table_name=table_name,
        record_id=record_id,
        old_value=data,
    )
