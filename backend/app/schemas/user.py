"""
Pydantic schemas for user management.
Handles CRUD operations for users, roles, and scopes.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ============== Role Schemas ==============

class RoleBase(BaseModel):
    """Base schema for role data."""
    code: str = Field(..., min_length=2, max_length=50)
    nom: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Schema for creating a new role."""
    pass


class RoleUpdate(BaseModel):
    """Schema for updating a role."""
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class RoleResponse(RoleBase):
    """Schema for role response."""
    id_role: int
    
    class Config:
        from_attributes = True


# ============== User Scope Schemas ==============

class UserScopeBase(BaseModel):
    """Base schema for user scope."""
    niveau: str = Field(..., pattern="^(NATIONAL|REGION|DEPARTEMENT|PHC|CHW)$")
    id_region: Optional[int] = None
    id_dpt: Optional[int] = None
    id_phc: Optional[int] = None
    id_chw: Optional[int] = None
    actif: bool = True


class UserScopeCreate(UserScopeBase):
    """Schema for creating a user scope."""
    pass


class UserScopeResponse(UserScopeBase):
    """Schema for user scope response."""
    id: int
    id_user: int
    
    class Config:
        from_attributes = True


# ============== User Schemas ==============

class UserBase(BaseModel):
    """Base schema for user data."""
    username: str = Field(..., min_length=3, max_length=100)
    nom: str = Field(..., min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    actif: bool = True


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100)
    role_ids: List[int] = Field(default_factory=list)
    scopes: List[UserScopeCreate] = Field(default_factory=list)


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    actif: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    role_ids: Optional[List[int]] = None
    scopes: Optional[List[UserScopeCreate]] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id_user: int
    derniere_connexion: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    roles: List[RoleResponse] = []
    scopes: List[UserScopeResponse] = []
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int
