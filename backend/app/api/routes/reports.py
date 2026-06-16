"""
Reporting & analytics endpoints built on the Target table.
All endpoints accept an optional `campaign_id` filter so reports can be
scoped to the current campaign or computed across all campaigns.
"""
from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.api import deps
from app.models.models import (
    Target, CHW, PHC, Departement, Region, Campaign, User
)

router = APIRouter(prefix="/reports", tags=["reports"])


def _vaccinated_sum():
    return func.coalesce(func.sum(case((Target.vaccinate == True, 1), else_=0)), 0)


def _beneficiary_sum():
    return func.coalesce(func.sum(case((Target.beneficiaire == True, 1), else_=0)), 0)


def _rate(part: int, total: int) -> float:
    return round(part / total * 100, 1) if total else 0.0


@router.get("/summary")
def reports_summary(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    campaign_id: Optional[int] = None,
) -> Any:
    """Global KPI counts for targets, vaccination and beneficiary status."""
    q = db.query(Target)
    if campaign_id:
        q = q.filter(Target.id_campain == campaign_id)

    total = q.count()
    vaccinated = q.filter(Target.vaccinate == True).count()
    beneficiaries = q.filter(Target.beneficiaire == True).count()
    male = q.filter(Target.sex == "M").count()
    female = q.filter(Target.sex == "F").count()

    return {
        "total": total,
        "vaccinated": vaccinated,
        "not_vaccinated": total - vaccinated,
        "beneficiaries": beneficiaries,
        "not_beneficiaries": total - beneficiaries,
        "male": male,
        "female": female,
        "vaccination_rate": _rate(vaccinated, total),
        "beneficiary_rate": _rate(beneficiaries, total),
    }


@router.get("/by-locality")
def reports_by_locality(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    campaign_id: Optional[int] = None,
    level: str = Query("region", pattern="^(region|departement|phc)$"),
) -> Any:
    """Targets grouped by locality (region / departement / phc)."""
    if level == "region":
        id_col, name_col = Region.id_region.label("id"), Region.nom_region.label("name")
        group_cols = [Region.id_region, Region.nom_region]
    elif level == "departement":
        id_col, name_col = Departement.id_dpt.label("id"), Departement.nom_dpt.label("name")
        group_cols = [Departement.id_dpt, Departement.nom_dpt]
    else:  # phc
        id_col, name_col = PHC.id_phc.label("id"), PHC.nom_phc.label("name")
        group_cols = [PHC.id_phc, PHC.nom_phc]

    q = (
        db.query(
            id_col,
            name_col,
            func.count(Target.id_target).label("total"),
            _vaccinated_sum().label("vaccinated"),
            _beneficiary_sum().label("beneficiaries"),
        )
        .join(CHW, Target.chw_id == CHW.id_chw)
        .join(PHC, CHW.id_phc == PHC.id_phc)
        .join(Departement, PHC.id_dpt == Departement.id_dpt)
        .join(Region, Departement.id_region == Region.id_region)
    )
    if campaign_id:
        q = q.filter(Target.id_campain == campaign_id)

    rows = q.group_by(*group_cols).all()

    items = []
    for r in rows:
        total = r.total or 0
        vacc = int(r.vaccinated or 0)
        benef = int(r.beneficiaries or 0)
        items.append({
            "id": r.id,
            "name": r.name,
            "total": total,
            "vaccinated": vacc,
            "not_vaccinated": total - vacc,
            "beneficiaries": benef,
            "not_beneficiaries": total - benef,
            "coverage": _rate(vacc, total),
        })
    items.sort(key=lambda x: x["total"], reverse=True)
    return {"level": level, "items": items}


@router.get("/by-campaign")
def reports_by_campaign(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Per-campaign breakdown of targets, vaccination and beneficiaries."""
    rows = (
        db.query(
            Campaign.id_campaign.label("id"),
            Campaign.nom.label("name"),
            Campaign.type_campagne.label("type"),
            func.count(Target.id_target).label("total"),
            _vaccinated_sum().label("vaccinated"),
            _beneficiary_sum().label("beneficiaries"),
        )
        .outerjoin(Target, Target.id_campain == Campaign.id_campaign)
        .group_by(Campaign.id_campaign, Campaign.nom, Campaign.type_campagne)
        .all()
    )

    items = []
    for r in rows:
        total = r.total or 0
        vacc = int(r.vaccinated or 0)
        benef = int(r.beneficiaries or 0)
        items.append({
            "id": r.id,
            "name": r.name,
            "type": r.type.value if hasattr(r.type, "value") else r.type,
            "total": total,
            "vaccinated": vacc,
            "not_vaccinated": total - vacc,
            "beneficiaries": benef,
            "not_beneficiaries": total - benef,
            "coverage": _rate(vacc, total),
        })
    items.sort(key=lambda x: x["total"], reverse=True)
    return {"items": items}


@router.get("/by-age")
def reports_by_age(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    campaign_id: Optional[int] = None,
) -> Any:
    """Targets grouped by age band."""
    age_group = case(
        (Target.age == None, "Inconnu"),
        (Target.age < 5, "0-4"),
        (Target.age < 15, "5-14"),
        (Target.age < 60, "15-59"),
        else_="60+",
    ).label("age_group")

    q = db.query(
        age_group,
        func.count(Target.id_target).label("total"),
        _vaccinated_sum().label("vaccinated"),
        _beneficiary_sum().label("beneficiaries"),
    )
    if campaign_id:
        q = q.filter(Target.id_campain == campaign_id)

    rows = q.group_by(age_group).all()

    order = {"0-4": 0, "5-14": 1, "15-59": 2, "60+": 3, "Inconnu": 4}
    items = []
    for r in rows:
        total = r.total or 0
        vacc = int(r.vaccinated or 0)
        benef = int(r.beneficiaries or 0)
        items.append({
            "age_group": r.age_group,
            "total": total,
            "vaccinated": vacc,
            "not_vaccinated": total - vacc,
            "beneficiaries": benef,
            "coverage": _rate(vacc, total),
        })
    items.sort(key=lambda x: order.get(x["age_group"], 99))
    return {"items": items}
