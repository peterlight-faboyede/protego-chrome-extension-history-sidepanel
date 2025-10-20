# History Sidepanel Chrome Extension

A Chrome Extension that tracks page visits, displays real-time analytics, and maintains visit history in a side panel with offline queue support.

---

## Features & Optimizations

### Core Features
- **Real-time Page Metrics**: Automatically collects and displays link count, word count, and image count
- **Visit History Tracking**: Records and displays historical page visits with timestamps
- **Aggregated Analytics**: Shows total visit counts and metrics over time
- **Offline Queue System**: Queues visits when backend is unavailable and syncs automatically
- **Rate Limiting**: Prevents duplicate visit recordings within configurable time windows
- **Responsive UI**: Modern, clean interface built with React and SCSS

### Performance Optimizations
- **Lazy Loading**: Infinite scroll with pagination for visit history
- **State Management**: Efficient Zustand store for minimal re-renders
- **Request Batching**: Batch API requests for better performance
- **Chrome Storage**: Leverages local storage for offline capabilities
- **Message Passing**: Efficient communication between extension components

### Code Quality
- **TypeScript**: Full type safety across the codebase
- **Comprehensive Testing**: **94.73% Code Coverage** with unit and integration tests
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Robust error handling with Error Boundaries and interceptors

---

## Tech Stack

### Frontend Framework
- **React 18.3** - UI library with hooks and modern patterns
- **TypeScript 5.7** - Static typing and enhanced developer experience
- **Vite 6.0** - Fast build tool and development server

### State & Data Management
- **Zustand 5.0** - Lightweight state management (no Provider needed)
- **@tanstack/react-query 5.90** - Server state management with caching
- **Axios 1.7** - HTTP client with interceptors and error handling

### Chrome Extension APIs
- **Chrome Tabs API** - Tab management and navigation tracking
- **Chrome Storage API** - Local storage for offline queue
- **Chrome Runtime API** - Message passing between components
- **Chrome Side Panel API** - Side panel UI integration

### Styling & UI
- **SCSS/Sass 1.83** - Advanced CSS with variables and nesting
- **CSS Modules** - Scoped styling for components

### Development & Testing
- **Vitest 3.2** - Fast unit test runner with ES modules support
- **@testing-library/react 16.3** - React component testing utilities
- **@testing-library/user-event 14.6** - User interaction simulation
- **MSW 2.11** - API mocking for integration tests
- **@vitest/coverage-v8** - Code coverage reporting

### Build & Tooling
- **@vitejs/plugin-react 4.3** - React integration for Vite
- **ESLint** - Code linting and quality checks
- **@types/chrome 0.0.279** - Chrome API TypeScript definitions

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **Chrome Browser** (version 109+ for Side Panel API)
- **Backend API** running on `http://localhost:8000` (see backend README)

---

## Setup Instructions

### 1. Clone and Ensure you are in the root directory
```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the frontend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=10000

# Queue Configuration
VITE_QUEUE_SYNC_INTERVAL=10000
VITE_VISIT_RATE_LIMIT=30000
```

### 4. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 5. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from this project
5. The extension icon should appear in your toolbar

### 6. Usage

1. Click the extension icon or open Chrome side panel
2. Navigate to any webpage
3. View real-time metrics and visit history in the side panel

---

## Development

### Development Mode

Run Vite development server with hot reload:

```bash
npm run dev
```

**Note**: After making changes, you must rebuild and reload the extension in Chrome:
1. Run `npm run build`
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

---

## Testing

### Test Coverage

**Current Coverage: 94.73%**

The project maintains excellent code coverage with comprehensive unit and integration tests:

| Metric | Coverage |
|--------|----------|
| **Statements** | 94.73% |
| **Branches** | 88.96% |
| **Functions** | 93.33% |
| **Lines** | 94.73% |

### Running Tests

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode (re-runs on file changes)
npm test

# Run with UI dashboard
npm run test:ui

# Generate HTML coverage report
npm run coverage
```

Coverage reports are generated in `coverage/` directory.

### Test Structure

```
src/tests/
├── setup.ts                           # Test configuration and mocks
├── mocks/
│   └── chromeMock.ts                 # Chrome API mocks
├── unit/
│   ├── config.test.ts                # Environment config tests
│   ├── client.test.ts                # API client tests
│   ├── useStore.test.ts              # State management tests
│   ├── rateLimiter.test.ts           # Rate limiter tests
│   ├── visitQueue.test.ts            # Queue system tests
│   ├── contentScript.test.ts         # Content script tests
│   ├── BackoffCalculator.test.ts     # Backoff strategy tests
│   ├── MetricsRetriever.test.ts      # Metrics retrieval tests
│   ├── SyncManager.test.ts           # Queue sync manager tests
│   ├── MessageHandler.test.ts        # Message handler tests
│   ├── TabEventHandler.test.ts       # Tab event handler tests
│   ├── Header.test.tsx               # Component tests
│   ├── PageInfo.test.tsx
│   ├── MetricsCard.test.tsx
│   ├── HistoryList.test.tsx
│   └── ErrorBoundary.test.tsx
└── integration/
    ├── App.test.tsx                  # App integration tests
    └── background.integration.test.ts # Background service integration tests
```

---

## Environment Variables

### Configuration Options

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` | Yes |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `10000` | No |
| `VITE_QUEUE_SYNC_INTERVAL` | Queue sync interval (ms) | `10000` | No |
| `VITE_VISIT_RATE_LIMIT` | Visit rate limit per URL (ms) | `30000` | No |

### Environment File Example

Create `.env` file:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=10000

# Feature Flags
VITE_QUEUE_SYNC_INTERVAL=10000     # Sync queue every 10 seconds
VITE_VISIT_RATE_LIMIT=30000        # Rate limit visits to same URL (30s)
```

### Accessing Environment Variables

Environment variables are accessed via `import.meta.env`:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

**Note**: All custom environment variables must be prefixed with `VITE_` to be exposed to the client.

---

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts              # Axios client with interceptors
│   ├── background/
│   │   ├── index.ts               # Background service entry point
│   │   ├── BackoffCalculator.ts  # Exponential backoff strategy
│   │   ├── MetricsRetriever.ts   # Metrics retrieval with retries
│   │   ├── SyncManager.ts         # Queue sync manager
│   │   ├── MessageHandler.ts     # Chrome message handler
│   │   └── TabEventHandler.ts    # Chrome tab event handler
│   ├── config/
│   │   └── env.ts                 # Environment configuration
│   ├── store/
│   │   └── useStore.ts            # Zustand state store
│   ├── utils/
│   │   ├── rateLimiter.ts         # URL rate limiting
│   │   └── visitQueue.ts          # Offline queue system
│   ├── sidepanel/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Main application component
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── PageInfo.tsx
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── HistoryList.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── styles/
│   │       ├── index.scss
│   │       └── App.scss
│   ├── tests/
│   │   ├── setup.ts               # Test configuration
│   │   ├── mocks/                 # Test mocks
│   │   ├── unit/                  # Unit tests (16 files)
│   │   └── integration/           # Integration tests (2 files)
│   └── contentScript.ts           # Page metrics collection
├── public/
├── dist/                          # Build output (gitignored)
├── coverage/                      # Test coverage reports (gitignored)
├── manifest.json                  # Chrome extension manifest
├── sidepanel.html                 # Side panel HTML template
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template
└── README.md                      # This file
```

---

## Architecture

### Component Communication Flow

```
┌─────────────────┐
│  Content Script │  (Collects page metrics)
└────────┬────────┘
         │ chrome.runtime.sendMessage()
         ▼
┌─────────────────┐
│ Background      │  (Message broker, offline queue sync)
│ Service Worker  │
└────────┬────────┘
         │ chrome.runtime.sendMessage()
         ▼
┌─────────────────┐
│   Side Panel    │  (React UI, displays metrics & history)
│   (React App)   │
└────────┬────────┘
         │ Axios HTTP
         ▼
┌─────────────────┐
│  Backend API    │  (FastAPI - stores visit data)
└─────────────────┘
```

### State Management

- **Zustand Store**: Manages current URL and page metrics
- **React Query**: Handles server state (history, metrics) with caching
- **Chrome Storage**: Persists offline queue and last known metrics

### Error Handling

- **API Interceptors**: Automatic error handling and response unwrapping
- **Offline Queue**: Queues failed requests for later sync
- **Rate Limiting**: Prevents duplicate submissions
- **Graceful Degradation**: Works offline with cached data

---

## API Integration

The extension communicates with the FastAPI backend:

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/visits/batch` | Batch create visit records |
| `GET` | `/api/v1/visits/history?url={url}&page={page}&page_size={size}` | Get paginated visit history |
| `GET` | `/api/v1/visits/metrics?url={url}` | Get aggregated metrics for URL |
| `GET` | `/health` | Health check endpoint |

### Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  error_codes?: string[];
  status_code: number;
}
```

The Axios interceptor automatically unwraps the `data` field for successful responses.

---

## Troubleshooting

### Extension Not Loading
- Ensure `dist/` folder exists (run `npm run build`)
- Check Chrome version supports Side Panel API (109+)
- Verify manifest.json is in the dist folder

### API Connection Issues
- Confirm backend is running on configured URL
- Check `.env` file has correct `VITE_API_BASE_URL`
- Verify CORS is enabled on backend

### Metrics Not Updating
- Check browser console for errors
- Ensure content script has permissions for the page
- Try reloading the extension

### Build Errors
- Delete `node_modules` and run `npm install` again
- Clear npm cache: `npm cache clean --force`
- Ensure Node.js version is 18+

---