import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock setInterval to prevent actual timer
vi.stubGlobal('setInterval', vi.fn());

describe('UrlRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow adding a new URL', async () => {
    // Dynamically import to get fresh instance
    const { urlRateLimiter } = await import('../../utils/rateLimiter');
    
    const url = 'https://example.com';
    const result = urlRateLimiter.canAdd(url);
    
    expect(result).toBe(true);
  });

  it('should not allow adding the same URL within rate limit period', async () => {
    const { urlRateLimiter } = await import('../../utils/rateLimiter');
    
    const url = 'https://example2.com';
    
    urlRateLimiter.canAdd(url);
    const result = urlRateLimiter.canAdd(url);
    
    expect(result).toBe(false);
  });

  it('should allow adding the same URL after rate limit period', async () => {
    const { urlRateLimiter } = await import('../../utils/rateLimiter');
    
    const url = 'https://example3.com';
    
    urlRateLimiter.canAdd(url);
    
    // Advance time by 10 seconds (rate limit from env)
    vi.advanceTimersByTime(10000);
    
    const result = urlRateLimiter.canAdd(url);
    expect(result).toBe(true);
  });

  it('should track different URLs independently', async () => {
    const { urlRateLimiter } = await import('../../utils/rateLimiter');
    
    const url1 = 'https://example4.com';
    const url2 = 'https://example5.com';
    
    expect(urlRateLimiter.canAdd(url1)).toBe(true);
    expect(urlRateLimiter.canAdd(url2)).toBe(true);
    
    expect(urlRateLimiter.canAdd(url1)).toBe(false);
    expect(urlRateLimiter.canAdd(url2)).toBe(false);
  });

  it('should not allow adding just before rate limit expires', async () => {
    const { urlRateLimiter } = await import('../../utils/rateLimiter');
    
    const url = 'https://example6.com';
    
    urlRateLimiter.canAdd(url);
    
    // Advance time by 9 seconds (just before rate limit)
    vi.advanceTimersByTime(9000);
    
    const result = urlRateLimiter.canAdd(url);
    expect(result).toBe(false);
  });

  it('should handle cleanup gracefully', async () => {
    const { urlRateLimiter } = await import('../../utils/rateLimiter');
    
    const url = 'https://example7.com';
    
    urlRateLimiter.canAdd(url);
    
    expect(() => urlRateLimiter.cleanup()).not.toThrow();
  });

  it('should remove expired URLs during cleanup', async () => {
    const { urlRateLimiter } = await import('../../utils/rateLimiter');
    
    const url = 'https://example8.com';
    urlRateLimiter.canAdd(url);
    
    // Advance time past rate limit
    vi.advanceTimersByTime(11000);
    
    // Cleanup should remove expired entries
    urlRateLimiter.cleanup();
    
    // Should be able to add again immediately after cleanup
    const result = urlRateLimiter.canAdd(url);
    expect(result).toBe(true);
  });

  describe('Cleanup lifecycle methods', () => {
    it('should start cleanup interval on initialization', async () => {
      vi.useRealTimers();
      const setIntervalSpy = vi.spyOn(window, 'setInterval');
      
      // Force re-import to trigger constructor
      vi.resetModules();
      await import('../../utils/rateLimiter');
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
      
      setIntervalSpy.mockRestore();
      vi.useFakeTimers();
    });

    it('should stop cleanup when stopCleanup is called', async () => {
      vi.useRealTimers();
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      
      vi.resetModules();
      const { urlRateLimiter } = await import('../../utils/rateLimiter');
      
      urlRateLimiter.stopCleanup();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
      vi.useFakeTimers();
    });

    it('should restart cleanup when startCleanup is called after stop', async () => {
      vi.useRealTimers();
      const setIntervalSpy = vi.spyOn(window, 'setInterval');
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      
      vi.resetModules();
      const { urlRateLimiter } = await import('../../utils/rateLimiter');
      
      // Initial call from constructor
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      
      urlRateLimiter.stopCleanup();
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      urlRateLimiter.startCleanup();
      expect(setIntervalSpy).toHaveBeenCalledTimes(2);
      
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
      vi.useFakeTimers();
    });

    it('should not start cleanup twice if already running', async () => {
      vi.useRealTimers();
      const setIntervalSpy = vi.spyOn(window, 'setInterval');
      
      vi.resetModules();
      const { urlRateLimiter } = await import('../../utils/rateLimiter');
      
      // Initial call from constructor
      const initialCallCount = setIntervalSpy.mock.calls.length;
      
      // Try to start again
      urlRateLimiter.startCleanup();
      
      // Should not have created another interval
      expect(setIntervalSpy).toHaveBeenCalledTimes(initialCallCount);
      
      setIntervalSpy.mockRestore();
      vi.useFakeTimers();
    });

    it('should reset state and restart cleanup when reset is called', async () => {
      const { urlRateLimiter } = await import('../../utils/rateLimiter');
      
      const url1 = 'https://example-reset1.com';
      const url2 = 'https://example-reset2.com';
      
      // Add some URLs
      urlRateLimiter.canAdd(url1);
      urlRateLimiter.canAdd(url2);
      
      // Both should be rate-limited
      expect(urlRateLimiter.canAdd(url1)).toBe(false);
      expect(urlRateLimiter.canAdd(url2)).toBe(false);
      
      // Reset
      urlRateLimiter.reset();
      
      // Should be able to add again immediately
      expect(urlRateLimiter.canAdd(url1)).toBe(true);
      expect(urlRateLimiter.canAdd(url2)).toBe(true);
    });

    it('should clear all URLs on reset', async () => {
      const { urlRateLimiter } = await import('../../utils/rateLimiter');
      
      const urls = [
        'https://reset-test1.com',
        'https://reset-test2.com',
        'https://reset-test3.com',
      ];
      
      // Add multiple URLs
      urls.forEach(url => urlRateLimiter.canAdd(url));
      
      // All should be rate-limited
      urls.forEach(url => {
        expect(urlRateLimiter.canAdd(url)).toBe(false);
      });
      
      // Reset
      urlRateLimiter.reset();
      
      // All should be available again
      urls.forEach(url => {
        expect(urlRateLimiter.canAdd(url)).toBe(true);
      });
    });

    it('should handle stopCleanup when not started', async () => {
      vi.resetModules();
      const { urlRateLimiter } = await import('../../utils/rateLimiter');
      
      urlRateLimiter.stopCleanup();
      
      // Should not throw when called multiple times
      expect(() => urlRateLimiter.stopCleanup()).not.toThrow();
    });
  });
});
