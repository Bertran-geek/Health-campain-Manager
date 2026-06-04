"""
Pydantic schemas for geographic entities.
Handles regions, departments, PHCs, and CHWs.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


# ============== Region Schemas ==============

class RegionBase(BaseModel):
    """Base schema for region data."""
    code: Optional[str] = Field(None, max_length=20)
    nom_region: str = Field(..., min_length=2, max_length=255)


class RegionCreate(RegionBase):
    """Schema for creating a new region."""
    pass


class RegionUpdate(BaseModel):
    """Schema for updating a region."""
    code: Optional[str] = Field(None, max_length=20)
    nom_region: Optional[str] = Field(None, min_length=2, max_length=255)


class RegionResponse(RegionBase):
    """Schema for region response."""
    id_region: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class RegionWithStats(RegionResponse):
    """Region with statistics."""
    departement_count: int = 0
    phc_count: int = 0
    chw_count: int = 0


# ============== Departement Schemas ==============

class DepartementBase(BaseModel):
    """Base schema for department data."""
    id_region: int
    code: Optional[str] = Field(None, max_length=20)
    nom_dpt: str = Field(..., min_length=2, max_length=255)


class DepartementCreate(DepartementBase):
    """Schema for creating a new department."""
    pass


class DepartementUpdate(BaseModel):
    """Schema for updating a department."""
    id_region: Optional[int] = None
    code: Optional[str] = Field(None, max_length=20)
    nom_dpt: Optional[str] = Field(None, min_length=2, max_length=255)


class DepartementResponse(DepartementBase):
    """Schema for department response."""
    id_dpt: int
    created_at: datetime
    region: Optional[RegionResponse] = None
    
    class Config:
        from_attributes = True


# ============== PHC Schemas ==============

class PHCBase(BaseModel):
    """Base schema for PHC data."""
    id_dpt: int
    code: Optional[str] = Field(None, max_length=50)
    nom_phc: str = Field(..., min_length=2, max_length=255)
    adresse: Optional[str] = None
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)


class PHCCreate(PHCBase):
    """Schema for creating a new PHC."""
    pass


class PHCUpdate(BaseModel):
    """Schema for updating a PHC."""
    id_dpt: Optional[int] = None
    code: Optional[str] = Field(None, max_length=50)
    nom_phc: Optional[str] = Field(None, min_length=2, max_length=255)
    adresse: Optional[str] = None
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)


class PHCResponse(PHCBase):
    """Schema for PHC response."""
    id_phc: int
    created_at: datetime
    departement: Optional[DepartementResponse] = None
    
    class Config:
        from_attributes = True


# ============== CHW Schemas ==============

class CHWBase(BaseModel):
    """Base schema for CHW data."""
    id_phc: int
    code: Optional[str] = Field(None, max_length=50)
    nom: str = Field(..., min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=30)
    actif: bool = True


class CHWCreate(CHWBase):
    """Schema for creating a new CHW."""
    pass


class CHWUpdate(BaseModel):
    """Schema for updating a CHW."""
    id_phc: Optional[int] = None
    code: Optional[str] = Field(None, max_length=50)
    nom: Optional[str] = Field(None, min_length=2, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=30)
    actif: Optional[bool] = None


class CHWResponse(CHWBase):
    """Schema for CHW response."""
    id_chw: int
    created_at: datetime
    phc: Optional[PHCResponse] = None
    
    class Config:
        from_attributes = True


# ============== List Response Schemas ==============

class PaginatedResponse(BaseModel):
    """Generic paginated response."""
    total: int
    page: int
    page_size: int
    pages: int


class RegionListResponse(PaginatedResponse):
    """Paginated region list."""
    items: List[RegionResponse]


class DepartementListResponse(PaginatedResponse):
    """Paginated department list."""
    items: List[DepartementResponse]


class PHCListResponse(PaginatedResponse):
    """Paginated PHC list."""
    items: List[PHCResponse]


class CHWListResponse(PaginatedResponse):
    """Paginated CHW list."""
    items: List[CHWResponse]
