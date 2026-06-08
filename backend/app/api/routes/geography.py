"""
Geographic entities API routes.
Handles CRUD operations for regions, departments, PHCs, and CHWs.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import (
    get_db,
    get_current_user,
    require_national_manager,
    require_region_manager,
    require_dpt_manager,
    require_phc_manager,
)
from app.models.models import User, Region, Departement, PHC, CHW, UserScope
from app.schemas.geography import (
    RegionCreate,
    RegionUpdate,
    RegionResponse,
    RegionListResponse,
    RegionWithStats,
    DepartementCreate,
    DepartementUpdate,
    DepartementResponse,
    DepartementListResponse,
    PHCCreate,
    PHCUpdate,
    PHCResponse,
    PHCListResponse,
    CHWCreate,
    CHWUpdate,
    CHWResponse,
    CHWListResponse,
)
from app.services.audit_service import create_audit_log


router = APIRouter(tags=["Geography"])


# ============== Region Endpoints ==============

@router.get("/regions", response_model=RegionListResponse)
def get_regions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
) -> RegionListResponse:
    """Get paginated list of regions."""
    query = db.query(Region)
    
    if search:
        query = query.filter(Region.nom_region.ilike(f"%{search}%"))
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    regions = query.offset(offset).limit(page_size).all()
    
    return RegionListResponse(
        items=[RegionResponse.model_validate(r) for r in regions],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/regions/{region_id}", response_model=RegionWithStats)
def get_region(
    region_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegionWithStats:
    """Get a specific region with statistics."""
    region = db.query(Region).filter(Region.id_region == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    # Get statistics
    dpt_count = db.query(Departement).filter(Departement.id_region == region_id).count()
    phc_count = (
        db.query(PHC)
        .join(Departement)
        .filter(Departement.id_region == region_id)
        .count()
    )
    chw_count = (
        db.query(CHW)
        .join(PHC)
        .join(Departement)
        .filter(Departement.id_region == region_id)
        .count()
    )
    
    return RegionWithStats(
        id_region=region.id_region,
        code=region.code,
        nom_region=region.nom_region,
        created_at=region.created_at,
        departement_count=dpt_count,
        phc_count=phc_count,
        chw_count=chw_count,
    )


@router.post("/regions", response_model=RegionResponse, dependencies=[Depends(require_national_manager)])
def create_region(
    region_data: RegionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegionResponse:
    """Create a new region (National Manager or higher)."""
    # Check for duplicate code
    if region_data.code:
        existing = db.query(Region).filter(Region.code == region_data.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Region code already exists")
    
    region = Region(**region_data.model_dump())
    db.add(region)
    db.commit()
    db.refresh(region)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="region",
        record_id=region.id_region,
        new_value=region_data.model_dump(),
    )
    
    return RegionResponse.model_validate(region)


@router.put("/regions/{region_id}", response_model=RegionResponse, dependencies=[Depends(require_national_manager)])
def update_region(
    region_id: int,
    region_data: RegionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegionResponse:
    """Update a region (National Manager or higher)."""
    region = db.query(Region).filter(Region.id_region == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    old_values = {"code": region.code, "nom_region": region.nom_region}
    
    update_data = region_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(region, field, value)
    
    db.commit()
    db.refresh(region)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="UPDATE",
        table_name="region",
        record_id=region_id,
        old_value=old_values,
        new_value=update_data,
    )
    
    return RegionResponse.model_validate(region)


@router.delete("/regions/{region_id}", dependencies=[Depends(require_national_manager)])
def delete_region(
    region_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a region (National Manager or higher)."""
    region = db.query(Region).filter(Region.id_region == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    # Check for child departments
    dpt_count = db.query(Departement).filter(Departement.id_region == region_id).count()
    if dpt_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete region with {dpt_count} department(s). Remove them first.",
        )
    
    # Check for user scopes pointing to this region
    scope_count = db.query(UserScope).filter(UserScope.id_region == region_id).count()
    if scope_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{scope_count} user(s) have this region in their scope. Reassign them first.",
        )
    
    old_values = {"code": region.code, "nom_region": region.nom_region}
    
    db.delete(region)
    db.commit()
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="DELETE",
        table_name="region",
        record_id=region_id,
        old_value=old_values,
    )
    
    return {"message": "Region deleted successfully"}


# ============== Departement Endpoints ==============

@router.get("/departements", response_model=DepartementListResponse)
def get_departements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    region_id: Optional[int] = None,
) -> DepartementListResponse:
    """Get paginated list of departments."""
    query = db.query(Departement)
    
    if search:
        query = query.filter(Departement.nom_dpt.ilike(f"%{search}%"))
    if region_id:
        query = query.filter(Departement.id_region == region_id)
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    departements = query.offset(offset).limit(page_size).all()
    
    return DepartementListResponse(
        items=[DepartementResponse.model_validate(d) for d in departements],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/departements/{dpt_id}", response_model=DepartementResponse)
def get_departement(
    dpt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DepartementResponse:
    """Get a specific department."""
    dpt = db.query(Departement).filter(Departement.id_dpt == dpt_id).first()
    if not dpt:
        raise HTTPException(status_code=404, detail="Department not found")
    return DepartementResponse.model_validate(dpt)


@router.post("/departements", response_model=DepartementResponse, dependencies=[Depends(require_region_manager)])
def create_departement(
    dpt_data: DepartementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DepartementResponse:
    """Create a new department (Region Manager or higher)."""
    # Verify region exists
    region = db.query(Region).filter(Region.id_region == dpt_data.id_region).first()
    if not region:
        raise HTTPException(status_code=400, detail="Region not found")
    
    dpt = Departement(**dpt_data.model_dump())
    db.add(dpt)
    db.commit()
    db.refresh(dpt)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="departement",
        record_id=dpt.id_dpt,
        new_value=dpt_data.model_dump(),
    )
    
    return DepartementResponse.model_validate(dpt)


@router.put("/departements/{dpt_id}", response_model=DepartementResponse, dependencies=[Depends(require_region_manager)])
def update_departement(
    dpt_id: int,
    dpt_data: DepartementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DepartementResponse:
    """Update a department (Region Manager or higher)."""
    dpt = db.query(Departement).filter(Departement.id_dpt == dpt_id).first()
    if not dpt:
        raise HTTPException(status_code=404, detail="Department not found")
    
    old_values = {"nom_dpt": dpt.nom_dpt, "code": dpt.code}
    
    update_data = dpt_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dpt, field, value)
    
    db.commit()
    db.refresh(dpt)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="UPDATE",
        table_name="departement",
        record_id=dpt_id,
        old_value=old_values,
        new_value=update_data,
    )
    
    return DepartementResponse.model_validate(dpt)


@router.delete("/departements/{dpt_id}", dependencies=[Depends(require_region_manager)])
def delete_departement(
    dpt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a department (Region Manager or higher)."""
    dpt = db.query(Departement).filter(Departement.id_dpt == dpt_id).first()
    if not dpt:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check for child PHCs
    phc_count = db.query(PHC).filter(PHC.id_dpt == dpt_id).count()
    if phc_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department with {phc_count} PHC(s). Remove them first.",
        )
    
    # Check for user scopes pointing to this department
    scope_count = db.query(UserScope).filter(UserScope.id_dpt == dpt_id).count()
    if scope_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{scope_count} user(s) have this department in their scope. Reassign them first.",
        )
    
    old_values = {"nom_dpt": dpt.nom_dpt, "code": dpt.code}
    db.delete(dpt)
    db.commit()
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="DELETE",
        table_name="departement",
        record_id=dpt_id,
        old_value=old_values,
    )
    
    return {"message": "Department deleted successfully"}


# ============== PHC Endpoints ==============

@router.get("/phcs", response_model=PHCListResponse)
def get_phcs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    dpt_id: Optional[int] = None,
    region_id: Optional[int] = None,
) -> PHCListResponse:
    """Get paginated list of PHCs."""
    query = db.query(PHC)
    
    if search:
        query = query.filter(PHC.nom_phc.ilike(f"%{search}%"))
    if dpt_id:
        query = query.filter(PHC.id_dpt == dpt_id)
    if region_id:
        query = query.join(Departement).filter(Departement.id_region == region_id)
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    phcs = query.offset(offset).limit(page_size).all()
    
    return PHCListResponse(
        items=[PHCResponse.model_validate(p) for p in phcs],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/phcs/{phc_id}", response_model=PHCResponse)
def get_phc(
    phc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PHCResponse:
    """Get a specific PHC."""
    phc = db.query(PHC).filter(PHC.id_phc == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found")
    return PHCResponse.model_validate(phc)


@router.post("/phcs", response_model=PHCResponse, dependencies=[Depends(require_dpt_manager)])
def create_phc(
    phc_data: PHCCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PHCResponse:
    """Create a new PHC (Department Manager or higher)."""
    # Verify department exists
    dpt = db.query(Departement).filter(Departement.id_dpt == phc_data.id_dpt).first()
    if not dpt:
        raise HTTPException(status_code=400, detail="Department not found")
    
    phc = PHC(**phc_data.model_dump())
    db.add(phc)
    db.commit()
    db.refresh(phc)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="phc",
        record_id=phc.id_phc,
        new_value=phc_data.model_dump(),
    )
    
    return PHCResponse.model_validate(phc)


@router.put("/phcs/{phc_id}", response_model=PHCResponse, dependencies=[Depends(require_dpt_manager)])
def update_phc(
    phc_id: int,
    phc_data: PHCUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PHCResponse:
    """Update a PHC (Department Manager or higher)."""
    phc = db.query(PHC).filter(PHC.id_phc == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found")
    
    update_data = phc_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(phc, field, value)
    
    db.commit()
    db.refresh(phc)
    
    return PHCResponse.model_validate(phc)


@router.delete("/phcs/{phc_id}", dependencies=[Depends(require_dpt_manager)])
def delete_phc(
    phc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a PHC (Department Manager or higher)."""
    phc = db.query(PHC).filter(PHC.id_phc == phc_id).first()
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found")
    
    # Check for child CHWs
    chw_count = db.query(CHW).filter(CHW.id_phc == phc_id).count()
    if chw_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete PHC with {chw_count} CHW(s). Remove them first.",
        )
    
    # Check for user scopes pointing to this PHC
    scope_count = db.query(UserScope).filter(UserScope.id_phc == phc_id).count()
    if scope_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{scope_count} user(s) have this PHC in their scope. Reassign them first.",
        )
    
    old_values = {"nom_phc": phc.nom_phc, "code": phc.code}
    db.delete(phc)
    db.commit()
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="DELETE",
        table_name="phc",
        record_id=phc_id,
        old_value=old_values,
    )
    
    return {"message": "PHC deleted successfully"}


# ============== CHW Endpoints ==============

@router.get("/chws", response_model=CHWListResponse)
def get_chws(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    phc_id: Optional[int] = None,
    actif: Optional[bool] = None,
) -> CHWListResponse:
    """Get paginated list of CHWs."""
    query = db.query(CHW)
    
    if search:
        query = query.filter(
            (CHW.nom.ilike(f"%{search}%")) | (CHW.prenom.ilike(f"%{search}%"))
        )
    if phc_id:
        query = query.filter(CHW.id_phc == phc_id)
    if actif is not None:
        query = query.filter(CHW.actif == actif)
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    chws = query.offset(offset).limit(page_size).all()
    
    return CHWListResponse(
        items=[CHWResponse.model_validate(c) for c in chws],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/chws/{chw_id}", response_model=CHWResponse)
def get_chw(
    chw_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CHWResponse:
    """Get a specific CHW."""
    chw = db.query(CHW).filter(CHW.id_chw == chw_id).first()
    if not chw:
        raise HTTPException(status_code=404, detail="CHW not found")
    return CHWResponse.model_validate(chw)


@router.post("/chws", response_model=CHWResponse, dependencies=[Depends(require_phc_manager)])
def create_chw(
    chw_data: CHWCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CHWResponse:
    """Create a new CHW (PHC Manager or higher)."""
    # Verify PHC exists
    phc = db.query(PHC).filter(PHC.id_phc == chw_data.id_phc).first()
    if not phc:
        raise HTTPException(status_code=400, detail="PHC not found")
    
    chw = CHW(**chw_data.model_dump())
    db.add(chw)
    db.commit()
    db.refresh(chw)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="chw",
        record_id=chw.id_chw,
        new_value=chw_data.model_dump(),
    )
    
    return CHWResponse.model_validate(chw)


@router.put("/chws/{chw_id}", response_model=CHWResponse, dependencies=[Depends(require_phc_manager)])
def update_chw(
    chw_id: int,
    chw_data: CHWUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CHWResponse:
    """Update a CHW (PHC Manager or higher)."""
    chw = db.query(CHW).filter(CHW.id_chw == chw_id).first()
    if not chw:
        raise HTTPException(status_code=404, detail="CHW not found")
    
    update_data = chw_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chw, field, value)
    
    db.commit()
    db.refresh(chw)
    
    return CHWResponse.model_validate(chw)


@router.delete("/chws/{chw_id}", dependencies=[Depends(require_phc_manager)])
def delete_chw(
    chw_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a CHW (PHC Manager or higher)."""
    chw = db.query(CHW).filter(CHW.id_chw == chw_id).first()
    if not chw:
        raise HTTPException(status_code=404, detail="CHW not found")
    
    # Check for user scopes pointing to this CHW
    scope_count = db.query(UserScope).filter(UserScope.id_chw == chw_id).count()
    if scope_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{scope_count} user(s) have this CHW in their scope. Reassign them first.",
        )
    
    old_values = {"nom": chw.nom, "code": chw.code}
    db.delete(chw)
    db.commit()
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="DELETE",
        table_name="chw",
        record_id=chw_id,
        old_value=old_values,
    )
    
    return {"message": "CHW deleted successfully"}
