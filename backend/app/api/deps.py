"""
API dependencies for FastAPI.
Provides authentication, authorization, and database session injection.
"""

from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import SessionLocal
from app.core.security import decode_token, verify_token_type
from app.models.models import User, UserRole, Role


# OAuth2 scheme for JWT token extraction from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency.
    Creates a new session for each request and closes it after.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        db: Database session
        token: JWT access token from Authorization header
        
    Returns:
        User object for the authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_token(token)
        
        # Verify this is an access token
        if not verify_token_type(payload, "access"):
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id_user == int(user_id)).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Verify the current user is active.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        Active user object
        
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


def get_user_roles(user: User, db: Session) -> List[str]:
    """
    Get list of role codes for a user.
    
    Args:
        user: User object
        db: Database session
        
    Returns:
        List of role code strings
    """
    user_roles = (
        db.query(Role.code)
        .join(UserRole, UserRole.id_role == Role.id_role)
        .filter(UserRole.id_user == user.id_user)
        .all()
    )
    return [role.code for role in user_roles]


class RoleChecker:
    """
    Dependency class for role-based access control.
    
    Usage:
        @app.get("/admin", dependencies=[Depends(RoleChecker(["SUPER_ADMIN"]))])
        def admin_only():
            return {"message": "Admin access granted"}
    """
    
    def __init__(self, allowed_roles: List[str]):
        """
        Initialize with list of allowed role codes.
        
        Args:
            allowed_roles: List of role codes that are allowed access
        """
        self.allowed_roles = allowed_roles
    
    def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> bool:
        """
        Check if current user has any of the allowed roles.
        
        Args:
            current_user: Authenticated user
            db: Database session
            
        Returns:
            True if user has required role
            
        Raises:
            HTTPException: If user lacks required role
        """
        user_roles = get_user_roles(current_user, db)
        
        # Super admin has access to everything
        if "SUPER_ADMIN" in user_roles:
            return True
        
        for role in user_roles:
            if role in self.allowed_roles:
                return True
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


# Pre-configured role checkers for common use cases
require_super_admin = RoleChecker(["SUPER_ADMIN"])
require_national_manager = RoleChecker(["SUPER_ADMIN", "NATIONAL_MANAGER"])
require_region_manager = RoleChecker(["SUPER_ADMIN", "NATIONAL_MANAGER", "REGION_MANAGER"])
require_dpt_manager = RoleChecker(["SUPER_ADMIN", "NATIONAL_MANAGER", "REGION_MANAGER", "DPT_MANAGER"])
require_phc_manager = RoleChecker(["SUPER_ADMIN", "NATIONAL_MANAGER", "REGION_MANAGER", "DPT_MANAGER", "PHC_MANAGER"])
