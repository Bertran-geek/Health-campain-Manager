"""
User management API routes.
Handles CRUD operations for users, roles, and scopes.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_user, require_super_admin, require_national_manager
from app.core.security import get_password_hash
from app.models.models import User, Role, UserRole, UserScope
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    UserScopeCreate,
    UserScopeResponse,
)
from app.services.audit_service import create_audit_log


router = APIRouter(prefix="/users", tags=["Users"])


# ============== Role Endpoints ==============

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[RoleResponse]:
    """Get all available roles."""
    roles = db.query(Role).all()
    return roles


@router.post("/roles", response_model=RoleResponse, dependencies=[Depends(require_super_admin)])
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoleResponse:
    """Create a new role (Super Admin only)."""
    # Check if role code already exists
    existing = db.query(Role).filter(Role.code == role_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role code already exists",
        )
    
    role = Role(**role_data.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="role",
        record_id=role.id_role,
        new_value=role_data.model_dump(),
    )
    
    return role


# ============== User Endpoints ==============

@router.get("", response_model=UserListResponse)
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    actif: Optional[bool] = None,
    role_id: Optional[int] = None,
) -> UserListResponse:
    """
    Get paginated list of users with optional filters.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        search: Search term for username, nom, prenom, email
        actif: Filter by active status
        role_id: Filter by role ID
    """
    query = db.query(User)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.nom.ilike(search_term),
                User.prenom.ilike(search_term),
                User.email.ilike(search_term),
            )
        )
    
    # Apply active filter
    if actif is not None:
        query = query.filter(User.actif == actif)
    
    # Apply role filter
    if role_id:
        query = query.join(UserRole).filter(UserRole.id_role == role_id)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated results
    users = query.offset(offset).limit(page_size).all()
    
    # Build response with roles and scopes
    items = []
    for user in users:
        user_roles = (
            db.query(Role)
            .join(UserRole)
            .filter(UserRole.id_user == user.id_user)
            .all()
        )
        user_scopes = (
            db.query(UserScope)
            .filter(UserScope.id_user == user.id_user)
            .all()
        )
        
        user_response = UserResponse(
            id_user=user.id_user,
            username=user.username,
            nom=user.nom,
            prenom=user.prenom,
            telephone=user.telephone,
            email=user.email,
            actif=user.actif,
            derniere_connexion=user.derniere_connexion,
            created_at=user.created_at,
            updated_at=user.updated_at,
            roles=[RoleResponse.model_validate(r) for r in user_roles],
            scopes=[UserScopeResponse.model_validate(s) for s in user_scopes],
        )
        items.append(user_response)
    
    return UserListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get a specific user by ID."""
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Get roles and scopes
    user_roles = (
        db.query(Role)
        .join(UserRole)
        .filter(UserRole.id_user == user.id_user)
        .all()
    )
    user_scopes = (
        db.query(UserScope)
        .filter(UserScope.id_user == user.id_user)
        .all()
    )
    
    return UserResponse(
        id_user=user.id_user,
        username=user.username,
        nom=user.nom,
        prenom=user.prenom,
        telephone=user.telephone,
        email=user.email,
        actif=user.actif,
        derniere_connexion=user.derniere_connexion,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[RoleResponse.model_validate(r) for r in user_roles],
        scopes=[UserScopeResponse.model_validate(s) for s in user_scopes],
    )


@router.post("", response_model=UserResponse, dependencies=[Depends(require_national_manager)])
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Create a new user (National Manager or higher)."""
    # Check if username already exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    
    # Create user
    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        nom=user_data.nom,
        prenom=user_data.prenom,
        telephone=user_data.telephone,
        email=user_data.email,
        actif=user_data.actif,
    )
    db.add(user)
    db.flush()
    
    # Add roles
    for role_id in user_data.role_ids:
        role = db.query(Role).filter(Role.id_role == role_id).first()
        if role:
            user_role = UserRole(id_user=user.id_user, id_role=role_id)
            db.add(user_role)
    
    # Add scopes
    for scope_data in user_data.scopes:
        scope = UserScope(
            id_user=user.id_user,
            niveau=scope_data.niveau,
            id_region=scope_data.id_region,
            id_dpt=scope_data.id_dpt,
            id_phc=scope_data.id_phc,
            id_chw=scope_data.id_chw,
            actif=scope_data.actif,
        )
        db.add(scope)
    
    db.commit()
    db.refresh(user)
    
    # Log creation
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="user",
        record_id=user.id_user,
        new_value={"username": user.username, "nom": user.nom},
    )
    
    return get_user(user.id_user, db, current_user)


@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_national_manager)])
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Update a user (National Manager or higher)."""
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Store old values for audit
    old_values = {
        "nom": user.nom,
        "prenom": user.prenom,
        "actif": user.actif,
    }
    
    # Update basic fields
    if user_data.nom is not None:
        user.nom = user_data.nom
    if user_data.prenom is not None:
        user.prenom = user_data.prenom
    if user_data.telephone is not None:
        user.telephone = user_data.telephone
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.actif is not None:
        user.actif = user_data.actif
    if user_data.password:
        user.password_hash = get_password_hash(user_data.password)
    
    user.updated_at = datetime.now(timezone.utc)
    
    # Update roles if provided
    if user_data.role_ids is not None:
        # Remove existing roles
        db.query(UserRole).filter(UserRole.id_user == user_id).delete()
        # Add new roles
        for role_id in user_data.role_ids:
            user_role = UserRole(id_user=user_id, id_role=role_id)
            db.add(user_role)
    
    # Update scopes if provided
    if user_data.scopes is not None:
        # Remove existing scopes
        db.query(UserScope).filter(UserScope.id_user == user_id).delete()
        # Add new scopes
        for scope_data in user_data.scopes:
            scope = UserScope(
                id_user=user_id,
                niveau=scope_data.niveau,
                id_region=scope_data.id_region,
                id_dpt=scope_data.id_dpt,
                id_phc=scope_data.id_phc,
                id_chw=scope_data.id_chw,
                actif=scope_data.actif,
            )
            db.add(scope)
    
    db.commit()
    
    # Log update
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="UPDATE",
        table_name="user",
        record_id=user_id,
        old_value=old_values,
        new_value={"nom": user.nom, "prenom": user.prenom, "actif": user.actif},
    )
    
    return get_user(user_id, db, current_user)


@router.delete("/{user_id}", dependencies=[Depends(require_super_admin)])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a user (Super Admin only)."""
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent self-deletion
    if user.id_user == current_user.id_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    
    # Store for audit
    old_values = {"username": user.username, "nom": user.nom}
    
    # Explicitly delete scopes (no DB-level CASCADE on user_scope FK)
    db.query(UserScope).filter(UserScope.id_user == user_id).delete()
    # Delete user (cascades to user_role via DB CASCADE)
    db.delete(user)
    db.commit()
    
    # Log deletion
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="DELETE",
        table_name="user",
        record_id=user_id,
        old_value=old_values,
    )
    
    return {"message": "User deleted successfully"}
