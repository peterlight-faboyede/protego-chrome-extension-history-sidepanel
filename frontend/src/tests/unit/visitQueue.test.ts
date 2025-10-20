import { describe, it, expect, beforeEach, vi } from 'vitest';
import { visitQueue } from '../../utils/visitQueue';
import type { VisitCreate } from '../../api/client';

describe('visitQueue', () => {
  const mockVisit: VisitCreate = {
    url: 'https://example.com',
    title: 'Example Site',
    description: 'Example description',
    link_count: 10,
    word_count: 500,
    image_count: 5,
  };

  beforeEach(() => {
    // Clear storage before each test
    chrome.storage.local.get = vi.fn((keys: any) => Promise.resolve({ visitQueue: [] }));
    chrome.storage.local.set = vi.fn(() => Promise.resolve());
    chrome.storage.local.remove = vi.fn(() => Promise.resolve());
  });

  describe('add', () => {
    it('should add a visit to empty queue', async () => {
      let savedQueue: any[] = [];
      
      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: [] }));
      chrome.storage.local.set = vi.fn((items: any) => {
        savedQueue = items.visitQueue;
        return Promise.resolve();
      });

      await visitQueue.add(mockVisit);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        visitQueue: expect.arrayContaining([
          expect.objectContaining({
            ...mockVisit,
            timestamp: expect.any(Number),
          }),
        ]),
      });
    });

    it('should add visit with timestamp', async () => {
      let savedQueue: any[] = [];
      
      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: [] }));
      chrome.storage.local.set = vi.fn((items: any) => {
        savedQueue = items.visitQueue;
        return Promise.resolve();
      });

      const beforeAdd = Date.now();
      await visitQueue.add(mockVisit);

      expect(savedQueue[0]).toHaveProperty('timestamp');
      expect(savedQueue[0].timestamp).toBeGreaterThanOrEqual(beforeAdd);
    });

    it('should append to existing queue', async () => {
      const existingVisit = { ...mockVisit, url: 'https://existing.com', timestamp: Date.now() };
      
      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: [existingVisit] }));
      chrome.storage.local.set = vi.fn(() => Promise.resolve());

      await visitQueue.add(mockVisit);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        visitQueue: expect.arrayContaining([
          existingVisit,
          expect.objectContaining(mockVisit),
        ]),
      });
    });
  });

  describe('getAll', () => {
    it('should return empty array when queue is empty', async () => {
      chrome.storage.local.get = vi.fn(() => Promise.resolve({}));

      const result = await visitQueue.getAll();

      expect(result).toEqual([]);
    });

    it('should return all visits in queue', async () => {
      const visits = [
        { ...mockVisit, timestamp: Date.now() },
        { ...mockVisit, url: 'https://example2.com', timestamp: Date.now() },
      ];

      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: visits }));

      const result = await visitQueue.getAll();

      expect(result).toEqual(visits);
      expect(result.length).toBe(2);
    });
  });

  describe('getByUrl', () => {
    it('should return visits matching URL', async () => {
      const targetUrl = 'https://example.com';
      const visits = [
        { ...mockVisit, url: targetUrl, timestamp: Date.now() },
        { ...mockVisit, url: 'https://other.com', timestamp: Date.now() },
        { ...mockVisit, url: targetUrl, timestamp: Date.now() + 1000 },
      ];

      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: visits }));

      const result = await visitQueue.getByUrl(targetUrl);

      expect(result).toHaveLength(2);
      expect(result.every(v => v.url === targetUrl)).toBe(true);
    });

    it('should return empty array when no matching URLs', async () => {
      const visits = [
        { ...mockVisit, url: 'https://other.com', timestamp: Date.now() },
      ];

      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: visits }));

      const result = await visitQueue.getByUrl('https://notfound.com');

      expect(result).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove entire queue when no count specified', async () => {
      await visitQueue.clear();

      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['visitQueue']);
    });

    it('should remove first N items when count specified', async () => {
      const visits = [
        { ...mockVisit, url: 'https://1.com', timestamp: Date.now() },
        { ...mockVisit, url: 'https://2.com', timestamp: Date.now() },
        { ...mockVisit, url: 'https://3.com', timestamp: Date.now() },
      ];

      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: visits }));
      chrome.storage.local.set = vi.fn(() => Promise.resolve());

      await visitQueue.clear(2);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        visitQueue: [visits[2]],
      });
    });

    it('should handle clearing more items than exist', async () => {
      const visits = [
        { ...mockVisit, timestamp: Date.now() },
      ];

      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: visits }));
      chrome.storage.local.set = vi.fn(() => Promise.resolve());

      await visitQueue.clear(5);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        visitQueue: [],
      });
    });
  });

  describe('count', () => {
    it('should return 0 for empty queue', async () => {
      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: [] }));

      const result = await visitQueue.count();

      expect(result).toBe(0);
    });

    it('should return correct count', async () => {
      const visits = [
        { ...mockVisit, timestamp: Date.now() },
        { ...mockVisit, timestamp: Date.now() },
        { ...mockVisit, timestamp: Date.now() },
      ];

      chrome.storage.local.get = vi.fn(() => Promise.resolve({ visitQueue: visits }));

      const result = await visitQueue.count();

      expect(result).toBe(3);
    });
  });
});

