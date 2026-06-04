# Health Campaign Manager - Class Diagram

## UML Class Diagram (Mermaid)

```mermaid
classDiagram
    direction TB
    
    %% ==================== AUTHENTICATION & AUTHORIZATION ====================
    class Role {
        +int id_role
        +string code
        +string nom
        +string description
        --
        +List~UserRole~ users
    }
    
    class User {
        +bigint id_user
        +string username
        +string password_hash
        +string nom
        +string prenom
        +string telephone
        +string email
        +bool actif
        +datetime derniere_connexion
        +timestamp created_at
        +timestamp updated_at
        --
        +List~UserRole~ roles
        +List~UserScope~ scopes
        +List~Campaign~ created_campaigns
        +List~Campaign~ modified_campaigns
        +List~AuditLog~ audit_logs
    }
    
    class UserRole {
        +bigint id
        +bigint id_user
        +int id_role
        --
        +User user
        +Role role
    }
    
    class UserScope {
        +bigint id
        +bigint id_user
        +enum niveau
        +int id_region
        +int id_dpt
        +int id_phc
        +int id_chw
        +bool actif
        --
        +User user
        +Region region
        +Departement departement
        +PHC phc
        +CHW chw
    }
    
    %% ==================== GEOGRAPHIC HIERARCHY ====================
    class Region {
        +int id_region
        +string code
        +string nom_region
        +timestamp created_at
        --
        +List~Departement~ departements
        +List~UserScope~ user_scopes
    }
    
    class Departement {
        +int id_dpt
        +int id_region
        +string code
        +string nom_dpt
        +timestamp created_at
        --
        +Region region
        +List~PHC~ phcs
        +List~UserScope~ user_scopes
    }
    
    class PHC {
        +int id_phc
        +int id_dpt
        +string code
        +string nom_phc
        +string adresse
        +decimal latitude
        +decimal longitude
        +timestamp created_at
        --
        +Departement departement
        +List~CHW~ chws
        +List~UserScope~ user_scopes
    }
    
    class CHW {
        +int id_chw
        +int id_phc
        +string code
        +string nom
        +string prenom
        +string telephone
        +bool actif
        +timestamp created_at
        --
        +PHC phc
        +List~UserScope~ user_scopes
    }
    
    %% ==================== CAMPAIGN MANAGEMENT ====================
    class Molecule {
        +int id_molecule
        +string code
        +string nom
        +string description
        +int nombre_dose_standard
        --
        +List~CampaignMolecule~ campaigns
    }
    
    class Campaign {
        +bigint id_campaign
        +string nom
        +string code
        +string description
        +enum type_campagne
        +date date_debut
        +date date_fin
        +int age_min
        +int age_max
        +enum sexe
        +int nombre_dose
        +bool actif
        +int total_personne
        +bigint creee_par
        +bigint modifiee_par
        +timestamp created_at
        --
        +User creator
        +User modifier
        +List~CampaignZone~ zones
        +List~CampaignMolecule~ molecules
    }
    
    class CampaignZone {
        +bigint id
        +bigint id_campaign
        +enum niveau
        +int id_region
        +int id_dpt
        +int id_phc
        +int id_chw
        --
        +Campaign campaign
    }
    
    class CampaignMolecule {
        +bigint id
        +bigint id_campaign
        +int id_molecule
        --
        +Campaign campaign
        +Molecule molecule
    }
    
    %% ==================== AUDIT ====================
    class AuditLog {
        +bigint id
        +bigint id_user
        +string action
        +string table_name
        +bigint record_id
        +json ancienne_valeur
        +json nouvelle_valeur
        +timestamp created_at
        --
        +User user
    }
    
    %% ==================== RELATIONSHIPS ====================
    
    %% User relationships
    User "1" --> "*" UserRole : has
    Role "1" --> "*" UserRole : assigned_to
    User "1" --> "*" UserScope : has
    User "1" --> "*" AuditLog : generates
    User "1" --> "*" Campaign : creates
    User "1" --> "*" Campaign : modifies
    
    %% Geographic hierarchy
    Region "1" --> "*" Departement : contains
    Departement "1" --> "*" PHC : contains
    PHC "1" --> "*" CHW : employs
    
    %% User scope references
    UserScope "*" --> "0..1" Region : scoped_to
    UserScope "*" --> "0..1" Departement : scoped_to
    UserScope "*" --> "0..1" PHC : scoped_to
    UserScope "*" --> "0..1" CHW : scoped_to
    
    %% Campaign relationships
    Campaign "1" --> "*" CampaignZone : targets
    Campaign "1" --> "*" CampaignMolecule : uses
    Molecule "1" --> "*" CampaignMolecule : used_in
```

## PlantUML Version

```plantuml
@startuml Health Campaign Manager Class Diagram

skinparam classAttributeIconSize 0
skinparam linetype ortho

package "Authentication & Authorization" {
    class Role {
        - id_role: int <<PK>>
        - code: varchar(50) <<UNIQUE>>
        - nom: varchar(100)
        - description: text
        ==
        + users: List<UserRole>
    }
    
    class User {
        - id_user: bigint <<PK>>
        - username: varchar(100) <<UNIQUE>>
        - password_hash: varchar(255)
        - nom: varchar(100)
        - prenom: varchar(100)
        - telephone: varchar(30)
        - email: varchar(255)
        - actif: boolean
        - derniere_connexion: datetime
        - created_at: timestamp
        - updated_at: timestamp
        ==
        + roles: List<UserRole>
        + scopes: List<UserScope>
        + created_campaigns: List<Campaign>
        + modified_campaigns: List<Campaign>
        + audit_logs: List<AuditLog>
    }
    
    class UserRole {
        - id: bigint <<PK>>
        - id_user: bigint <<FK>>
        - id_role: int <<FK>>
        ==
        + user: User
        + role: Role
    }
    
    class UserScope {
        - id: bigint <<PK>>
        - id_user: bigint <<FK>>
        - niveau: enum
        - id_region: int <<FK>>
        - id_dpt: int <<FK>>
        - id_phc: int <<FK>>
        - id_chw: int <<FK>>
        - actif: boolean
        ==
        + user: User
        + region: Region
        + departement: Departement
        + phc: PHC
        + chw: CHW
    }
}

package "Geographic Hierarchy" {
    class Region {
        - id_region: int <<PK>>
        - code: varchar(20) <<UNIQUE>>
        - nom_region: varchar(255)
        - created_at: timestamp
        ==
        + departements: List<Departement>
        + user_scopes: List<UserScope>
    }
    
    class Departement {
        - id_dpt: int <<PK>>
        - id_region: int <<FK>>
        - code: varchar(20)
        - nom_dpt: varchar(255)
        - created_at: timestamp
        ==
        + region: Region
        + phcs: List<PHC>
        + user_scopes: List<UserScope>
    }
    
    class PHC {
        - id_phc: int <<PK>>
        - id_dpt: int <<FK>>
        - code: varchar(50) <<UNIQUE>>
        - nom_phc: varchar(255)
        - adresse: text
        - latitude: decimal(10,7)
        - longitude: decimal(10,7)
        - created_at: timestamp
        ==
        + departement: Departement
        + chws: List<CHW>
        + user_scopes: List<UserScope>
    }
    
    class CHW {
        - id_chw: int <<PK>>
        - id_phc: int <<FK>>
        - code: varchar(50) <<UNIQUE>>
        - nom: varchar(100)
        - prenom: varchar(100)
        - telephone: varchar(30)
        - actif: boolean
        - created_at: timestamp
        ==
        + phc: PHC
        + user_scopes: List<UserScope>
    }
}

package "Campaign Management" {
    class Molecule {
        - id_molecule: int <<PK>>
        - code: varchar(50) <<UNIQUE>>
        - nom: varchar(255)
        - description: text
        - nombre_dose_standard: int
        ==
        + campaigns: List<CampaignMolecule>
    }
    
    class Campaign {
        - id_campaign: bigint <<PK>>
        - nom: varchar(255)
        - code: varchar(100) <<UNIQUE>>
        - description: text
        - type_campagne: enum
        - date_debut: date
        - date_fin: date
        - age_min: int
        - age_max: int
        - sexe: enum
        - nombre_dose: int
        - actif: boolean
        - total_personne: int
        - creee_par: bigint <<FK>>
        - modifiee_par: bigint <<FK>>
        - created_at: timestamp
        ==
        + creator: User
        + modifier: User
        + zones: List<CampaignZone>
        + molecules: List<CampaignMolecule>
    }
    
    class CampaignZone {
        - id: bigint <<PK>>
        - id_campaign: bigint <<FK>>
        - niveau: enum
        - id_region: int
        - id_dpt: int
        - id_phc: int
        - id_chw: int
        ==
        + campaign: Campaign
    }
    
    class CampaignMolecule {
        - id: bigint <<PK>>
        - id_campaign: bigint <<FK>>
        - id_molecule: int <<FK>>
        ==
        + campaign: Campaign
        + molecule: Molecule
    }
}

package "Audit" {
    class AuditLog {
        - id: bigint <<PK>>
        - id_user: bigint <<FK>>
        - action: varchar(255)
        - table_name: varchar(100)
        - record_id: bigint
        - ancienne_valeur: json
        - nouvelle_valeur: json
        - created_at: timestamp
        ==
        + user: User
    }
}

' Relationships
User "1" -- "*" UserRole
Role "1" -- "*" UserRole
User "1" -- "*" UserScope
User "1" -- "*" AuditLog

Region "1" -- "*" Departement
Departement "1" -- "*" PHC
PHC "1" -- "*" CHW

UserScope "*" -- "0..1" Region
UserScope "*" -- "0..1" Departement
UserScope "*" -- "0..1" PHC
UserScope "*" -- "0..1" CHW

Campaign "1" -- "*" CampaignZone
Campaign "1" -- "*" CampaignMolecule
Molecule "1" -- "*" CampaignMolecule

User "1" -- "*" Campaign : creates
User "1" -- "*" Campaign : modifies

@enduml
```

## ASCII Class Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                           HEALTH CAMPAIGN MANAGER - CLASS DIAGRAM                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION & AUTHORIZATION                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐         │
│  │      Role        │         │    UserRole      │         │      User        │         │
│  ├──────────────────┤         ├──────────────────┤         ├──────────────────┤         │
│  │ - id_role: int   │◄────────│ - id: bigint     │────────►│ - id_user: bigint│         │
│  │ - code: string   │   1   * │ - id_user: FK    │ *   1   │ - username: str  │         │
│  │ - nom: string    │         │ - id_role: FK    │         │ - password_hash  │         │
│  │ - description    │         └──────────────────┘         │ - nom: string    │         │
│  └──────────────────┘                                      │ - prenom: string │         │
│                                                            │ - telephone: str │         │
│                                                            │ - email: string  │         │
│                              ┌──────────────────┐          │ - actif: bool    │         │
│                              │    UserScope     │          │ - derniere_conn  │         │
│                              ├──────────────────┤          │ - created_at     │         │
│                              │ - id: bigint     │◄─────────│ - updated_at     │         │
│                              │ - id_user: FK    │    1   * └──────────────────┘         │
│                              │ - niveau: enum   │                    │                  │
│                              │ - id_region: FK  │                    │ 1                │
│                              │ - id_dpt: FK     │                    │                  │
│                              │ - id_phc: FK     │                    ▼ *                │
│                              │ - id_chw: FK     │          ┌──────────────────┐         │
│                              │ - actif: bool    │          │    AuditLog      │         │
│                              └──────────────────┘          ├──────────────────┤         │
│                                       │                    │ - id: bigint     │         │
│                                       │ *                  │ - id_user: FK    │         │
│                                       │                    │ - action: string │         │
│                                       ▼ 0..1               │ - table_name     │         │
│                              ┌──────────────────┐          │ - record_id      │         │
│                              │ Geographic Refs  │          │ - ancienne_val   │         │
│                              └──────────────────┘          │ - nouvelle_val   │         │
│                                                            │ - created_at     │         │
│                                                            └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  GEOGRAPHIC HIERARCHY                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐         │
│  │     Region       │         │   Departement    │         │       PHC        │         │
│  ├──────────────────┤         ├──────────────────┤         ├──────────────────┤         │
│  │ - id_region: int │────────►│ - id_dpt: int    │────────►│ - id_phc: int    │         │
│  │ - code: string   │   1   * │ - id_region: FK  │   1   * │ - id_dpt: FK     │         │
│  │ - nom_region     │         │ - code: string   │         │ - code: string   │         │
│  │ - created_at     │         │ - nom_dpt        │         │ - nom_phc        │         │
│  └──────────────────┘         │ - created_at     │         │ - adresse        │         │
│                               └──────────────────┘         │ - latitude       │         │
│                                                            │ - longitude      │         │
│                                                            │ - created_at     │         │
│                                                            └────────┬─────────┘         │
│                                                                     │                   │
│                                                                     │ 1                 │
│                                                                     │                   │
│                                                                     ▼ *                 │
│                                                            ┌──────────────────┐         │
│                                                            │       CHW        │         │
│                                                            ├──────────────────┤         │
│                                                            │ - id_chw: int    │         │
│                                                            │ - id_phc: FK     │         │
│                                                            │ - code: string   │         │
│                                                            │ - nom: string    │         │
│                                                            │ - prenom: string │         │
│                                                            │ - telephone      │         │
│                                                            │ - actif: bool    │         │
│                                                            │ - created_at     │         │
│                                                            └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CAMPAIGN MANAGEMENT                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐         │
│  │    Molecule      │         │CampaignMolecule  │         │    Campaign      │         │
│  ├──────────────────┤         ├──────────────────┤         ├──────────────────┤         │
│  │ - id_molecule    │◄────────│ - id: bigint     │────────►│ - id_campaign    │         │
│  │ - code: string   │   1   * │ - id_campaign:FK │ *   1   │ - nom: string    │         │
│  │ - nom: string    │         │ - id_molecule:FK │         │ - code: string   │         │
│  │ - description    │         └──────────────────┘         │ - description    │         │
│  │ - nombre_dose_   │                                      │ - type_campagne  │         │
│  │   standard       │                                      │ - date_debut     │         │
│  └──────────────────┘                                      │ - date_fin       │         │
│                                                            │ - age_min/max    │         │
│                                                            │ - sexe: enum     │         │
│                              ┌──────────────────┐          │ - nombre_dose    │         │
│                              │  CampaignZone    │          │ - actif: bool    │         │
│                              ├──────────────────┤          │ - total_personne │         │
│                              │ - id: bigint     │◄─────────│ - creee_par: FK  │         │
│                              │ - id_campaign:FK │    1   * │ - modifiee_par   │         │
│                              │ - niveau: enum   │          │ - created_at     │         │
│                              │ - id_region      │          └──────────────────┘         │
│                              │ - id_dpt         │                    │                  │
│                              │ - id_phc         │                    │                  │
│                              │ - id_chw         │                    ▼                  │
│                              └──────────────────┘          ┌──────────────────┐         │
│                                                            │      User        │         │
│                                                            │  (creator/mod)   │         │
│                                                            └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                    LEGEND                                              ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  ────────►  : One-to-Many relationship (1:N)                                          ║
║  ◄────────  : Many-to-One relationship (N:1)                                          ║
║  ◄────────► : Many-to-Many relationship (N:M) via junction table                      ║
║  PK         : Primary Key                                                              ║
║  FK         : Foreign Key                                                              ║
║  1   *      : Cardinality (one to many)                                               ║
║  *   1      : Cardinality (many to one)                                               ║
║  0..1       : Optional relationship                                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

## Enumerations

### niveau (UserScope & CampaignZone)
```
NATIONAL | REGION | DEPARTEMENT | PHC | CHW
```

### type_campagne (Campaign)
```
VACCINATION | DEPISTAGE | SUPPLEMENTATION | SENSIBILISATION | TRAITEMENT
```

### sexe (Campaign)
```
M | F | ALL
```

## Key Design Patterns

1. **Hierarchical Geographic Structure**: Region → Departement → PHC → CHW
2. **Role-Based Access Control (RBAC)**: Users have roles via UserRole junction table
3. **Scope-Based Authorization**: UserScope defines geographic access boundaries
4. **Audit Trail**: AuditLog tracks all data modifications with JSON snapshots
5. **Many-to-Many Relationships**: 
   - User ↔ Role (via UserRole)
   - Campaign ↔ Molecule (via CampaignMolecule)
