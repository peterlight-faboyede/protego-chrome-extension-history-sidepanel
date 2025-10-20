/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_QUEUE_SYNC_INTERVAL: string;
  readonly VITE_VISIT_RATE_LIMIT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

