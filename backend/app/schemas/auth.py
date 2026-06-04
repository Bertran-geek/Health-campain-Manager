"""
Pydantic schemas for authentication endpoints.
Handles login, token refresh, and user session data.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: str
    exp: int
    iat: int
    type: str


class LoginRequest(BaseModel):
    """User login request schema."""
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)


class RefreshTokenRequest(BaseModel):
    """Token refresh request schema."""
    refresh_token: str


class UserSession(BaseModel):
    """Current user session information."""
    id_user: int
    username: str
    nom: str
    prenom: Optional[str] = None
    email: Optional[str] = None
    roles: List[str] = []
    scopes: List[dict] = []
    
    class Config:
        from_attributes = True


class PasswordChangeRequest(BaseModel):
    """Password change request schema."""
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)
