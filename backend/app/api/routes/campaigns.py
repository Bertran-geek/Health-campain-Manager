"""
Campaign management API routes.
Handles CRUD operations for campaigns, molecules, and campaign zones.
"""

from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import (
    get_db,
    get_current_user,
    require_national_manager,
    require_region_manager,
)
from app.models.models import (
    User,
    Campaign,
    CampaignZone,
    CampaignMolecule,
    Molecule,
)
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignListResponse,
    CampaignStats,
    CampaignZoneResponse,
    MoleculeCreate,
    MoleculeUpdate,
    MoleculeResponse,
)
from app.services.audit_service import create_audit_log
from app.services.email_service import send_campaign_creation_email_sync


router = APIRouter(tags=["Campaigns"])


# ============== Molecule Endpoints ==============

@router.get("/molecules", response_model=List[MoleculeResponse])
def get_molecules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = None,
) -> List[MoleculeResponse]:
    """Get all molecules/vaccines."""
    query = db.query(Molecule)
    
    if search:
        query = query.filter(
            or_(
                Molecule.nom.ilike(f"%{search}%"),
                Molecule.code.ilike(f"%{search}%"),
            )
        )
    
    molecules = query.all()
    return [MoleculeResponse.model_validate(m) for m in molecules]


@router.get("/molecules/{molecule_id}", response_model=MoleculeResponse)
def get_molecule(
    molecule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MoleculeResponse:
    """Get a specific molecule."""
    molecule = db.query(Molecule).filter(Molecule.id_molecule == molecule_id).first()
    if not molecule:
        raise HTTPException(status_code=404, detail="Molecule not found")
    return MoleculeResponse.model_validate(molecule)


@router.post("/molecules", response_model=MoleculeResponse, dependencies=[Depends(require_national_manager)])
def create_molecule(
    molecule_data: MoleculeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MoleculeResponse:
    """Create a new molecule (National Manager or higher)."""
    # Check for duplicate code
    if molecule_data.code:
        existing = db.query(Molecule).filter(Molecule.code == molecule_data.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Molecule code already exists")
    
    molecule = Molecule(**molecule_data.model_dump())
    db.add(molecule)
    db.commit()
    db.refresh(molecule)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="molecule",
        record_id=molecule.id_molecule,
        new_value=molecule_data.model_dump(),
    )
    
    return MoleculeResponse.model_validate(molecule)


@router.put("/molecules/{molecule_id}", response_model=MoleculeResponse, dependencies=[Depends(require_national_manager)])
def update_molecule(
    molecule_id: int,
    molecule_data: MoleculeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MoleculeResponse:
    """Update a molecule (National Manager or higher)."""
    molecule = db.query(Molecule).filter(Molecule.id_molecule == molecule_id).first()
    if not molecule:
        raise HTTPException(status_code=404, detail="Molecule not found")
    
    update_data = molecule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(molecule, field, value)
    
    db.commit()
    db.refresh(molecule)
    
    return MoleculeResponse.model_validate(molecule)


@router.delete("/molecules/{molecule_id}", dependencies=[Depends(require_national_manager)])
def delete_molecule(
    molecule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a molecule (National Manager or higher)."""
    molecule = db.query(Molecule).filter(Molecule.id_molecule == molecule_id).first()
    if not molecule:
        raise HTTPException(status_code=404, detail="Molecule not found")
    
    # Check if used in campaigns
    usage_count = db.query(CampaignMolecule).filter(
        CampaignMolecule.id_molecule == molecule_id
    ).count()
    if usage_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete molecule used in {usage_count} campaigns",
        )
    
    db.delete(molecule)
    db.commit()
    
    return {"message": "Molecule deleted successfully"}


# ============== Campaign Endpoints ==============

@router.get("/campaigns", response_model=CampaignListResponse)
def get_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    type_campagne: Optional[str] = None,
    actif: Optional[bool] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> CampaignListResponse:
    """Get paginated list of campaigns with filters."""
    query = db.query(Campaign)
    
    if search:
        query = query.filter(
            or_(
                Campaign.nom.ilike(f"%{search}%"),
                Campaign.code.ilike(f"%{search}%"),
            )
        )
    if type_campagne:
        query = query.filter(Campaign.type_campagne == type_campagne)
    if actif is not None:
        query = query.filter(Campaign.actif == actif)
    if date_from:
        query = query.filter(Campaign.date_debut >= date_from)
    if date_to:
        query = query.filter(Campaign.date_fin <= date_to)
    
    total = query.count()
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    campaigns = query.order_by(Campaign.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Build response with molecules and zones
    items = []
    for campaign in campaigns:
        molecules = (
            db.query(Molecule)
            .join(CampaignMolecule)
            .filter(CampaignMolecule.id_campaign == campaign.id_campaign)
            .all()
        )
        zones = (
            db.query(CampaignZone)
            .filter(CampaignZone.id_campaign == campaign.id_campaign)
            .all()
        )
        
        campaign_response = CampaignResponse(
            id_campaign=campaign.id_campaign,
            nom=campaign.nom,
            code=campaign.code,
            description=campaign.description,
            type_campagne=campaign.type_campagne,
            date_debut=campaign.date_debut,
            date_fin=campaign.date_fin,
            age_min=campaign.age_min,
            age_max=campaign.age_max,
            sexe=campaign.sexe,
            nombre_dose=campaign.nombre_dose,
            actif=campaign.actif,
            total_personne=campaign.total_personne,
            creee_par=campaign.creee_par,
            modifiee_par=campaign.modifiee_par,
            created_at=campaign.created_at,
            molecules=[MoleculeResponse.model_validate(m) for m in molecules],
            zones=[CampaignZoneResponse.model_validate(z) for z in zones],
        )
        items.append(campaign_response)
    
    return CampaignListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    """Get a specific campaign with all details."""
    campaign = db.query(Campaign).filter(Campaign.id_campaign == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    molecules = (
        db.query(Molecule)
        .join(CampaignMolecule)
        .filter(CampaignMolecule.id_campaign == campaign_id)
        .all()
    )
    zones = (
        db.query(CampaignZone)
        .filter(CampaignZone.id_campaign == campaign_id)
        .all()
    )
    
    return CampaignResponse(
        id_campaign=campaign.id_campaign,
        nom=campaign.nom,
        code=campaign.code,
        description=campaign.description,
        type_campagne=campaign.type_campagne,
        date_debut=campaign.date_debut,
        date_fin=campaign.date_fin,
        age_min=campaign.age_min,
        age_max=campaign.age_max,
        sexe=campaign.sexe,
        nombre_dose=campaign.nombre_dose,
        actif=campaign.actif,
        total_personne=campaign.total_personne,
        creee_par=campaign.creee_par,
        modifiee_par=campaign.modifiee_par,
        created_at=campaign.created_at,
        molecules=[MoleculeResponse.model_validate(m) for m in molecules],
        zones=[CampaignZoneResponse.model_validate(z) for z in zones],
    )


@router.post("/campaigns", response_model=CampaignResponse, dependencies=[Depends(require_region_manager)])
def create_campaign(
    campaign_data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    """Create a new campaign (Region Manager or higher)."""
    # Check for duplicate code
    existing = db.query(Campaign).filter(Campaign.code == campaign_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Campaign code already exists")
    
    # Create campaign
    campaign = Campaign(
        nom=campaign_data.nom,
        code=campaign_data.code,
        description=campaign_data.description,
        type_campagne=campaign_data.type_campagne,
        date_debut=campaign_data.date_debut,
        date_fin=campaign_data.date_fin,
        age_min=campaign_data.age_min,
        age_max=campaign_data.age_max,
        sexe=campaign_data.sexe,
        nombre_dose=campaign_data.nombre_dose,
        actif=campaign_data.actif,
        creee_par=current_user.id_user,
    )
    db.add(campaign)
    db.flush()
    
    # Add molecules
    for molecule_id in campaign_data.molecule_ids:
        molecule = db.query(Molecule).filter(Molecule.id_molecule == molecule_id).first()
        if molecule:
            cm = CampaignMolecule(id_campaign=campaign.id_campaign, id_molecule=molecule_id)
            db.add(cm)
    
    # Add zones
    for zone_data in campaign_data.zones:
        zone = CampaignZone(
            id_campaign=campaign.id_campaign,
            niveau=zone_data.niveau,
            id_region=zone_data.id_region,
            id_dpt=zone_data.id_dpt,
            id_phc=zone_data.id_phc,
            id_chw=zone_data.id_chw,
        )
        db.add(zone)
    
    db.commit()
    db.refresh(campaign)
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="CREATE",
        table_name="campaign",
        record_id=campaign.id_campaign,
        new_value={"nom": campaign.nom, "code": campaign.code},
    )
    
    # Send email notification to all active users
    send_campaign_creation_email_sync(db, campaign, current_user)
    
    return get_campaign(campaign.id_campaign, db, current_user)


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse, dependencies=[Depends(require_region_manager)])
def update_campaign(
    campaign_id: int,
    campaign_data: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    """Update a campaign (Region Manager or higher)."""
    campaign = db.query(Campaign).filter(Campaign.id_campaign == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    old_values = {"nom": campaign.nom, "actif": campaign.actif}
    
    # Update basic fields
    update_fields = ["nom", "description", "type_campagne", "date_debut", "date_fin",
                     "age_min", "age_max", "sexe", "nombre_dose", "actif", "total_personne"]
    
    for field in update_fields:
        value = getattr(campaign_data, field, None)
        if value is not None:
            setattr(campaign, field, value)
    
    campaign.modifiee_par = current_user.id_user
    
    # Update molecules if provided
    if campaign_data.molecule_ids is not None:
        db.query(CampaignMolecule).filter(
            CampaignMolecule.id_campaign == campaign_id
        ).delete()
        for molecule_id in campaign_data.molecule_ids:
            cm = CampaignMolecule(id_campaign=campaign_id, id_molecule=molecule_id)
            db.add(cm)
    
    # Update zones if provided
    if campaign_data.zones is not None:
        db.query(CampaignZone).filter(CampaignZone.id_campaign == campaign_id).delete()
        for zone_data in campaign_data.zones:
            zone = CampaignZone(
                id_campaign=campaign_id,
                niveau=zone_data.niveau,
                id_region=zone_data.id_region,
                id_dpt=zone_data.id_dpt,
                id_phc=zone_data.id_phc,
                id_chw=zone_data.id_chw,
            )
            db.add(zone)
    
    db.commit()
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="UPDATE",
        table_name="campaign",
        record_id=campaign_id,
        old_value=old_values,
        new_value={"nom": campaign.nom, "actif": campaign.actif},
    )
    
    return get_campaign(campaign_id, db, current_user)


@router.delete("/campaigns/{campaign_id}", dependencies=[Depends(require_national_manager)])
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a campaign (National Manager or higher)."""
    campaign = db.query(Campaign).filter(Campaign.id_campaign == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    old_values = {"nom": campaign.nom, "code": campaign.code}
    
    # Delete campaign (cascades to zones and molecules)
    db.delete(campaign)
    db.commit()
    
    create_audit_log(
        db=db,
        user_id=current_user.id_user,
        action="DELETE",
        table_name="campaign",
        record_id=campaign_id,
        old_value=old_values,
    )
    
    return {"message": "Campaign deleted successfully"}


@router.get("/campaigns/{campaign_id}/stats", response_model=CampaignStats)
def get_campaign_stats(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignStats:
    """Get statistics for a specific campaign."""
    campaign = db.query(Campaign).filter(Campaign.id_campaign == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    zones_count = db.query(CampaignZone).filter(
        CampaignZone.id_campaign == campaign_id
    ).count()
    molecules_count = db.query(CampaignMolecule).filter(
        CampaignMolecule.id_campaign == campaign_id
    ).count()
    
    # Calculate days remaining
    today = date.today()
    if campaign.date_fin >= today:
        days_remaining = (campaign.date_fin - today).days
    else:
        days_remaining = 0
    
    # Calculate progress (simplified - based on time elapsed)
    total_days = (campaign.date_fin - campaign.date_debut).days
    if total_days > 0:
        elapsed_days = (today - campaign.date_debut).days
        progress = min(100.0, max(0.0, (elapsed_days / total_days) * 100))
    else:
        progress = 100.0 if today >= campaign.date_fin else 0.0
    
    return CampaignStats(
        id_campaign=campaign.id_campaign,
        nom=campaign.nom,
        type_campagne=campaign.type_campagne,
        total_personne=campaign.total_personne,
        zones_count=zones_count,
        molecules_count=molecules_count,
        days_remaining=days_remaining,
        progress_percentage=round(progress, 2),
    )
