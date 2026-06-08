"""
SQLAlchemy ORM models for the Health Campaign Manager database.
Uses classic declarative style (Column) for Python 3.14 compatibility.
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, DateTime,
    Date, Enum, ForeignKey, DECIMAL, JSON, TIMESTAMP
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Role(Base):
    """User roles for access control."""
    __tablename__ = "role"

    id_role = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    nom = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    users = relationship("UserRole", back_populates="role")


class User(Base):
    """System users with authentication credentials."""
    __tablename__ = "user"

    id_user = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=True)
    telephone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    actif = Column(Boolean, default=True)
    derniere_connexion = Column(DateTime, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=True, onupdate=func.current_timestamp())

    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    scopes = relationship("UserScope", back_populates="user", cascade="all, delete-orphan")
    created_campaigns = relationship("Campaign", foreign_keys="Campaign.creee_par", back_populates="creator")
    modified_campaigns = relationship("Campaign", foreign_keys="Campaign.modifiee_par", back_populates="modifier")
    audit_logs = relationship("AuditLog", back_populates="user", passive_deletes=True)


class Region(Base):
    """Geographic region (highest administrative level)."""
    __tablename__ = "region"

    id_region = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=True)
    nom_region = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    departements = relationship("Departement", back_populates="region")
    user_scopes = relationship("UserScope", back_populates="region")


class Departement(Base):
    """Department within a region."""
    __tablename__ = "departement"

    id_dpt = Column(Integer, primary_key=True, autoincrement=True)
    id_region = Column(Integer, ForeignKey("region.id_region"), nullable=False)
    code = Column(String(20), nullable=True)
    nom_dpt = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    region = relationship("Region", back_populates="departements")
    phcs = relationship("PHC", back_populates="departement")
    user_scopes = relationship("UserScope", back_populates="departement")


class PHC(Base):
    """Primary Health Center (Centre de Sante)."""
    __tablename__ = "phc"

    id_phc = Column(Integer, primary_key=True, autoincrement=True)
    id_dpt = Column(Integer, ForeignKey("departement.id_dpt"), nullable=False)
    code = Column(String(50), unique=True, nullable=True)
    nom_phc = Column(String(255), nullable=False)
    adresse = Column(Text, nullable=True)
    latitude = Column(DECIMAL(10, 7), nullable=True)
    longitude = Column(DECIMAL(10, 7), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    departement = relationship("Departement", back_populates="phcs")
    chws = relationship("CHW", back_populates="phc")
    user_scopes = relationship("UserScope", back_populates="phc")


class CHW(Base):
    """Community Health Worker (Agent de Sante Communautaire)."""
    __tablename__ = "chw"

    id_chw = Column(Integer, primary_key=True, autoincrement=True)
    id_phc = Column(Integer, ForeignKey("phc.id_phc"), nullable=False)
    code = Column(String(50), unique=True, nullable=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=True)
    telephone = Column(String(30), nullable=True)
    actif = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    phc = relationship("PHC", back_populates="chws")
    user_scopes = relationship("UserScope", back_populates="chw")


class UserRole(Base):
    """Many-to-many relationship between users and roles."""
    __tablename__ = "user_role"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    id_user = Column(BigInteger, ForeignKey("user.id_user", ondelete="CASCADE"), nullable=False)
    id_role = Column(Integer, ForeignKey("role.id_role", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")


class UserScope(Base):
    """Geographic scope/permissions for a user."""
    __tablename__ = "user_scope"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    id_user = Column(BigInteger, ForeignKey("user.id_user"), nullable=False)
    niveau = Column(
        Enum("NATIONAL", "REGION", "DEPARTEMENT", "PHC", "CHW", name="niveau_enum"),
        nullable=False
    )
    id_region = Column(Integer, ForeignKey("region.id_region"), nullable=True)
    id_dpt = Column(Integer, ForeignKey("departement.id_dpt"), nullable=True)
    id_phc = Column(Integer, ForeignKey("phc.id_phc"), nullable=True)
    id_chw = Column(Integer, ForeignKey("chw.id_chw"), nullable=True)
    actif = Column(Boolean, default=True)

    user = relationship("User", back_populates="scopes")
    region = relationship("Region", back_populates="user_scopes")
    departement = relationship("Departement", back_populates="user_scopes")
    phc = relationship("PHC", back_populates="user_scopes")
    chw = relationship("CHW", back_populates="user_scopes")


class Molecule(Base):
    """Medical molecules/vaccines used in campaigns."""
    __tablename__ = "molecule"

    id_molecule = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=True)
    nom = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    nombre_dose_standard = Column(Integer, default=1)

    campaigns = relationship("CampaignMolecule", back_populates="molecule")


class Campaign(Base):
    """Health campaign (vaccination, screening, etc.)."""
    __tablename__ = "campaign"

    id_campaign = Column(BigInteger, primary_key=True, autoincrement=True)
    nom = Column(String(255), nullable=False)
    code = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    type_campagne = Column(
        Enum("VACCINATION", "DEPISTAGE", "SUPPLEMENTATION", "SENSIBILISATION", "TRAITEMENT", name="type_campagne_enum"),
        nullable=False
    )
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    sexe = Column(
        Enum("M", "F", "ALL", name="sexe_enum"),
        default="ALL"
    )
    nombre_dose = Column(Integer, default=1)
    actif = Column(Boolean, default=True)
    total_personne = Column(Integer, default=0)
    creee_par = Column(BigInteger, ForeignKey("user.id_user"), nullable=False)
    modifiee_par = Column(BigInteger, ForeignKey("user.id_user"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    creator = relationship("User", foreign_keys=[creee_par], back_populates="created_campaigns")
    modifier = relationship("User", foreign_keys=[modifiee_par], back_populates="modified_campaigns")
    zones = relationship("CampaignZone", back_populates="campaign", cascade="all, delete-orphan")
    molecules = relationship("CampaignMolecule", back_populates="campaign", cascade="all, delete-orphan")


class CampaignZone(Base):
    """Geographic zones targeted by a campaign."""
    __tablename__ = "campaign_zone"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    id_campaign = Column(BigInteger, ForeignKey("campaign.id_campaign", ondelete="CASCADE"), nullable=False)
    niveau = Column(
        Enum("REGION", "DEPARTEMENT", "PHC", "CHW", name="zone_niveau_enum"),
        nullable=False
    )
    id_region = Column(Integer, nullable=True)
    id_dpt = Column(Integer, nullable=True)
    id_phc = Column(Integer, nullable=True)
    id_chw = Column(Integer, nullable=True)

    campaign = relationship("Campaign", back_populates="zones")


class CampaignMolecule(Base):
    """Molecules/vaccines used in a specific campaign."""
    __tablename__ = "campaign_molecule"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    id_campaign = Column(BigInteger, ForeignKey("campaign.id_campaign", ondelete="CASCADE"), nullable=False)
    id_molecule = Column(Integer, ForeignKey("molecule.id_molecule"), nullable=False)

    campaign = relationship("Campaign", back_populates="molecules")
    molecule = relationship("Molecule", back_populates="campaigns")


class AuditLog(Base):
    """Audit trail for tracking all data modifications."""
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    id_user = Column(BigInteger, ForeignKey("user.id_user"), nullable=True)
    action = Column(String(255), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(BigInteger, nullable=True)
    ancienne_valeur = Column(JSON, nullable=True)
    nouvelle_valeur = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    user = relationship("User", back_populates="audit_logs")
