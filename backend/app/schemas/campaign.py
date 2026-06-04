"""
Pydantic schemas for campaign management.
Handles campaigns, molecules, and campaign zones.
"""

from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator


# ============== Molecule Schemas ==============

class MoleculeBase(BaseModel):
    """Base schema for molecule data."""
    code: Optional[str] = Field(None, max_length=50)
    nom: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    nombre_dose_standard: int = Field(default=1, ge=1)


class MoleculeCreate(MoleculeBase):
    """Schema for creating a new molecule."""
    pass


class MoleculeUpdate(BaseModel):
    """Schema for updating a molecule."""
    code: Optional[str] = Field(None, max_length=50)
    nom: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    nombre_dose_standard: Optional[int] = Field(None, ge=1)


class MoleculeResponse(MoleculeBase):
    """Schema for molecule response."""
    id_molecule: int
    
    class Config:
        from_attributes = True


# ============== Campaign Zone Schemas ==============

class CampaignZoneBase(BaseModel):
    """Base schema for campaign zone."""
    niveau: Literal["REGION", "DEPARTEMENT", "PHC", "CHW"]
    id_region: Optional[int] = None
    id_dpt: Optional[int] = None
    id_phc: Optional[int] = None
    id_chw: Optional[int] = None


class CampaignZoneCreate(CampaignZoneBase):
    """Schema for creating a campaign zone."""
    pass


class CampaignZoneResponse(CampaignZoneBase):
    """Schema for campaign zone response."""
    id: int
    id_campaign: int
    
    class Config:
        from_attributes = True


# ============== Campaign Schemas ==============

class CampaignBase(BaseModel):
    """Base schema for campaign data."""
    nom: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    type_campagne: Literal["VACCINATION", "DEPISTAGE", "SUPPLEMENTATION", "SENSIBILISATION", "TRAITEMENT"]
    date_debut: date
    date_fin: date
    age_min: Optional[int] = Field(None, ge=0, le=150)
    age_max: Optional[int] = Field(None, ge=0, le=150)
    sexe: Literal["M", "F", "ALL"] = "ALL"
    nombre_dose: int = Field(default=1, ge=1)
    actif: bool = True
    
    @field_validator("date_fin")
    @classmethod
    def validate_date_fin(cls, v: date, info) -> date:
        """Ensure end date is after start date."""
        if "date_debut" in info.data and v < info.data["date_debut"]:
            raise ValueError("End date must be after start date")
        return v
    
    @field_validator("age_max")
    @classmethod
    def validate_age_max(cls, v: Optional[int], info) -> Optional[int]:
        """Ensure max age is greater than min age."""
        if v is not None and "age_min" in info.data and info.data["age_min"] is not None:
            if v < info.data["age_min"]:
                raise ValueError("Maximum age must be greater than minimum age")
        return v


class CampaignCreate(CampaignBase):
    """Schema for creating a new campaign."""
    molecule_ids: List[int] = Field(default_factory=list)
    zones: List[CampaignZoneCreate] = Field(default_factory=list)


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign."""
    nom: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    type_campagne: Optional[Literal["VACCINATION", "DEPISTAGE", "SUPPLEMENTATION", "SENSIBILISATION", "TRAITEMENT"]] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    age_min: Optional[int] = Field(None, ge=0, le=150)
    age_max: Optional[int] = Field(None, ge=0, le=150)
    sexe: Optional[Literal["M", "F", "ALL"]] = None
    nombre_dose: Optional[int] = Field(None, ge=1)
    actif: Optional[bool] = None
    total_personne: Optional[int] = Field(None, ge=0)
    molecule_ids: Optional[List[int]] = None
    zones: Optional[List[CampaignZoneCreate]] = None


class CampaignResponse(CampaignBase):
    """Schema for campaign response."""
    id_campaign: int
    total_personne: int = 0
    creee_par: int
    modifiee_par: Optional[int] = None
    created_at: datetime
    molecules: List[MoleculeResponse] = []
    zones: List[CampaignZoneResponse] = []
    
    class Config:
        from_attributes = True


class CampaignListResponse(BaseModel):
    """Paginated campaign list."""
    items: List[CampaignResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============== Campaign Statistics ==============

class CampaignStats(BaseModel):
    """Campaign statistics."""
    id_campaign: int
    nom: str
    type_campagne: str
    total_personne: int
    zones_count: int
    molecules_count: int
    days_remaining: int
    progress_percentage: float
