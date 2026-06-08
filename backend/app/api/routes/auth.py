"""
Authentication API routes.
Handles login, logout, token refresh, and password management.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_user_roles
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.models.models import User, UserRole, Role, UserScope
from app.schemas.auth import (
    Token,
    LoginRequest,
    RefreshTokenRequest,
    UserSession,
    PasswordChangeRequest,
)
from app.services.audit_service import create_audit_log


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    """
    Authenticate user and return JWT tokens.
    
    Args:
        form_data: OAuth2 form with username and password
        db: Database session
        
    Returns:
        Access and refresh tokens
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by username or email
    from sqlalchemy import or_
    user = db.query(User).filter(
        or_(User.username == form_data.username, User.email == form_data.username)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password (plain text, no hashing)
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    
    # Update last login timestamp
    user.derniere_connexion = datetime.now(timezone.utc)
    db.commit()
    
    # Get user roles for token claims
    roles = get_user_roles(user, db)
    
    # Create tokens with role claims
    access_token = create_access_token(
        subject=user.id_user,
        additional_claims={"roles": roles},
    )
    refresh_token = create_refresh_token(subject=user.id_user)
    
    # Log the login action
    create_audit_log(
        db=db,
        user_id=user.id_user,
        action="LOGIN",
        table_name="user",
        record_id=user.id_user,
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=Token)
def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> Token:
    """
    Refresh access token using refresh token.
    
    Args:
        request: Refresh token request
        db: Database session
        
    Returns:
        New access and refresh tokens
        
    Raises:
        HTTPException: If refresh token is invalid
    """
    try:
        payload = decode_token(request.refresh_token)
        
        # Verify this is a refresh token
        if not verify_token_type(payload, "refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        # Get user and verify still active
        user = db.query(User).filter(User.id_user == int(user_id)).first()
        if not user or not user.actif:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )
        
        # Get user roles
        roles = get_user_roles(user, db)
        
        # Create new tokens
        access_token = create_access_token(
            subject=user.id_user,
            additional_claims={"roles": roles},
        )
        new_refresh_token = create_refresh_token(subject=user.id_user)
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )
        
    except (JWTError, HTTPException):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


@router.get("/me", response_model=UserSession)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserSession:
    """
    Get current authenticated user information.
    
    Args:
        current_user: Authenticated user
        db: Database session
        
    Returns:
        User session information including roles and scopes
    """
    # Get user roles
    roles = get_user_roles(current_user, db)
    
    # Get user scopes
    scopes = (
        db.query(UserScope)
        .filter(UserScope.id_user == current_user.id_user, UserScope.actif == True)
        .all()
    )
    
    scope_data = [
        {
            "niveau": scope.niveau,
            "id_region": scope.id_region,
            "id_dpt": scope.id_dpt,
            "id_phc": scope.id_phc,
            "id_chw": scope.id_chw,
        }
        for scope in scopes
    ]
    
    return UserSession(
        id_user=current_user.id_user,
        username=current_user.username,
        nom=current_user.nom,
        prenom=current_user.prenom,
        email=current_user.email,
        roles=roles,
        scopes=scope_data,
    )


@router.post("/change-password")
def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Change current user's password.
    
    Args:
        request: Password change request
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If current password is wrong or passwords don't match
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    # Verify new passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match",
        )
    
    # Update password
    old_hash = current_user.password_hash
    current_user.password_hash = get_password_hash(request.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    # Log the password change
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="PASSWORD_CHANGE",
        table_name="user",
        record_id=current_user.id_user,
    )
    
    return {"message": "Password changed successfully"}
