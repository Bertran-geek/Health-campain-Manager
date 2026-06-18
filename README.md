# Health Campaign Manager

Health Campaign Manager est une plateforme web de gestion de campagnes de sante publique. Elle permet la planification, l'execution et le suivi en temps reel des campagnes de vaccination, de depistage, de supplementation, de sensibilisation et de traitement. Le systeme assure le suivi des agents de sante, des cibles, de la couverture geographique et genere des rapports automatiques par email.

---

## Architecture

Le systeme suit une architecture trois tiers conteneurisee avec Docker.

```
Navigateur (React/Next.js)
      |
      v
  Nginx / Next.js (port 3000)
      |
      v
  FastAPI Backend (port 8000)
      |
      v
  MySQL 8 (port 3307)
```

### Structure du projet

```
HEALTH_CAMPAIGN_MANAGER/
├── backend/                    # API FastAPI Python
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/        # Endpoints REST (auth, users, campaigns, targets, emails, etc.)
│   │   │   └── router.py      # Routeur principal avec prefixe /api/v1
│   │   ├── core/              # Configuration, base de donnees, securite JWT
│   │   ├── models/            # Modeles ORM SQLAlchemy
│   │   ├── schemas/           # Schemas de validation Pydantic
│   │   ├── services/          # Logique metier (audit, email)
│   │   ├── templates/emails/  # Templates HTML Jinja2 pour les emails
│   │   └── main.py            # Point d'entree FastAPI (lifespan, middleware, CORS)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/                   # Interface Next.js React
│   ├── app/[locale]/dashboard/ # Pages du tableau de bord
│   ├── components/            # Composants React (sidebar, UI)
│   ├── lib/
│   │   ├── api.ts             # Client Axios avec intercepteurs JWT
│   │   └── services.ts        # Couche service (appels API separes des pages)
│   ├── messages/              # Fichiers de traduction en.json, fr.json
│   ├── package.json
│   └── Dockerfile
├── docs/                       # Documentation technique
│   ├── DATABASE.md
│   └── CLASS_DIAGRAM.md
├── docker-compose.yml          # Orchestration des conteneurs
└── README.md
```

---

## Demarrage rapide

### Option 1 : Docker (recommande)

Prerequis : Docker et Docker Compose installes.

```bash
# Construire et demarrer tous les services
docker compose up --build

# En mode developpement avec hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |
| Swagger (API Docs) | http://localhost:8000/api/v1/docs |
| Adminer (BDD) | http://localhost:8080 |
| MySQL | localhost:3307 |

Identifiants par defaut en Docker :
- Utilisateur : health_user / Mot de passe : health_pass
- Root : root / Mot de passe : rootpassword

### Option 2 : Installation manuelle

Prerequis : Python 3.10+, Node.js 18+, MySQL/MariaDB, pnpm.

#### 1. Base de donnees

1. Demarrer le serveur MySQL/MariaDB
2. Creer la base de donnees avec le script SQL (voir docs/schema.sql)

#### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env        # Configurer les identifiants BDD
python -m uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

---

## Fonctionnalites

### Gestion des campagnes

- Creation, modification et suppression de campagnes de sante
- Cinq types de campagnes : Vaccination, Depistage, Supplementation, Sensibilisation, Traitement
- Attribution de zones geographiques (regions, departements) et de molecules a chaque campagne
- Filtrage par type et recherche textuelle
- Indicateurs de statut : en cours, actif, inactif

### Gestion des cibles

- Enregistrement des cibles (nom, prenom, age, sexe, campagne, ASC)
- Marquage vaccinate/beneficiaire avec boutons de bascule dans la liste
- Badges visuels : vert pour valide, gris pour non valide
- QR Code d'acces au formulaire d'enregistrement public
- Recherche par nom

### Gestion des agents de sante

- Creation et gestion des comptes utilisateurs avec roles et scopes geographiques
- Activation/desactivation des comptes
- Attribution de roles hierarchiques et de zones d'intervention
- Recherche et filtrage par statut

### Tableau de bord

- Statistiques globales : total cibles, vaccines, beneficiaires, taux de couverture
- Graphiques : statut vaccinal (donut), statut beneficiaire (donut), repartition par sexe
- Diagramme en barres par localite (region)
- Filtrage par campagne

### Systeme de messagerie electronique

- Envoi automatique d'un email de notification a la creation d'une campagne
- Rapports hebdomadaires automatiques envoyes a tous les utilisateurs actifs
- Configuration SMTP depuis l'interface (hote, port, identifiants, email expediteur)
- Envoi d'emails de test pour valider la configuration
- Declenchement manuel du rapport hebdomadaire
- Planification configurable : jour et heure du rapport hebdomadaire
- Templates HTML professionnels pour les emails (Jinja2)

### Hierarchie geographique

- Gestion des regions, departements, centres de sante primaires (PHC) et agents de sante communautaires (ASC)
- Navigation hierarchique dans l'interface

### Molecules

- Gestion des molecules et vaccins utilises dans les campagnes
- Creation depuis le formulaire de campagne

### Audit et journalisation

- Journal automatique de toutes les modifications de donnees (creation, modification, suppression)
- Enregistrement de l'utilisateur, de la table, de l'identifiant et des anciennes/nouvelles valeurs

### Internationalisation

- Interface disponible en francais et en anglais
- Traductions gerees via next-intl avec fichiers JSON dedies

---

## Securite

### Authentification

- Authentification par JWT (JSON Web Tokens) avec tokens d'acces et de rafraichissement
- Hashage des mots de passe avec bcrypt via passlib
- Expiration automatique des sessions avec notification utilisateur
- Les tokens sont stockes dans le localStorage du navigateur et transmis via le header Authorization

### Controle d'acces base sur les roles (RBAC)

Le systeme implemente un controle d'acces hierarchique a six niveaux :

| Role | Description | Niveau d'acces |
|------|-------------|----------------|
| SUPER_ADMIN | Acces complet au systeme | Tout |
| NATIONAL_MANAGER | Gestion nationale | National et inferieur |
| REGION_MANAGER | Gestion regionale | Region et inferieur |
| DPT_MANAGER | Gestion departementale | Departement et inferieur |
| PHC_MANAGER | Gestion du centre de sante | PHC et inferieur |
| CHW | Agent de sante communautaire | Donnees propres uniquement |

Chaque utilisateur se voit attribuer un ou plusieurs roles et un scope geographique qui determine les donnees auxquelles il a acces.

### Protection CORS

- Configuration CORS restrictive limitant les requetes au domaine du frontend
- Les requetes cross-origin non autorisees sont rejetees

### Journal d'audit

- Toute modification de donnee (creation, mise a jour, suppression) est enregistree dans la table audit_log
- Chaque entree contient : l'utilisateur, l'action, la table concernee, l'identifiant de l'enregistrement, les anciennes et nouvelles valeurs
- Permet la tracabilite complete des operations

### Securite des emails

- Les identifiants SMTP sont stockes dans les variables d'environnement du backend
- La configuration SMTP via l'API est reservee aux roles NATIONAL_MANAGER et SUPER_ADMIN
- Les mots de passe SMTP ne sont jamais renvoyes par l'API (champ masque)

---

## API REST

Tous les endpoints sont accessibles sous le prefixe /api/v1.

| Endpoint | Methode | Description |
|----------|---------|-------------|
| /auth/login | POST | Authentification, retourne un JWT |
| /auth/refresh | POST | Rafraichissement du token |
| /users | GET/POST | Liste et creation d'utilisateurs |
| /users/{id} | GET/PUT/DELETE | Lecture, modification, suppression |
| /users/roles | GET | Liste des roles disponibles |
| /campaigns | GET/POST | Liste et creation de campagnes |
| /campaigns/{id} | GET/PUT/DELETE | Detail, modification, suppression |
| /molecules | GET/POST | Liste et creation de molecules |
| /targets | GET/POST | Liste et creation de cibles |
| /targets/{id} | GET/PUT/DELETE | Detail, modification, suppression |
| /regions | GET | Liste des regions |
| /departements | GET | Liste des departements |
| /chws | GET | Liste des agents de sante communautaires |
| /reports/summary | GET | Resume statistique global |
| /reports/by-locality | GET | Statistiques par localite |
| /emails/config | GET/PUT | Configuration SMTP |
| /emails/test | POST | Envoi d'un email de test |
| /emails/weekly-report | POST | Declenchement manuel du rapport hebdomadaire |
| /audit | GET | Journal d'audit |

Documentation interactive complete : http://localhost:8000/api/v1/docs

---

## Configuration SMTP

Le systeme de messagerie requiert une configuration SMTP pour fonctionner. Pour Gmail :

1. Activer la validation en deux etapes sur le compte Google
2. Creer un mot de passe d'application sur myaccount.google.com/apppasswords
3. Configurer dans l'interface Email du tableau de bord ou via les variables d'environnement Docker

Variables d'environnement Docker :

| Variable | Description | Defaut |
|----------|-------------|--------|
| SMTP_HOST | Serveur SMTP | smtp.gmail.com |
| SMTP_PORT | Port SMTP | 587 |
| SMTP_USER | Nom d'utilisateur SMTP | (vide) |
| SMTP_PASSWORD | Mot de passe d'application | (vide) |
| SMTP_FROM_EMAIL | Email expediteur | (vide) |
| SMTP_USE_TLS | Utiliser TLS | true |
| WEEKLY_REPORT_DAY | Jour du rapport (0=lundi) | 1 |
| WEEKLY_REPORT_HOUR | Heure du rapport (0-23) | 8 |

---

## Couche service frontend

Les appels API sont centralises dans le fichier frontend/lib/services.ts, separe des composants de page. Cette couche fournit :

- targetService : operations CRUD et bascule vaccinate/beneficiaire
- campaignService : operations CRUD sur les campagnes
- moleculeService : liste et creation de molecules
- geographyService : regions, departements, ASC
- userService : gestion des utilisateurs et roles
- reportService : resumes statistiques et donnees par localite
- emailService : configuration SMTP, test, rapport hebdomadaire

Tous les types TypeScript sont exportes depuis ce fichier pour assurer la coherence.

---

## Types de campagnes

| Code | Description |
|------|-------------|
| VACCINATION | Campagnes de vaccination |
| DEPISTAGE | Campagnes de depistage |
| SUPPLEMENTATION | Campagnes de supplementation |
| SENSIBILISATION | Campagnes de sensibilisation |
| TRAITEMENT | Campagnes de traitement |

---

## Hierarchie geographique

```
Region
  └── Departement
        └── PHC (Centre de Sante Primaire)
              └── CHW (Agent de Sante Communautaire)
```

---

## Stack technique

### Backend
- FastAPI 0.115.0
- SQLAlchemy 2.0
- PyMySQL
- Pydantic v2
- python-jose (JWT)
- passlib (bcrypt)
- aiosmtplib (envoi d'emails asynchrone)
- Jinja2 (templates d'emails HTML)
- APScheduler (planification des rapports hebdomadaires)

### Frontend
- Next.js 16
- TypeScript
- TailwindCSS v4
- shadcn/ui
- Lucide Icons
- next-intl (internationalisation)
- Recharts (graphiques)
- Axios (client HTTP)
- SweetAlert2 (notifications)

### Infrastructure
- Docker + Docker Compose
- MySQL 8
- Adminer (administration BDD)

---

## Licence

MIT License
