import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store/useStore';
import { renderHook, act } from '@testing-library/react';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { reset } = useStore.getState();
    reset();
  });

  describe('initial state', () => {
    it('should have null values initially', () => {
      const { result } = renderHook(() => useStore());

      expect(result.current.currentUrl).toBeNull();
      expect(result.current.currentMetrics).toBeNull();
    });
  });

  describe('setCurrentUrl', () => {
    it('should update current URL', () => {
      const { result } = renderHook(() => useStore());
      const testUrl = 'https://example.com';

      act(() => {
        result.current.setCurrentUrl(testUrl);
      });

      expect(result.current.currentUrl).toBe(testUrl);
    });

    it('should update URL multiple times', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setCurrentUrl('https://first.com');
      });
      expect(result.current.currentUrl).toBe('https://first.com');

      act(() => {
        result.current.setCurrentUrl('https://second.com');
      });
      expect(result.current.currentUrl).toBe('https://second.com');
    });
  });

  describe('setCurrentMetrics', () => {
    it('should update current metrics', () => {
      const { result } = renderHook(() => useStore());
      const testMetrics = {
        url: 'https://example.com',
        title: 'Test Page',
        description: 'Test description',
        link_count: 10,
        word_count: 500,
        image_count: 5,
      };

      act(() => {
        result.current.setCurrentMetrics(testMetrics);
      });

      expect(result.current.currentMetrics).toEqual(testMetrics);
    });

    it('should set metrics to null', () => {
      const { result } = renderHook(() => useStore());
      const testMetrics = {
        url: 'https://example.com',
        title: 'Test Page',
        description: null,
        link_count: 10,
        word_count: 500,
        image_count: 5,
      };

      act(() => {
        result.current.setCurrentMetrics(testMetrics);
      });
      expect(result.current.currentMetrics).toEqual(testMetrics);

      act(() => {
        result.current.setCurrentMetrics(null);
      });
      expect(result.current.currentMetrics).toBeNull();
    });

    it('should handle metrics with null title and description', () => {
      const { result } = renderHook(() => useStore());
      const testMetrics = {
        url: 'https://example.com',
        title: null,
        description: null,
        link_count: 0,
        word_count: 0,
        image_count: 0,
      };

      act(() => {
        result.current.setCurrentMetrics(testMetrics);
      });

      expect(result.current.currentMetrics).toEqual(testMetrics);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useStore());

      // Set some values
      act(() => {
        result.current.setCurrentUrl('https://example.com');
        result.current.setCurrentMetrics({
          url: 'https://example.com',
          title: 'Test',
          description: 'Test desc',
          link_count: 10,
          word_count: 100,
          image_count: 5,
        });
      });

      expect(result.current.currentUrl).not.toBeNull();
      expect(result.current.currentMetrics).not.toBeNull();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentUrl).toBeNull();
      expect(result.current.currentMetrics).toBeNull();
    });

    it('should be idempotent', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.reset();
        result.current.reset();
      });

      expect(result.current.currentUrl).toBeNull();
      expect(result.current.currentMetrics).toBeNull();
    });
  });

  describe('store integration', () => {
    it('should maintain state across hook instances', () => {
      const { result: result1 } = renderHook(() => useStore());
      
      act(() => {
        result1.current.setCurrentUrl('https://shared.com');
      });

      const { result: result2 } = renderHook(() => useStore());
      
      expect(result2.current.currentUrl).toBe('https://shared.com');
    });

    it('should update all subscribers when state changes', () => {
      const { result: result1 } = renderHook(() => useStore());
      const { result: result2 } = renderHook(() => useStore());

      act(() => {
        result1.current.setCurrentUrl('https://test.com');
      });

      expect(result1.current.currentUrl).toBe('https://test.com');
      expect(result2.current.currentUrl).toBe('https://test.com');
    });
  });
});

