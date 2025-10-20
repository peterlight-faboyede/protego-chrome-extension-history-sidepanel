# History Sidepanel Chrome Extension

A full-stack Chrome Extension that tracks page visits, displays real-time analytics, and maintains visit history with offline support.

![Coverage](https://img.shields.io/badge/Coverage-Frontend%2094.37%25%20%7C%20Backend%2094.35%25-brightgreen)
![Tests](https://img.shields.io/badge/Tests-188%20Passing-success)

---

## Screenshots

### Extension in Action

<div align="center">
  <img src="screenshots/Screenshot - UHCprovider.com - 1.png" alt="Side Panel View - Page Metrics" width="800"/>
  <p><em>Side panel showing real-time page metrics and visit history for UHCprovider.com</em></p>
</div>

<div align="center">
  <img src="screenshots/Screenshot - UHCprovider.com - 2.png" alt="Visit History" width="800"/>
  <p><em>Side panel showing real-time page metrics and visit history for UHCprovider.com - Infinite Scroll</em></p>
</div>

<div align="center">
  <img src="screenshots/Screenshot - Ustekinumab - Medical Clinical Policy Bulletins | Aetna.png" alt="Analytics View" width="800"/>
  <p><em>Side panel showing real-time page metrics and visit history for Ustekinumab - Medical Clinical Policy Bulletins | Aetna</em></p>
</div>

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Docker & Docker Compose** (for backend)
- **Chrome Browser** 109+ (for Side Panel API support)

### 1. Start the Backend

```bash
cd backend
make up
make migration  # Enter "initial migration" when prompted
make migrate
```

Backend API: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

**[Full Backend Documentation →](backend/README.md)**

### 2. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

**[Full Frontend Documentation →](frontend/README.md)**

### 3. Load Extension in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `frontend/dist/` folder
5. Click the extension icon to open the side panel

---

## Project Structure

```
chrome_extension/
├── backend/              # FastAPI backend (Python)
│   ├── api/             # API routes and schemas
│   ├── core/            # App configuration
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── repositories/    # Data access layer
│   ├── tests/           # Test suite (94.35% coverage)
│   └── docker-compose.yml
│
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── background.ts    # Service worker
│   │   ├── contentScript.ts # Page metrics collector
│   │   ├── sidepanel/       # React UI
│   │   ├── store/           # State management
│   │   ├── utils/           # Rate limiter, queue
│   │   └── tests/           # Test suite (94.37% coverage)
│   ├── dist/           # Build output (load this in Chrome)
│   └── manifest.json
│
└── README.md           # This file
```

---

## Key Features

### Backend (FastAPI + PostgreSQL)
- RESTful API with clean 3-layer architecture
- Database migrations with Alembic
- Rate limiting & security headers
- Comprehensive test suite (42 tests)
- Docker containerization
- Structured logging

### Frontend (React + Chrome Extension)
- Real-time page metrics collection
- Visit history with infinite scroll
- Offline queue with auto-sync
- Exponential backoff on sync failures
- Rate limiting to prevent duplicates
- Error boundaries for crash recovery
- Comprehensive test suite (146 tests)

---

## Development

### Backend Development

```bash
cd backend

# View logs
make logs-api

# Run tests
make test

# Run tests with coverage
make coverage

# Access database
make db-shell
```

### Frontend Development

```bash
cd frontend

# Development mode (with hot reload)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run coverage

# After changes, rebuild and reload extension:
npm run build
# Then go to chrome://extensions/ and click refresh icon
```

---

## Testing

| Component | Coverage | Tests |
|-----------|----------|-------|
| **Frontend** | 94.37% | 146 passing |
| **Backend** | 94.35% | 42 passing |
| **Total** | **94.36%** | **188 passing** |

### Run All Tests

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && make test
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Extension                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Content Script  │  Background     │     Side Panel          │
│ (Metrics)       │  (Sync Queue)   │     (React UI)          │
└────────┬────────┴────────┬────────┴─────────┬───────────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │ HTTP/REST
                           ▼
                ┌──────────────────────┐
                │   FastAPI Backend    │
                ├──────────────────────┤
                │  API → Service → Repo│
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   PostgreSQL DB      │
                └──────────────────────┘
```

---

## Configuration

### Backend Configuration
Configure via `backend/docker-compose.yml`:
- Database credentials
- Port mappings (default: 8000)

### Frontend Configuration
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000
VITE_QUEUE_SYNC_INTERVAL=10000
VITE_VISIT_RATE_LIMIT=30000
```

---

## Troubleshooting

### Backend Issues
- **Port 8000 in use**: Change port in `docker-compose.yml`
- **Database connection failed**: Check Docker containers with `make ps`
- **Migrations error**: Run `make clean-all` then `make up`

### Frontend Issues
- **Extension not loading**: Ensure `dist/` folder exists (`npm run build`)
- **API connection error**: Verify backend is running on `http://localhost:8000`
- **Metrics not updating**: Check browser console for errors

### Extension Issues
- **Side panel not opening**: Chrome version must be 109+
- **Content script errors**: Some pages (chrome://) don't allow scripts

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/visits` | Create visit record |
| `POST` | `/api/visits/batch` | Batch create visits |
| `GET` | `/api/visits/history` | Get visit history (paginated) |
| `GET` | `/api/visits/metrics` | Get aggregated metrics |

Full API documentation: `http://localhost:8000/docs`
---

## License

MIT License - See individual component READMEs for details.

---

## Support

For detailed documentation:
- **Backend**: See [backend/README.md](backend/README.md)
- **Frontend**: See [frontend/README.md](frontend/README.md)

---

**Built with FastAPI, React, TypeScript, and Docker**

