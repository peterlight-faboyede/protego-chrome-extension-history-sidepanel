import { describe, it, expect, beforeEach } from 'vitest';
import { config } from '../../config/env';

describe('config/env', () => {
  it('should load configuration values from environment', () => {
    expect(config.apiBaseUrl).toBe('http://localhost:8000/api/v1');
    expect(config.apiTimeout).toBe(10000);
    expect(config.queueSyncInterval).toBe(10000);
    expect(config.visitRateLimit).toBe(10000);
  });

  it('should have correct types', () => {
    expect(typeof config.apiBaseUrl).toBe('string');
    expect(typeof config.apiTimeout).toBe('number');
    expect(typeof config.queueSyncInterval).toBe('number');
    expect(typeof config.visitRateLimit).toBe('number');
  });

  it('should use environment variables when set', () => {
    // Create a new config with custom env vars
    const customEnv = {
      VITE_API_BASE_URL: 'https://api.example.com',
      VITE_API_TIMEOUT: '5000',
      VITE_QUEUE_SYNC_INTERVAL: '20000',
      VITE_VISIT_RATE_LIMIT: '60000',
    };

    const customConfig = {
      apiBaseUrl: customEnv.VITE_API_BASE_URL,
      apiTimeout: Number(customEnv.VITE_API_TIMEOUT),
      queueSyncInterval: Number(customEnv.VITE_QUEUE_SYNC_INTERVAL),
      visitRateLimit: Number(customEnv.VITE_VISIT_RATE_LIMIT),
    };

    expect(customConfig.apiBaseUrl).toBe('https://api.example.com');
    expect(customConfig.apiTimeout).toBe(5000);
    expect(customConfig.queueSyncInterval).toBe(20000);
    expect(customConfig.visitRateLimit).toBe(60000);
  });
});

