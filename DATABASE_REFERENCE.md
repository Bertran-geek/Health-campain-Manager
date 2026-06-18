# Health Campaign Manager — Database Reference
> Use this document to connect your separate AI/analysis project to the database.

---

## Docker Container

| Property        | Value                      |
|-----------------|----------------------------|
| Container name  | `health_campaign_db`       |
| Image           | `mysql:8.0`                |
| Network         | `health_campaign_manager_default` |
| Internal port   | `3306`                     |
| External port   | `3307` (host machine)      |

---

## Connection Credentials

| Property  | Value                       |
|-----------|-----------------------------|
| Host      | `localhost` (from host machine) OR `health_campaign_db` (from Docker network) |
| Port      | `3307` (host) OR `3306` (Docker network) |
| Database  | `health_campaign_manager`   |
| User      | `health_user`               |
| Password  | `health_pass`               |
| Root pass | `rootpassword`              |

### Connection strings

```
# From your host machine (outside Docker)
mysql+pymysql://health_user:health_pass@localhost:3307/health_campaign_manager

# From inside Docker (same network)
mysql+pymysql://health_user:health_pass@health_campaign_db:3306/health_campaign_manager
```

---

## How to join the existing Docker network (recommended)

Add this to your AI project's `docker-compose.yml` so it can reach the DB container directly:

```yaml
services:
  ai_backend:
    build: .
    container_name: health_campaign_ai
    ports:
      - "8001:8001"
    environment:
      - DB_URL=mysql+pymysql://health_user:health_pass@health_campaign_db:3306/health_campaign_manager
    networks:
      - health_campaign_manager_default   # join the existing network

networks:
  health_campaign_manager_default:
    external: true   # references the already-running network
```

> To find the exact network name run:
> ```bash
> docker network ls | grep health
> ```

---

## Python connection example (SQLAlchemy)

```python
from sqlalchemy import create_engine, text

DB_URL = "mysql+pymysql://health_user:health_pass@localhost:3307/health_campaign_manager"
# OR if inside Docker network:
# DB_URL = "mysql+pymysql://health_user:health_pass@health_campaign_db:3306/health_campaign_manager"

engine = create_engine(DB_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM campaign LIMIT 5"))
    for row in result:
        print(row)
```

---

## Python connection example (pandas — for AI/analysis)

```python
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine("mysql+pymysql://health_user:health_pass@localhost:3307/health_campaign_manager")

df_targets   = pd.read_sql("SELECT * FROM target", engine)
df_campaigns = pd.read_sql("SELECT * FROM campaign", engine)
df_chws      = pd.read_sql("SELECT * FROM chw", engine)
```

---

## Complete Table Schema

### `role`
| Column      | Type         | Notes                  |
|-------------|--------------|------------------------|
| id_role     | INT PK AI    |                        |
| code        | VARCHAR(50)  | unique                 |
| nom         | VARCHAR(100) |                        |
| description | TEXT         | nullable               |

---

### `user`
| Column             | Type          | Notes                   |
|--------------------|---------------|-------------------------|
| id_user            | BIGINT PK AI  |                         |
| username           | VARCHAR(100)  | unique, indexed         |
| password_hash      | VARCHAR(255)  |                         |
| nom                | VARCHAR(100)  |                         |
| prenom             | VARCHAR(100)  | nullable                |
| telephone          | VARCHAR(30)   | nullable                |
| email              | VARCHAR(255)  | nullable                |
| actif              | BOOLEAN       | default TRUE            |
| derniere_connexion | DATETIME      | nullable                |
| created_at         | TIMESTAMP     | auto                    |
| updated_at         | TIMESTAMP     | auto on update          |

---

### `role` / `user_role` (pivot)
| Column  | Type         | Notes                    |
|---------|--------------|--------------------------|
| id      | BIGINT PK AI |                          |
| id_user | BIGINT FK    | → user.id_user           |
| id_role | INT FK       | → role.id_role           |

---

### `region`
| Column     | Type         | Notes |
|------------|--------------|-------|
| id_region  | INT PK AI    |       |
| code       | VARCHAR(20)  | nullable |
| nom_region | VARCHAR(255) |       |
| created_at | TIMESTAMP    | auto  |

---

### `departement`
| Column    | Type         | Notes             |
|-----------|--------------|-------------------|
| id_dpt    | INT PK AI    |                   |
| id_region | INT FK       | → region.id_region |
| code      | VARCHAR(20)  | nullable          |
| nom_dpt   | VARCHAR(255) |                   |
| created_at| TIMESTAMP    | auto              |

---

### `phc` (Primary Health Center / CSPS)
| Column    | Type           | Notes               |
|-----------|----------------|---------------------|
| id_phc    | INT PK AI      |                     |
| id_dpt    | INT FK         | → departement.id_dpt |
| code      | VARCHAR(50)    | unique, nullable    |
| nom_phc   | VARCHAR(255)   |                     |
| adresse   | TEXT           | nullable            |
| latitude  | DECIMAL(10,7)  | nullable            |
| longitude | DECIMAL(10,7)  | nullable            |
| created_at| TIMESTAMP      | auto                |

---

### `chw` (Community Health Worker / ASBC)
| Column    | Type         | Notes          |
|-----------|--------------|----------------|
| id_chw    | INT PK AI    |                |
| id_phc    | INT FK       | → phc.id_phc   |
| code      | VARCHAR(50)  | unique, nullable |
| nom       | VARCHAR(100) |                |
| prenom    | VARCHAR(100) | nullable       |
| telephone | VARCHAR(30)  | nullable       |
| actif     | BOOLEAN      | default TRUE   |
| created_at| TIMESTAMP    | auto           |

---

### `molecule` (Vaccine / drug)
| Column                | Type         | Notes          |
|-----------------------|--------------|----------------|
| id_molecule           | INT PK AI    |                |
| code                  | VARCHAR(50)  | unique, nullable |
| nom                   | VARCHAR(255) |                |
| description           | TEXT         | nullable       |
| nombre_dose_standard  | INT          | default 1      |

---

### `campaign`
| Column         | Type                                                                 | Notes              |
|----------------|----------------------------------------------------------------------|--------------------|
| id_campaign    | BIGINT PK AI                                                         |                    |
| nom            | VARCHAR(255)                                                         |                    |
| code           | VARCHAR(100)                                                         | unique             |
| description    | TEXT                                                                 | nullable           |
| type_campagne  | ENUM('VACCINATION','DEPISTAGE','SUPPLEMENTATION','SENSIBILISATION','TRAITEMENT') | |
| date_debut     | DATE                                                                 |                    |
| date_fin       | DATE                                                                 |                    |
| age_min        | INT                                                                  | nullable           |
| age_max        | INT                                                                  | nullable           |
| sexe           | ENUM('M','F','ALL')                                                  | default 'ALL'      |
| nombre_dose    | INT                                                                  | default 1          |
| actif          | BOOLEAN                                                              | default TRUE       |
| total_personne | INT                                                                  | default 0          |
| creee_par      | BIGINT FK                                                            | → user.id_user     |
| modifiee_par   | BIGINT FK                                                            | → user.id_user, nullable |
| created_at     | TIMESTAMP                                                            | auto               |

---

### `campaign_zone`
| Column      | Type                                    | Notes             |
|-------------|-----------------------------------------|-------------------|
| id          | BIGINT PK AI                            |                   |
| id_campaign | BIGINT FK                               | → campaign        |
| niveau      | ENUM('REGION','DEPARTEMENT','PHC','CHW')|                   |
| id_region   | INT                                     | nullable          |
| id_dpt      | INT                                     | nullable          |
| id_phc      | INT                                     | nullable          |
| id_chw      | INT                                     | nullable          |

---

### `campaign_molecule`
| Column      | Type         | Notes            |
|-------------|--------------|------------------|
| id          | BIGINT PK AI |                  |
| id_campaign | BIGINT FK    | → campaign       |
| id_molecule | INT FK       | → molecule       |

---

### `target` (Campaign targets / Cibles)
| Column             | Type         | Notes                   |
|--------------------|--------------|-------------------------|
| id_target          | INT PK AI    |                         |
| first_name_target  | VARCHAR(255) | nullable                |
| last_name_target   | VARCHAR(255) | nullable                |
| age                | INT          | nullable                |
| sex                | VARCHAR(1)   | 'M' or 'F', nullable    |
| chw_id             | INT FK       | → chw.id_chw, indexed   |
| vaccinate          | BOOLEAN      | default FALSE           |
| id_campain         | BIGINT FK    | → campaign.id_campaign, indexed |
| beneficiaire       | BOOLEAN      | default FALSE           |

---

### `user_scope` (Geographic permissions per user)
| Column      | Type                                                      | Notes         |
|-------------|-----------------------------------------------------------|---------------|
| id          | BIGINT PK AI                                              |               |
| id_user     | BIGINT FK                                                 | → user        |
| niveau      | ENUM('NATIONAL','REGION','DEPARTEMENT','PHC','CHW')       |               |
| id_region   | INT FK                                                    | nullable      |
| id_dpt      | INT FK                                                    | nullable      |
| id_phc      | INT FK                                                    | nullable      |
| id_chw      | INT FK                                                    | nullable      |
| actif       | BOOLEAN                                                   | default TRUE  |

---

### `audit_log`
| Column          | Type         | Notes               |
|-----------------|--------------|---------------------|
| id              | BIGINT PK AI |                     |
| id_user         | BIGINT FK    | → user, nullable    |
| action          | VARCHAR(255) |                     |
| table_name      | VARCHAR(100) |                     |
| record_id       | BIGINT       | nullable            |
| ancienne_valeur | JSON         | old value, nullable |
| nouvelle_valeur | JSON         | new value, nullable |
| created_at      | TIMESTAMP    | auto                |

---

## Key relationships (for JOIN queries)

```
region ──< departement ──< phc ──< chw ──< target
                                     └──< user_scope
campaign ──< campaign_zone
campaign ──< campaign_molecule ──< molecule
campaign ──< target
user ──< user_role ──< role
user ──< user_scope
user ──< audit_log
```

---

## Useful analysis queries

```sql
-- Vaccination coverage by campaign
SELECT c.nom AS campaign, c.type_campagne,
       COUNT(t.id_target) AS total_targets,
       SUM(t.vaccinate) AS vaccinated,
       ROUND(SUM(t.vaccinate)/COUNT(t.id_target)*100, 1) AS coverage_pct
FROM campaign c
LEFT JOIN target t ON t.id_campain = c.id_campaign
GROUP BY c.id_campaign;

-- Targets by CHW
SELECT ch.nom, ch.prenom, COUNT(t.id_target) AS total,
       SUM(t.vaccinate) AS vaccinated, SUM(t.beneficiaire) AS beneficiaries
FROM chw ch
LEFT JOIN target t ON t.chw_id = ch.id_chw
GROUP BY ch.id_chw;

-- Targets by age group
SELECT
  CASE
    WHEN age < 5   THEN '0-4'
    WHEN age < 15  THEN '5-14'
    WHEN age < 60  THEN '15-59'
    ELSE '60+'
  END AS age_group,
  COUNT(*) AS total,
  SUM(vaccinate) AS vaccinated
FROM target
GROUP BY age_group;

-- Active campaigns with zone coverage
SELECT c.nom, c.date_debut, c.date_fin, c.type_campagne,
       GROUP_CONCAT(DISTINCT r.nom_region) AS regions
FROM campaign c
JOIN campaign_zone cz ON cz.id_campaign = c.id_campaign
LEFT JOIN region r ON r.id_region = cz.id_region
WHERE c.actif = 1
GROUP BY c.id_campaign;
```

---

## Adminer (Web GUI)

Access at **http://localhost:8080**
- System: `MySQL`
- Server: `db`
- Username: `health_user`
- Password: `health_pass`
- Database: `health_campaign_manager`
