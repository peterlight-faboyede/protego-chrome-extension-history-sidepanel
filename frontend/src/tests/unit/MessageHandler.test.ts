import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageHandler } from '../../background/MessageHandler';
import { SyncManager } from '../../background/SyncManager';
import { BackoffCalculator } from '../../background/BackoffCalculator';

describe('MessageHandler', () => {
    let messageHandler: MessageHandler;
    let syncManager: SyncManager;

    beforeEach(() => {
        vi.clearAllMocks();
        const backoffCalculator = new BackoffCalculator({
            baseInterval: 1000,
            maxInterval: 300000,
            maxRetries: 5,
        });
        syncManager = new SyncManager(
            {
                apiBaseUrl: 'http://localhost:8000/api/v1',
                apiTimeout: 10000,
                isDev: false,
            },
            backoffCalculator
        );
        messageHandler = new MessageHandler(syncManager);
    });

    describe('handleMessage', () => {
        it('should handle PAGE_METRICS message', () => {
            const mockData = { scrollDepth: 50, timeOnPage: 1000 };
            const message = { type: 'PAGE_METRICS', data: mockData };
            const sendResponse = vi.fn();

            const storageSetSpy = vi.spyOn(chrome.storage.local, 'set')
                .mockResolvedValue(undefined);
            const runtimeSendSpy = vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((msg, callback: any) => {
                    callback();
                    return Promise.resolve();
                });

            const result = messageHandler.handleMessage(message, {}, sendResponse);

            expect(result).toBe(true);
            expect(storageSetSpy).toHaveBeenCalledWith({
                lastMetrics: mockData,
                lastUpdate: expect.any(Number),
            });
            expect(runtimeSendSpy).toHaveBeenCalledWith(
                {
                    type: 'METRICS_UPDATED',
                    data: mockData,
                },
                expect.any(Function)
            );
        });

        it('should handle SYNC_QUEUE message and respond with success', async () => {
            const message = { type: 'SYNC_QUEUE' };
            const sendResponse = vi.fn();

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: [] });
            vi.spyOn(syncManager, 'resetForManualSync');
            vi.spyOn(syncManager, 'syncQueuedVisits')
                .mockResolvedValue(undefined);

            const result = messageHandler.handleMessage(message, {}, sendResponse);

            expect(result).toBe(true);
            expect(syncManager.resetForManualSync).toHaveBeenCalled();

            await vi.waitFor(() => {
                expect(sendResponse).toHaveBeenCalledWith({ success: true });
            });
        });

        it('should handle SYNC_QUEUE message and respond with failure', async () => {
            const message = { type: 'SYNC_QUEUE' };
            const sendResponse = vi.fn();

            vi.spyOn(syncManager, 'resetForManualSync');
            vi.spyOn(syncManager, 'syncQueuedVisits')
                .mockRejectedValue(new Error('Sync failed'));

            const result = messageHandler.handleMessage(message, {}, sendResponse);

            expect(result).toBe(true);

            await vi.waitFor(() => {
                expect(sendResponse).toHaveBeenCalledWith({ success: false });
            });
        });

        it('should handle unknown message types', () => {
            const message = { type: 'UNKNOWN_MESSAGE' };
            const sendResponse = vi.fn();

            const result = messageHandler.handleMessage(message, {}, sendResponse);

            expect(result).toBe(true);
        });

        it('should handle runtime errors when sending metrics update', () => {
            const mockData = { scrollDepth: 75 };
            const message = { type: 'PAGE_METRICS', data: mockData };
            const sendResponse = vi.fn();

            vi.spyOn(chrome.storage.local, 'set')
                .mockResolvedValue(undefined);
            vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((msg, callback: any) => {
                    chrome.runtime.lastError = { message: 'No receiver' };
                    callback();
                    return Promise.resolve();
                });

            expect(() => {
                messageHandler.handleMessage(message, {}, sendResponse);
            }).not.toThrow();
        });

        it('should store correct timestamp with metrics', () => {
            const mockData = { scrollDepth: 90 };
            const message = { type: 'PAGE_METRICS', data: mockData };
            const sendResponse = vi.fn();
            const now = Date.now();

            vi.spyOn(Date, 'now').mockReturnValue(now);
            const storageSetSpy = vi.spyOn(chrome.storage.local, 'set')
                .mockResolvedValue(undefined);

            messageHandler.handleMessage(message, {}, sendResponse);

            expect(storageSetSpy).toHaveBeenCalledWith({
                lastMetrics: mockData,
                lastUpdate: now,
            });
        });
    });

    describe('message sender handling', () => {
        it('should accept message from any sender', () => {
            const message = { type: 'PAGE_METRICS', data: {} };
            const sender = { id: 'ext-123', url: 'https://example.com' };
            const sendResponse = vi.fn();

            vi.spyOn(chrome.storage.local, 'set')
                .mockResolvedValue(undefined);
            vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((msg, callback: any) => {
                    callback();
                    return Promise.resolve();
                });

            const result = messageHandler.handleMessage(message, sender, sendResponse);

            expect(result).toBe(true);
        });
    });
});

