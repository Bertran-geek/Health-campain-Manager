"""
Pydantic schemas for audit logging.
Handles audit trail queries and responses.
"""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    """Base schema for audit log."""
    action: str
    table_name: str
    record_id: Optional[int] = None
    ancienne_valeur: Optional[dict] = None
    nouvelle_valeur: Optional[dict] = None


class AuditLogCreate(AuditLogBase):
    """Schema for creating an audit log entry."""
    id_user: Optional[int] = None


class AuditLogResponse(AuditLogBase):
    """Schema for audit log response."""
    id: int
    id_user: Optional[int] = None
    created_at: datetime
    username: Optional[str] = None
    
    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Paginated audit log list."""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AuditLogFilter(BaseModel):
    """Filter parameters for audit log queries."""
    table_name: Optional[str] = None
    action: Optional[str] = None
    id_user: Optional[int] = None
    record_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
