from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import Target, User
from app.schemas.target import TargetCreate, TargetUpdate, TargetResponse, TargetList

router = APIRouter(prefix="/targets", tags=["targets"])

@router.get("", response_model=TargetList)
def get_targets(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    campaign_id: int = None,
    chw_id: int = None
) -> Any:
    """
    Retrieve targets.
    """
    query = db.query(Target)
    
    if campaign_id:
        query = query.filter(Target.id_campain == campaign_id)
    if chw_id:
        query = query.filter(Target.chw_id == chw_id)
        
    total = query.count()
    targets = query.offset(skip).limit(limit).all()
    
    return {"total": total, "items": targets}

@router.post("", response_model=TargetResponse)
def create_target(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    target_in: TargetCreate
) -> Any:
    """
    Create new target.
    """
    target = Target(**target_in.model_dump())
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.put("/{target_id}", response_model=TargetResponse)
def update_target(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    target_id: int,
    target_in: TargetUpdate
) -> Any:
    """
    Update a target.
    """
    target = db.query(Target).filter(Target.id_target == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
        
    update_data = target_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(target, field, value)
        
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.delete("/{target_id}")
def delete_target(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    target_id: int
) -> Any:
    """
    Delete a target.
    """
    target = db.query(Target).filter(Target.id_target == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
        
    db.delete(target)
    db.commit()
    return {"success": True, "message": "Target deleted successfully"}
