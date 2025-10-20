import { vi } from 'vitest';

export const createChromeMock = () => ({
  runtime: {
    lastError: undefined as chrome.runtime.LastError | undefined,
    sendMessage: vi.fn((message: any, callback?: any) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  },
  storage: {
    local: {
      get: vi.fn((keys: any) => Promise.resolve({})),
      set: vi.fn((items: any) => Promise.resolve()),
      remove: vi.fn((keys: any) => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
  },
  tabs: {
    query: vi.fn((queryInfo: any) => Promise.resolve([])),
    get: vi.fn((tabId: number) => Promise.resolve({} as chrome.tabs.Tab)),
    sendMessage: vi.fn((tabId: number, message: any, callback?: any) => {
      if (callback) callback();
      return Promise.resolve();
    }),
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  },
  sidePanel: {
    open: vi.fn((options: any) => Promise.resolve()),
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  },
});

export const resetChromeMock = (mock: any) => {
  Object.values(mock).forEach((namespace: any) => {
    Object.values(namespace).forEach((method: any) => {
      if (method && typeof method.mockClear === 'function') {
        method.mockClear();
      }
      if (method && typeof method === 'object' && 'addListener' in method) {
        method.addListener.mockClear();
        method.removeListener.mockClear();
      }
    });
  });
};

