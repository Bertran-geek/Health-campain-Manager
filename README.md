# Health Campaign Manager

A comprehensive health campaign management system with a FastAPI backend and Next.js frontend.

Health Campaign Manager is a web platform that streamlines the planning, execution, and monitoring of mass health campaigns. It enables real-time tracking of activities, field agents, targets, and coverage across all administrative levels, providing dashboards, reports, and insights to improve campaign performance and decision-making.

## 🏗️ Project Structure

```
HEALTH_CAMPAIGN_MANAGER/
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API routes and dependencies
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # Business logic services
│   │   └── main.py         # Application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # Next.js React frontend
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── package.json       # Node dependencies
├── docs/                   # Documentation
│   ├── DATABASE.md        # Database documentation
│   └── CLASS_DIAGRAM.md   # UML class diagrams
└── README.md              # This file
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

Prerequisites: **Docker** + **Docker Compose**

```bash
# Start everything (MySQL + Backend + Frontend)
docker-compose up --build

# In development mode with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |
| API Docs (Swagger) | http://localhost:8000/api/v1/docs |
| MySQL | localhost:3306 |

Default database credentials in Docker:
- **User**: `health_user` / **Password**: `health_pass`
- **Root**: `root` / **Password**: `rootpassword`

### Option 2: Manual Setup

#### Prerequisites

- **Python 3.10+** for backend
- **Node.js 18+** for frontend
- **MySQL/MariaDB** (via WAMP Server)
- **pnpm** (recommended for frontend)

#### 1. Database Setup

1. Start WAMP Server
2. Open phpMyAdmin at http://localhost/phpmyadmin
3. Create the database and tables using the SQL script (see docs/schema.sql)

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run the server
python -m uvicorn app.main:app --reload --port 8000
```

API Documentation: http://localhost:8000/api/v1/docs

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Frontend: http://localhost:3000

## 📚 Documentation

- **API Docs**: http://localhost:8000/api/v1/docs (Swagger UI)
- **Database**: [docs/DATABASE.md](docs/DATABASE.md)
- **Class Diagram**: [docs/CLASS_DIAGRAM.md](docs/CLASS_DIAGRAM.md)

## 🔐 Security Features

- **JWT Authentication** with access and refresh tokens
- **Role-Based Access Control (RBAC)** with 6 hierarchical roles
- **Password Hashing** using bcrypt
- **Audit Logging** for all data modifications
- **CORS Protection** configured for frontend origin

## 👥 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| SUPER_ADMIN | Full system access | All |
| NATIONAL_MANAGER | National level management | National + below |
| REGION_MANAGER | Regional management | Region + below |
| DPT_MANAGER | Department management | Department + below |
| PHC_MANAGER | PHC management | PHC + below |
| CHW | Community Health Worker | Own data only |

## 🗺️ Geographic Hierarchy

```
Region
  └── Departement
        └── PHC (Primary Health Center)
              └── CHW (Community Health Worker)
```

## 📊 Campaign Types

- **VACCINATION** - Vaccination campaigns
- **DEPISTAGE** - Screening campaigns
- **SUPPLEMENTATION** - Supplementation campaigns
- **SENSIBILISATION** - Awareness campaigns
- **TRAITEMENT** - Treatment campaigns

## 🛠️ Tech Stack

### Backend
- FastAPI 0.115.0
- SQLAlchemy 2.0
- PyMySQL
- Pydantic v2
- python-jose (JWT)
- passlib (bcrypt)

### Frontend
- Next.js 16
- TypeScript
- TailwindCSS v4
- shadcn/ui
- Lucide Icons

## 📝 License

MIT License
