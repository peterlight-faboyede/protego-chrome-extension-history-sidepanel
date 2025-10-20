# History Sidepanel Backend

FastAPI backend for Chrome Extension History Sidepanel.

## Features & Optimizations

### Core Features
- **RESTful API** - Visit tracking with history, metrics, and health endpoints
- **Clean Architecture** - 3-layer separation (API/Service/Repository)
- **Database Migrations** - Alembic for schema version control
- **Rate Limiting** - Built-in protection (100 req/min default)
- **CORS Support** - Configured for cross-origin requests
- **Structured Logging** - Request/response tracking with timing
- **Security Headers** - HSTS, XSS Protection, Content Security Policy
- **Error Handling** - Standardized response format with custom exception handlers
- **Health Monitoring** - Uptime tracking and service status endpoint

### Development & Testing
- **Comprehensive Tests** - Unit and integration test suites (pytest)
- **Code Coverage** - **96% Coverage** with HTML reports
- **Makefile Commands** - Simplified Docker and test operations
- **Docker Optimization** - Multi-stage builds with .dockerignore
- **Hot Reload** - Auto-restart on code changes in development

## Architecture

Clean 3-layer architecture:
- **API Layer**: FastAPI routes, request/response validation, middleware
- **Service Layer**: Business logic and orchestration
- **Repository Layer**: Database operations and queries


## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Initial Setup

```bash
# CD to project directory
cd backend

# Start services
make up

# Create and apply initial migration (if needed)
make migration    # Enter "initial migration" when prompted
make migrate

# Or use docker-compose directly:
docker compose up -d
docker compose exec api alembic revision --autogenerate -m "initial migration"
docker compose exec api alembic upgrade head
```

API will be available at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

## Project Structure

```
backend/
├── alembic/
│   ├── env.py                     # Alembic configuration
│   ├── script.py.mako             # Migration template
│   └── versions/                  # Migration files
│       └── f0d834f79e2d_initial_migration.py
├── api/
│   ├── __init__.py
│   ├── response.py                # Standardized response wrapper
│   ├── schemas.py                 # Pydantic request/response models
│   └── routes/
│       ├── __init__.py
│       ├── health.py              # Health check endpoint
│       └── visits.py              # Visit tracking endpoints
├── core/
│   ├── __init__.py
│   ├── app.py                     # FastAPI application factory
│   ├── config.py                  # Configuration and settings
│   ├── exceptions.py              # Custom exception handlers
│   └── lifespan.py                # Application lifecycle management
├── db/
│   ├── __init__.py
│   └── session.py                 # Database session management
├── middleware/
│   ├── __init__.py
│   ├── logging.py                 # Request/response logging
│   └── security.py                # Security headers middleware
├── models/
│   ├── __init__.py
│   └── visit.py                   # SQLAlchemy Visit model
├── repositories/
│   ├── __init__.py
│   └── visit_repository.py        # Database operations layer
├── services/
│   ├── __init__.py
│   └── visit_service.py           # Business logic layer
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Pytest fixtures and configuration
│   ├── unit/
│   │   ├── test_config.py
│   │   ├── test_repositories.py
│   │   ├── test_response.py
│   │   ├── test_schemas.py
│   │   └── test_services.py
│   └── integration/
│       ├── test_health_api.py
│       └── test_visits_api.py
├── utils/
│   ├── __init__.py
│   └── logger.py                  # Custom logging utilities
├── alembic.ini                    # Alembic configuration file
├── docker-compose.yml             # Docker services configuration
├── Dockerfile                     # Multi-stage Docker build
├── main.py                        # Application entry point
├── Makefile                       # Development commands
├── pytest.ini                     # Pytest configuration
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

### Directory Descriptions

- **alembic/**: Database migration management with version control
- **api/**: HTTP layer with routes, schemas, and response formatting
- **core/**: Application core configuration and lifecycle
- **db/**: Database connection and session management
- **middleware/**: Request/response processing middleware
- **models/**: SQLAlchemy ORM models (database tables)
- **repositories/**: Data access layer (CRUD operations)
- **services/**: Business logic layer (orchestration)
- **tests/**: Comprehensive test suite (unit + integration)
- **utils/**: Shared utilities and helper functions

## Environment Variables

### Configuration Options

The backend uses environment variables for configuration. These are set in `docker-compose.yml` and can be overridden.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/history_db` | Yes |
| `POSTGRES_USER` | PostgreSQL username | `postgres` | Yes (Docker only) |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` | Yes (Docker only) |
| `POSTGRES_DB` | PostgreSQL database name | `history_db` | Yes (Docker only) |

### Docker Compose Configuration

The `docker-compose.yml` file contains all environment variables:

```yaml
services:
  db:
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: history_db
    ports:
      - "5433:5432"  # External:Internal port mapping

  api:
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/history_db
    ports:
      - "8000:8000"
```

### Custom Configuration

To override default values, you can:

1. **Modify docker-compose.yml** (for development):
```yaml
api:
  environment:
    DATABASE_URL: postgresql://custom_user:custom_pass@db:5432/custom_db
```

2. **Use .env file** (create in backend directory):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/history_db
```

3. **Set environment variables directly** (for local development):
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/history_db"
python -m uvicorn main:app --reload
```

### Database Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Example:
```
postgresql://postgres:postgres@localhost:5432/history_db
```

**Note**: The backend uses `python-decouple` to read environment variables, with fallback to defaults.

---

## Database Migrations

### Create a Migration

When you make changes to models:

```bash
make migration    # Prompts for description
# Or:
docker compose exec api alembic revision --autogenerate -m "description"
```

### Apply Migrations

```bash
make migrate
# Or:
docker compose exec api alembic upgrade head
```

### Rollback Migrations

```bash
docker compose exec api alembic downgrade -1    # Rollback last
docker compose exec api alembic downgrade base  # Rollback all
```

### View Migration Status

```bash
docker compose exec api alembic current   # Current version
docker compose exec api alembic history   # Migration history
```

### Fresh Start (Development)

Reset everything:

```bash
make clean-all    # Remove containers, volumes, images
make up           # Start fresh
make migration    # Create initial migration
make migrate      # Apply migrations
```

## API Endpoints

### GET /health
Service health check with uptime tracking

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": "0:05:23"
  }
}
```

### POST /api/v1/visits
Create a new page visit record

**Request Body:**
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "description": "Example site description",
  "link_count": 10,
  "word_count": 500,
  "image_count": 5
}
```

### POST /api/v1/visits/batch
Batch create multiple visit records

**Request Body:**
```json
[
  {
    "url": "https://example.com",
    "title": "Example Domain",
    "description": "Example site description",
    "link_count": 10,
    "word_count": 500,
    "image_count": 5
  }
]
```

### GET /api/v1/visits/history?url={url}&page={page}&page_size={size}
Get paginated visit history for a specific URL

**Query Parameters:**
- `url` (required): Page URL
- `page` (optional, default: 1): Page number
- `page_size` (optional, default: 10, max: 100): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "page_size": 10,
    "has_more": true
  }
}
```

### GET /api/v1/visits/metrics?url={url}
Get aggregated metrics for a specific URL

**Response:**
```json
{
  "success": true,
  "data": {
    "link_count": 10,
    "word_count": 500,
    "image_count": 5,
    "total_visits": 25,
    "avg_link_count": 12.5,
    "avg_word_count": 550.0,
    "avg_image_count": 6.2
  }
}
```

## Makefile Commands

Convenient shortcuts for common tasks:

```bash
# Start/Stop
make up                # Start all services
make down              # Stop all services
make restart           # Restart services
make rebuild           # Rebuild from scratch

# Development
make logs              # View all logs
make logs-api          # View API logs only
make shell             # Open shell in API container
make db-shell          # Open PostgreSQL shell

# Testing
make test              # Run all tests
make test-unit         # Run unit tests only
make test-integration  # Run integration tests only
make coverage          # Run tests with coverage report

# Database
make migrate           # Apply migrations
make migration         # Create new migration (prompts for message)

# Cleanup
make clean             # Remove test artifacts
make clean-all         # Remove containers, volumes, and images
```

## Testing

### Test Coverage

**Current Coverage: 96%**

The project maintains excellent code coverage with comprehensive test suites:

| Metric | Coverage |
|--------|----------|
| **Overall Coverage** | 96% |
| **Statements** | 375 total, 15 missed |
| **Test Files** | 59 tests passing |

### Test Suite Structure

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **Coverage Reports**: HTML and terminal output for code coverage

Run tests using Makefile commands or Docker Compose directly:

```bash
# Using Makefile (recommended)
make test              # All tests with fresh build
make coverage          # Tests with coverage report

# Using Docker Compose directly
docker compose run --rm api pytest -v
docker compose run --rm api pytest tests/unit/ -v
```

## Database Schema

### visits
- `id`: Primary key
- `url`: Page URL (indexed)
- `title`: Page title
- `description`: Page meta description
- `datetime_visited`: Visit timestamp (timezone-aware UTC)
- `link_count`: Number of links on page
- `word_count`: Number of words on page
- `image_count`: Number of images on page

## Development

### View Logs
```bash
make logs          # All logs
make logs-api      # API only
```

### Access Database
```bash
make db-shell
# Or directly:
docker compose exec db psql -U postgres -d history_db
```

### Run Alembic Commands Locally

If you want to run migrations from your host machine:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/history_db"
alembic upgrade head
alembic history
```
