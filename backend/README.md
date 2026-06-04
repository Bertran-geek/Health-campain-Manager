# Health Campaign Manager - Backend API

A FastAPI-based REST API for managing health campaigns, geographic hierarchies, and user authentication.

## Features

- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Role-Based Access Control (RBAC)**: Hierarchical roles from Super Admin to CHW
- **Geographic Hierarchy**: Manage Regions → Departments → PHCs → CHWs
- **Campaign Management**: Create and manage health campaigns with molecule tracking
- **Audit Logging**: Complete audit trail for all data modifications
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation

## Tech Stack

- **Framework**: FastAPI 0.111.0
- **Database**: MySQL/MariaDB via SQLAlchemy ORM
- **Authentication**: JWT (python-jose) + bcrypt password hashing
- **Validation**: Pydantic v2

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.py      # Authentication routes
│   │   │   ├── users.py     # User management
│   │   │   ├── geography.py # Geographic entities
│   │   │   ├── campaigns.py # Campaign management
│   │   │   └── audit.py     # Audit logs
│   │   ├── deps.py          # Dependencies (auth, db)
│   │   └── router.py        # Main router
│   ├── core/
│   │   ├── config.py        # Application settings
│   │   ├── database.py      # Database connection
│   │   └── security.py      # JWT & password utilities
│   ├── models/
│   │   └── models.py        # SQLAlchemy ORM models
│   ├── schemas/
│   │   ├── auth.py          # Auth request/response schemas
│   │   ├── user.py          # User schemas
│   │   ├── geography.py     # Geographic schemas
│   │   ├── campaign.py      # Campaign schemas
│   │   └── audit.py         # Audit schemas
│   ├── services/
│   │   └── audit_service.py # Audit logging service
│   └── main.py              # Application entry point
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables
└── README.md
```

## Installation

### Prerequisites

- Python 3.10+
- MySQL/MariaDB (via WAMP Server)
- pip or pipenv

### Setup

1. **Create virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your settings
   # DATABASE_URL=mysql+pymysql://root:@localhost:3306/health_campaign_manager
   ```

4. **Create database**:
   - Open phpMyAdmin at http://localhost/phpmyadmin
   - Run the SQL script to create tables (see docs/DATABASE.md)

5. **Run the server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once running, access the API documentation at:

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login and get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user info |
| POST | `/api/v1/auth/change-password` | Change password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/{id}` | Get user by ID |
| POST | `/api/v1/users` | Create user |
| PUT | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Delete user |
| GET | `/api/v1/users/roles` | List all roles |

### Geography
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/regions` | List/Create regions |
| GET/PUT/DELETE | `/api/v1/regions/{id}` | CRUD region |
| GET/POST | `/api/v1/departements` | List/Create departments |
| GET/PUT/DELETE | `/api/v1/departements/{id}` | CRUD department |
| GET/POST | `/api/v1/phcs` | List/Create PHCs |
| GET/PUT/DELETE | `/api/v1/phcs/{id}` | CRUD PHC |
| GET/POST | `/api/v1/chws` | List/Create CHWs |
| GET/PUT/DELETE | `/api/v1/chws/{id}` | CRUD CHW |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/campaigns` | List/Create campaigns |
| GET/PUT/DELETE | `/api/v1/campaigns/{id}` | CRUD campaign |
| GET | `/api/v1/campaigns/{id}/stats` | Campaign statistics |
| GET/POST | `/api/v1/molecules` | List/Create molecules |
| GET/PUT/DELETE | `/api/v1/molecules/{id}` | CRUD molecule |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/audit` | List audit logs |
| GET | `/api/v1/audit/tables` | List audited tables |
| GET | `/api/v1/audit/actions` | List audit actions |

## Security

### Password Requirements
- Minimum 8 characters
- Hashed using bcrypt with cost factor 12

### JWT Tokens
- Access token expires in 30 minutes (configurable)
- Refresh token expires in 7 days (configurable)
- Tokens include user roles for authorization

### Role Hierarchy
1. **SUPER_ADMIN**: Full system access
2. **NATIONAL_MANAGER**: National level + below
3. **REGION_MANAGER**: Regional level + below
4. **DPT_MANAGER**: Department level + below
5. **PHC_MANAGER**: PHC level + below
6. **CHW**: Community Health Worker access

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql+pymysql://root:@localhost:3306/health_campaign_manager` |
| `SECRET_KEY` | JWT signing key | (change in production!) |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |
| `DEBUG` | Debug mode | `True` |

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## License

MIT License
