from typing import Optional, List
from pydantic import BaseModel, Field

class TargetBase(BaseModel):
    first_name_target: Optional[str] = None
    last_name_target: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = Field(None, max_length=1)
    chw_id: Optional[int] = None
    vaccinate: Optional[bool] = False
    id_campain: Optional[int] = None
    beneficiaire: Optional[bool] = False

class TargetCreate(TargetBase):
    pass

class TargetUpdate(TargetBase):
    pass

class TargetResponse(TargetBase):
    id_target: int

    class Config:
        from_attributes = True

class TargetList(BaseModel):
    total: int
    items: List[TargetResponse]
