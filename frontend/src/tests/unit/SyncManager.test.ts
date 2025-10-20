import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncManager } from '../../background/SyncManager';
import { BackoffCalculator } from '../../background/BackoffCalculator';
import axios from 'axios';

vi.mock('axios');

describe('SyncManager', () => {
    let syncManager: SyncManager;
    let backoffCalculator: BackoffCalculator;
    const mockConfig = {
        apiBaseUrl: 'http://localhost:8000/api/v1',
        apiTimeout: 10000,
        isDev: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        backoffCalculator = new BackoffCalculator({
            baseInterval: 1000,
            maxInterval: 300000,
            maxRetries: 5,
        });
        syncManager = new SyncManager(mockConfig, backoffCalculator);
    });

    afterEach(() => {
        syncManager.clearScheduledSync();
    });

    describe('syncQueuedVisits', () => {
        it('should sync visits and clear queue on success', async () => {
            const mockVisits = [
                { url: 'https://example.com', title: 'Test', timestamp: Date.now() },
                { url: 'https://test.com', title: 'Test 2', timestamp: Date.now() },
            ];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.spyOn(chrome.storage.local, 'remove')
                .mockResolvedValue(undefined);
            vi.mocked(axios.post).mockResolvedValue({ data: 'success' });

            await syncManager.syncQueuedVisits();

            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:8000/api/v1/visits/batch',
                expect.arrayContaining([
                    expect.objectContaining({ url: 'https://example.com' }),
                    expect.objectContaining({ url: 'https://test.com' }),
                ]),
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                })
            );
            expect(chrome.storage.local.remove).toHaveBeenCalledWith(['visitQueue']);
            expect(syncManager.getFailureCount()).toBe(0);
        });

        it('should not sync when queue is empty', async () => {
            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: [] });

            await syncManager.syncQueuedVisits();

            expect(axios.post).not.toHaveBeenCalled();
            expect(syncManager.getFailureCount()).toBe(0);
        });

        it('should reset failure count when queue becomes empty', async () => {
            const mockVisits = [{ url: 'https://fail.com', title: 'Fail' }];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValueOnce({ visitQueue: mockVisits })
                .mockResolvedValueOnce({ visitQueue: [] });
            vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network error'));

            await syncManager.syncQueuedVisits();
            expect(syncManager.getFailureCount()).toBe(1);

            await syncManager.syncQueuedVisits();
            expect(syncManager.getFailureCount()).toBe(0);
        });

        it('should increment failure count on sync failure', async () => {
            const mockVisits = [{ url: 'https://error.com', title: 'Error' }];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.mocked(axios.post).mockRejectedValue(new Error('API Error'));

            await syncManager.syncQueuedVisits();

            expect(syncManager.getFailureCount()).toBe(1);
            expect(chrome.storage.local.remove).not.toHaveBeenCalled();
        });

        it('should apply backoff interval on failure', async () => {
            const mockVisits = [{ url: 'https://backoff.com', title: 'Backoff' }];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.mocked(axios.post).mockRejectedValue(new Error('Timeout'));

            await syncManager.syncQueuedVisits();

            expect(syncManager.getCurrentInterval()).toBe(2000);
            expect(syncManager.getFailureCount()).toBe(1);
        });

        it('should stop syncing after max retries', async () => {
            const mockVisits = [{ url: 'https://maxretries.com', title: 'Max' }];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });

            for (let i = 0; i < 5; i++) {
                vi.mocked(axios.post).mockRejectedValueOnce(new Error('Persistent error'));
                await syncManager.syncQueuedVisits();
            }

            expect(syncManager.getFailureCount()).toBe(5);

            vi.mocked(axios.post).mockClear();
            await syncManager.syncQueuedVisits();
            expect(axios.post).not.toHaveBeenCalled();
        });

        it('should send queue synced message on success', async () => {
            const mockVisits = [{ url: 'https://notify.com', title: 'Notify' }];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.spyOn(chrome.storage.local, 'remove')
                .mockResolvedValue(undefined);
            vi.mocked(axios.post).mockResolvedValue({ data: 'ok' });

            const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage');

            await syncManager.syncQueuedVisits();

            expect(sendMessageSpy).toHaveBeenCalledWith(
                { type: 'QUEUE_SYNCED' },
                expect.any(Function)
            );
        });

        it('should strip timestamp from visits before sending', async () => {
            const mockVisits = [
                { url: 'https://strip.com', title: 'Strip', timestamp: 12345 },
            ];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.spyOn(chrome.storage.local, 'remove')
                .mockResolvedValue(undefined);
            vi.mocked(axios.post).mockResolvedValue({ data: 'ok' });

            await syncManager.syncQueuedVisits();

            expect(axios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.not.arrayContaining([
                    expect.objectContaining({ timestamp: expect.anything() })
                ]),
                expect.any(Object)
            );
        });
    });

    describe('scheduleNextSync', () => {
        it('should schedule a sync with current interval', () => {
            vi.useFakeTimers();
            const callback = vi.fn();

            syncManager.scheduleNextSync(callback);
            vi.advanceTimersByTime(1000);

            expect(callback).toHaveBeenCalledTimes(1);
            vi.useRealTimers();
        });

        it('should clear previous timeout before scheduling new one', () => {
            vi.useFakeTimers();
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            syncManager.scheduleNextSync(callback1);
            syncManager.scheduleNextSync(callback2);
            vi.advanceTimersByTime(1000);

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalledTimes(1);
            vi.useRealTimers();
        });
    });

    describe('resetForManualSync', () => {
        it('should reset failure count and interval', async () => {
            const mockVisits = [{ url: 'https://reset.com', title: 'Reset' }];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.mocked(axios.post).mockRejectedValue(new Error('Error'));

            await syncManager.syncQueuedVisits();
            expect(syncManager.getFailureCount()).toBe(1);

            syncManager.resetForManualSync();

            expect(syncManager.getFailureCount()).toBe(0);
            expect(syncManager.getCurrentInterval()).toBe(1000);
        });
    });

    describe('logging in dev mode', () => {
        it('should log warnings on failure in dev mode', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const devSyncManager = new SyncManager(
                { ...mockConfig, isDev: true },
                backoffCalculator
            );

            const mockVisits = [{ url: 'https://log.com', title: 'Log' }];
            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.mocked(axios.post).mockRejectedValue(new Error('Test error'));

            await devSyncManager.syncQueuedVisits();

            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy.mock.calls[0][0]).toContain('Background sync failed');
            consoleSpy.mockRestore();
        });

        it('should log error after max retries in dev mode', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const devSyncManager = new SyncManager(
                { ...mockConfig, isDev: true },
                backoffCalculator
            );

            const mockVisits = [{ url: 'https://maxlog.com', title: 'MaxLog' }];
            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });

            for (let i = 0; i < 5; i++) {
                vi.mocked(axios.post).mockRejectedValueOnce(new Error('Max error'));
                await devSyncManager.syncQueuedVisits();
            }

            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy.mock.calls[0][0]).toContain('failed after');
            consoleSpy.mockRestore();
        });

        it('should not log in production mode', async () => {
            const consoleSpy = vi.spyOn(console, 'warn');
            const mockVisits = [{ url: 'https://prod.com', title: 'Prod' }];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.mocked(axios.post).mockRejectedValue(new Error('Prod error'));

            await syncManager.syncQueuedVisits();

            expect(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});

