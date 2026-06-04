# Health Campaign Manager - Database Documentation

## Overview

The Health Campaign Manager database is designed to support health campaign management across a hierarchical geographic structure. It uses MySQL/MariaDB with UTF-8 encoding for international character support.

## Database Connection

```
Host: localhost
Port: 3306
Database: health_campaign_manager
Username: root
Password: (empty)
Character Set: utf8mb4
Collation: utf8mb4_unicode_ci
```

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    role     │     │    user     │     │   region    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id_role PK  │◄────┤ id_user PK  │     │ id_region PK│
│ code        │     │ username    │     │ code        │
│ nom         │     │ password_   │     │ nom_region  │
│ description │     │   hash      │     │ created_at  │
└─────────────┘     │ nom         │     └──────┬──────┘
      │             │ prenom      │            │
      │             │ telephone   │            │ 1:N
      │             │ email       │            ▼
      │             │ actif       │     ┌─────────────┐
      │             │ derniere_   │     │ departement │
      │             │   connexion │     ├─────────────┤
      │             │ created_at  │     │ id_dpt PK   │
      │             │ updated_at  │     │ id_region FK│
      │             └──────┬──────┘     │ code        │
      │                    │            │ nom_dpt     │
      │                    │            │ created_at  │
      │                    │            └──────┬──────┘
      │                    │                   │
      │                    │                   │ 1:N
      ▼                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  user_role  │     │ user_scope  │     │    phc      │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id PK       │     │ id PK       │     │ id_phc PK   │
│ id_user FK  │     │ id_user FK  │     │ id_dpt FK   │
│ id_role FK  │     │ niveau      │     │ code        │
└─────────────┘     │ id_region FK│     │ nom_phc     │
                    │ id_dpt FK   │     │ adresse     │
                    │ id_phc FK   │     │ latitude    │
                    │ id_chw FK   │     │ longitude   │
                    │ actif       │     │ created_at  │
                    └─────────────┘     └──────┬──────┘
                                               │
                                               │ 1:N
                                               ▼
                                        ┌─────────────┐
                                        │    chw      │
                                        ├─────────────┤
                                        │ id_chw PK   │
                                        │ id_phc FK   │
                                        │ code        │
                                        │ nom         │
                                        │ prenom      │
                                        │ telephone   │
                                        │ actif       │
                                        │ created_at  │
                                        └─────────────┘

┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  molecule   │     │    campaign     │     │ audit_log   │
├─────────────┤     ├─────────────────┤     ├─────────────┤
│ id_molecule │◄────┤ id_campaign PK  │     │ id PK       │
│   PK        │     │ nom             │     │ id_user FK  │
│ code        │     │ code            │     │ action      │
│ nom         │     │ description     │     │ table_name  │
│ description │     │ type_campagne   │     │ record_id   │
│ nombre_dose │     │ date_debut      │     │ ancienne_   │
│   _standard │     │ date_fin        │     │   valeur    │
└──────┬──────┘     │ age_min         │     │ nouvelle_   │
       │            │ age_max         │     │   valeur    │
       │            │ sexe            │     │ created_at  │
       │            │ nombre_dose     │     └─────────────┘
       │            │ actif           │
       │            │ total_personne  │
       │            │ creee_par FK    │
       │            │ modifiee_par FK │
       │            │ created_at      │
       │            └────────┬────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│campaign_molecule│   │  campaign_zone  │
├─────────────────┤   ├─────────────────┤
│ id PK           │   │ id PK           │
│ id_campaign FK  │   │ id_campaign FK  │
│ id_molecule FK  │   │ niveau          │
└─────────────────┘   │ id_region       │
                      │ id_dpt          │
                      │ id_phc          │
                      │ id_chw          │
                      └─────────────────┘
```

## Tables Description

### 1. role
Defines user roles for access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_role | INT | PK, AUTO_INCREMENT | Unique role identifier |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Role code (e.g., SUPER_ADMIN) |
| nom | VARCHAR(100) | NOT NULL | Role display name |
| description | TEXT | NULL | Role description |

**Default Roles:**
- `SUPER_ADMIN` - Super Administrateur
- `NATIONAL_MANAGER` - Gestionnaire National
- `REGION_MANAGER` - Gestionnaire Région
- `DPT_MANAGER` - Gestionnaire Département
- `PHC_MANAGER` - Responsable PHC
- `CHW` - Agent Communautaire

### 2. user
System users with authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_user | BIGINT | PK, AUTO_INCREMENT | Unique user identifier |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| nom | VARCHAR(100) | NOT NULL | Last name |
| prenom | VARCHAR(100) | NULL | First name |
| telephone | VARCHAR(30) | NULL | Phone number |
| email | VARCHAR(255) | NULL | Email address |
| actif | BOOLEAN | DEFAULT TRUE | Account active status |
| derniere_connexion | DATETIME | NULL | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

### 3. region
Top-level geographic entity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_region | INT | PK, AUTO_INCREMENT | Unique region identifier |
| code | VARCHAR(20) | UNIQUE | Region code |
| nom_region | VARCHAR(255) | NOT NULL | Region name |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 4. departement
Department within a region.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_dpt | INT | PK, AUTO_INCREMENT | Unique department identifier |
| id_region | INT | FK → region, NOT NULL | Parent region |
| code | VARCHAR(20) | NULL | Department code |
| nom_dpt | VARCHAR(255) | NOT NULL | Department name |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 5. phc (Primary Health Center)
Health center within a department.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_phc | INT | PK, AUTO_INCREMENT | Unique PHC identifier |
| id_dpt | INT | FK → departement, NOT NULL | Parent department |
| code | VARCHAR(50) | UNIQUE | PHC code |
| nom_phc | VARCHAR(255) | NOT NULL | PHC name |
| adresse | TEXT | NULL | Physical address |
| latitude | DECIMAL(10,7) | NULL | GPS latitude |
| longitude | DECIMAL(10,7) | NULL | GPS longitude |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 6. chw (Community Health Worker)
Field worker assigned to a PHC.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_chw | INT | PK, AUTO_INCREMENT | Unique CHW identifier |
| id_phc | INT | FK → phc, NOT NULL | Assigned PHC |
| code | VARCHAR(50) | UNIQUE | CHW code |
| nom | VARCHAR(100) | NOT NULL | Last name |
| prenom | VARCHAR(100) | NULL | First name |
| telephone | VARCHAR(30) | NULL | Phone number |
| actif | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 7. user_role
Many-to-many relationship between users and roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique identifier |
| id_user | BIGINT | FK → user, ON DELETE CASCADE | User reference |
| id_role | INT | FK → role, ON DELETE CASCADE | Role reference |

### 8. user_scope
Geographic access scope for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique identifier |
| id_user | BIGINT | FK → user, NOT NULL | User reference |
| niveau | ENUM | NOT NULL | Scope level (NATIONAL, REGION, DEPARTEMENT, PHC, CHW) |
| id_region | INT | FK → region, NULL | Region scope |
| id_dpt | INT | FK → departement, NULL | Department scope |
| id_phc | INT | FK → phc, NULL | PHC scope |
| id_chw | INT | FK → chw, NULL | CHW scope |
| actif | BOOLEAN | DEFAULT TRUE | Scope active status |

### 9. molecule
Medical molecules/vaccines used in campaigns.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_molecule | INT | PK, AUTO_INCREMENT | Unique molecule identifier |
| code | VARCHAR(50) | UNIQUE | Molecule code |
| nom | VARCHAR(255) | NOT NULL | Molecule name |
| description | TEXT | NULL | Description |
| nombre_dose_standard | INT | DEFAULT 1 | Standard number of doses |

### 10. campaign
Health campaign definition.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id_campaign | BIGINT | PK, AUTO_INCREMENT | Unique campaign identifier |
| nom | VARCHAR(255) | NOT NULL | Campaign name |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Campaign code |
| description | TEXT | NULL | Campaign description |
| type_campagne | ENUM | NOT NULL | Type (VACCINATION, DEPISTAGE, SUPPLEMENTATION, SENSIBILISATION, TRAITEMENT) |
| date_debut | DATE | NOT NULL | Start date |
| date_fin | DATE | NOT NULL | End date |
| age_min | INT | NULL | Minimum target age |
| age_max | INT | NULL | Maximum target age |
| sexe | ENUM | DEFAULT 'ALL' | Target sex (M, F, ALL) |
| nombre_dose | INT | DEFAULT 1 | Number of doses |
| actif | BOOLEAN | DEFAULT TRUE | Campaign active status |
| total_personne | INT | DEFAULT 0 | Total persons reached |
| creee_par | BIGINT | FK → user, NOT NULL | Created by user |
| modifiee_par | BIGINT | FK → user, NULL | Last modified by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 11. campaign_zone
Geographic zones targeted by a campaign.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique identifier |
| id_campaign | BIGINT | FK → campaign, ON DELETE CASCADE | Campaign reference |
| niveau | ENUM | NOT NULL | Zone level (REGION, DEPARTEMENT, PHC, CHW) |
| id_region | INT | NULL | Region reference |
| id_dpt | INT | NULL | Department reference |
| id_phc | INT | NULL | PHC reference |
| id_chw | INT | NULL | CHW reference |

### 12. campaign_molecule
Molecules used in a campaign (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique identifier |
| id_campaign | BIGINT | FK → campaign, ON DELETE CASCADE | Campaign reference |
| id_molecule | INT | FK → molecule | Molecule reference |

### 13. audit_log
Audit trail for all data modifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique identifier |
| id_user | BIGINT | FK → user, NULL | User who performed action |
| action | VARCHAR(255) | NOT NULL | Action type (CREATE, UPDATE, DELETE, LOGIN) |
| table_name | VARCHAR(100) | NOT NULL | Affected table |
| record_id | BIGINT | NULL | Affected record ID |
| ancienne_valeur | JSON | NULL | Previous values |
| nouvelle_valeur | JSON | NULL | New values |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Action timestamp |

## Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| region → departement | 1:N | A region contains multiple departments |
| departement → phc | 1:N | A department contains multiple PHCs |
| phc → chw | 1:N | A PHC has multiple CHWs |
| user ↔ role | N:M | Users can have multiple roles (via user_role) |
| user → user_scope | 1:N | Users can have multiple geographic scopes |
| campaign → campaign_zone | 1:N | Campaigns target multiple zones |
| campaign ↔ molecule | N:M | Campaigns use multiple molecules (via campaign_molecule) |
| user → campaign | 1:N | Users create/modify campaigns |
| user → audit_log | 1:N | Users generate audit entries |

## Indexes

The following indexes are automatically created:
- Primary keys on all `id_*` columns
- Unique indexes on `code` columns
- Foreign key indexes on all FK columns
- Index on `user.username` for login queries

## SQL Script

See the complete SQL script in the project root or use the following to create the database:

```sql
CREATE DATABASE IF NOT EXISTS health_campaign_manager 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

## Backup & Restore

### Backup
```bash
mysqldump -u root health_campaign_manager > backup.sql
```

### Restore
```bash
mysql -u root health_campaign_manager < backup.sql
```
