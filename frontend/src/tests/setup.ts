import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Chrome API
const chromeMock = {
  runtime: {
    lastError: undefined as chrome.runtime.LastError | undefined,
    sendMessage: vi.fn((message: any, callback?: any) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn((keys: any) => Promise.resolve({})),
      set: vi.fn((items: any) => Promise.resolve()),
      remove: vi.fn((keys: any) => Promise.resolve()),
    },
  },
  tabs: {
    query: vi.fn((queryInfo: any) => Promise.resolve([])),
    get: vi.fn((tabId: number) => Promise.resolve({})),
    sendMessage: vi.fn((tabId: number, message: any, callback?: any) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  sidePanel: {
    open: vi.fn((options: any) => Promise.resolve()),
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

// @ts-ignore
global.chrome = chromeMock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds = [];
};

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:8000/api/v1',
    VITE_API_TIMEOUT: '10000',
    VITE_QUEUE_SYNC_INTERVAL: '10000',
    VITE_VISIT_RATE_LIMIT: '30000',
  },
  writable: true,
});

