export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  queueSyncInterval: Number(import.meta.env.VITE_QUEUE_SYNC_INTERVAL) || 10000,
  visitRateLimit: Number(import.meta.env.VITE_VISIT_RATE_LIMIT) || 30000,
};

