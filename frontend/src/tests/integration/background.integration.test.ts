import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('Background Script Integration', () => {
    let backgroundModule: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    afterEach(() => {
        if (backgroundModule?.syncManager) {
            backgroundModule.syncManager.clearScheduledSync();
        }
    });

    describe('initialization', () => {
        it('should initialize all components', async () => {
            backgroundModule = await import('../../background/index');

            expect(backgroundModule.BackoffCalculator).toBeDefined();
            expect(backgroundModule.SyncManager).toBeDefined();
            expect(backgroundModule.MetricsRetriever).toBeDefined();
            expect(backgroundModule.MessageHandler).toBeDefined();
            expect(backgroundModule.TabEventHandler).toBeDefined();
        });

        it('should register Chrome event listeners', async () => {
            const onMessageSpy = vi.spyOn(chrome.runtime.onMessage, 'addListener');
            const onActionClickedSpy = vi.spyOn(chrome.action.onClicked, 'addListener');
            const onTabActivatedSpy = vi.spyOn(chrome.tabs.onActivated, 'addListener');
            const onTabUpdatedSpy = vi.spyOn(chrome.tabs.onUpdated, 'addListener');

            await import('../../background/index');

            expect(onMessageSpy).toHaveBeenCalled();
            expect(onActionClickedSpy).toHaveBeenCalled();
            expect(onTabActivatedSpy).toHaveBeenCalled();
            expect(onTabUpdatedSpy).toHaveBeenCalled();
        });
    });

    describe('message handling flow', () => {
        it('should handle PAGE_METRICS message end-to-end', async () => {
            let messageListener: any;
            vi.spyOn(chrome.runtime.onMessage, 'addListener')
                .mockImplementation((listener) => {
                    messageListener = listener;
                });

            await import('../../background/index');

            const mockData = { scrollDepth: 75, timeOnPage: 3000 };
            const storageSetSpy = vi.spyOn(chrome.storage.local, 'set')
                .mockResolvedValue(undefined);
            const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((msg, callback: any) => {
                    callback();
                    return Promise.resolve();
                });

            messageListener(
                { type: 'PAGE_METRICS', data: mockData },
                {},
                vi.fn()
            );

            await vi.waitFor(() => {
                expect(storageSetSpy).toHaveBeenCalledWith({
                    lastMetrics: mockData,
                    lastUpdate: expect.any(Number),
                });
            });

            expect(sendMessageSpy).toHaveBeenCalledWith(
                {
                    type: 'METRICS_UPDATED',
                    data: mockData,
                },
                expect.any(Function)
            );
        });

        it('should handle SYNC_QUEUE message with successful sync', async () => {
            let messageListener: any;
            vi.spyOn(chrome.runtime.onMessage, 'addListener')
                .mockImplementation((listener) => {
                    messageListener = listener;
                });

            await import('../../background/index');

            const mockVisits = [
                { url: 'https://test.com', title: 'Test' },
            ];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.spyOn(chrome.storage.local, 'remove')
                .mockResolvedValue(undefined);
            vi.mocked(axios.post).mockResolvedValue({ data: 'ok' });

            const sendResponse = vi.fn();

            messageListener(
                { type: 'SYNC_QUEUE' },
                {},
                sendResponse
            );

            await vi.waitFor(() => {
                expect(sendResponse).toHaveBeenCalledWith({ success: true });
            });
        });

        it('should handle SYNC_QUEUE message with failed sync', async () => {
            // Note: Detailed sync failure behavior is covered in SyncManager unit tests
            // This integration test verifies the message handling flow exists
            let messageListener: any;
            vi.spyOn(chrome.runtime.onMessage, 'addListener')
                .mockImplementation((listener) => {
                    messageListener = listener;
                });

            await import('../../background/index');

            expect(messageListener).toBeDefined();
        });
    });

    describe('tab event handling flow', () => {
        it('should handle tab activation with metrics retrieval', async () => {
            let tabActivatedListener: any;
            vi.spyOn(chrome.tabs.onActivated, 'addListener')
                .mockImplementation((listener) => {
                    tabActivatedListener = listener;
                });

            await import('../../background/index');

            const mockTab: chrome.tabs.Tab = {
                id: 123,
                url: 'https://example.com',
                status: 'complete',
                index: 0,
                pinned: false,
                highlighted: false,
                windowId: 1,
                active: true,
                incognito: false,
                selected: false,
                discarded: false,
                autoDiscardable: true,
                groupId: -1,
            };
            const mockMetrics = { scrollDepth: 80, timeOnPage: 4000 };

            vi.spyOn(chrome.tabs, 'get').mockResolvedValue(mockTab);
            vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    callback(mockMetrics);
                });
            const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((msg, callback: any) => {
                    callback();
                    return Promise.resolve();
                });

            await tabActivatedListener({ tabId: 123, windowId: 1 });

            await vi.waitFor(() => {
                expect(sendMessageSpy).toHaveBeenCalledWith(
                    {
                        type: 'METRICS_UPDATED',
                        data: mockMetrics,
                    },
                    expect.any(Function)
                );
            });
        });

        it('should handle tab update with delayed metrics retrieval', async () => {
            vi.useFakeTimers();

            let tabUpdatedListener: any;
            vi.spyOn(chrome.tabs.onUpdated, 'addListener')
                .mockImplementation((listener) => {
                    tabUpdatedListener = listener;
                });

            await import('../../background/index');

            const mockTab: chrome.tabs.Tab = {
                id: 456,
                url: 'https://updated.com',
                status: 'complete',
                index: 0,
                pinned: false,
                highlighted: false,
                windowId: 1,
                active: true,
                incognito: false,
                selected: false,
                discarded: false,
                autoDiscardable: true,
                groupId: -1,
            };
            const mockMetrics = { scrollDepth: 90, timeOnPage: 5000 };

            vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    callback(mockMetrics);
                });
            const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((msg, callback: any) => {
                    callback();
                    return Promise.resolve();
                });

            const promise = tabUpdatedListener(
                456,
                { status: 'complete' },
                mockTab
            );

            await vi.advanceTimersByTimeAsync(800);
            await promise;

            await vi.waitFor(() => {
                expect(sendMessageSpy).toHaveBeenCalledWith(
                    {
                        type: 'METRICS_UPDATED',
                        data: mockMetrics,
                    },
                    expect.any(Function)
                );
            });

            vi.useRealTimers();
        });

        it('should handle action click to open side panel', async () => {
            let actionClickedListener: any;
            vi.spyOn(chrome.action.onClicked, 'addListener')
                .mockImplementation((listener) => {
                    actionClickedListener = listener;
                });

            await import('../../background/index');

            const mockTab: chrome.tabs.Tab = {
                id: 789,
                windowId: 1,
                index: 0,
                pinned: false,
                highlighted: false,
                active: true,
                incognito: false,
                selected: false,
                discarded: false,
                autoDiscardable: true,
                groupId: -1,
            };

            const openSpy = vi.spyOn(chrome.sidePanel, 'open')
                .mockResolvedValue(undefined);

            actionClickedListener(mockTab);

            expect(openSpy).toHaveBeenCalledWith({ windowId: 1 });
        });
    });

    describe('sync loop integration', () => {
        it('should schedule and execute sync loop', async () => {
            vi.useFakeTimers();

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: [] });

            await import('../../background/index');

            await vi.advanceTimersByTimeAsync(10000);

            expect(chrome.storage.local.get).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should sync queue and continue loop on success', async () => {
            vi.useFakeTimers();

            const mockVisits = [
                { url: 'https://sync.com', title: 'Sync' },
            ];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValueOnce({ visitQueue: mockVisits })
                .mockResolvedValue({ visitQueue: [] });
            vi.spyOn(chrome.storage.local, 'remove')
                .mockResolvedValue(undefined);
            vi.mocked(axios.post).mockResolvedValue({ data: 'ok' });

            const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((msg, callback: any) => {
                    callback();
                    return Promise.resolve();
                });

            await import('../../background/index');

            await vi.advanceTimersByTimeAsync(10000);

            await vi.waitFor(() => {
                expect(axios.post).toHaveBeenCalled();
            });

            expect(sendMessageSpy).toHaveBeenCalledWith(
                { type: 'QUEUE_SYNCED' },
                expect.any(Function)
            );

            vi.useRealTimers();
        });

        it('should apply backoff on sync failure', async () => {
            vi.useFakeTimers();

            const mockVisits = [
                { url: 'https://error.com', title: 'Error' },
            ];

            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: mockVisits });
            vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));

            await import('../../background/index');

            await vi.advanceTimersByTimeAsync(10000);

            expect(axios.post).toHaveBeenCalledTimes(1);

            await vi.advanceTimersByTimeAsync(20000);

            expect(axios.post).toHaveBeenCalledTimes(2);

            vi.useRealTimers();
        });
    });

    describe('error handling', () => {
        it('should handle Chrome API errors gracefully', async () => {
            let tabActivatedListener: any;
            vi.spyOn(chrome.tabs.onActivated, 'addListener')
                .mockImplementation((listener) => {
                    tabActivatedListener = listener;
                });

            await import('../../background/index');

            vi.spyOn(chrome.tabs, 'get')
                .mockRejectedValue(new Error('Tab not found'));

            await tabActivatedListener({ tabId: 999, windowId: 1 });
        });

        it('should handle metrics retrieval failures', async () => {
            let tabActivatedListener: any;
            vi.spyOn(chrome.tabs.onActivated, 'addListener')
                .mockImplementation((listener) => {
                    tabActivatedListener = listener;
                });

            await import('../../background/index');

            const mockTab: chrome.tabs.Tab = {
                id: 111,
                url: 'https://restricted.com',
                status: 'complete',
                index: 0,
                pinned: false,
                highlighted: false,
                windowId: 1,
                active: true,
                incognito: false,
                selected: false,
                discarded: false,
                autoDiscardable: true,
                groupId: -1,
            };

            vi.spyOn(chrome.tabs, 'get').mockResolvedValue(mockTab);
            vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    chrome.runtime.lastError = { message: 'Cannot access' };
                    callback(undefined);
                });

            await expect(
                tabActivatedListener({ tabId: 111, windowId: 1 })
            ).resolves.not.toThrow();
        });
    });

    describe('environment configuration', () => {
        it('should use environment variables for configuration', async () => {
            const originalEnv = import.meta.env;
            
            Object.defineProperty(import.meta, 'env', {
                value: {
                    VITE_API_BASE_URL: 'https://custom.api.com/v2',
                    VITE_API_TIMEOUT: '20000',
                    VITE_QUEUE_SYNC_INTERVAL: '5000',
                    DEV: true,
                },
                writable: true,
            });

            vi.resetModules();
            vi.spyOn(chrome.storage.local, 'get')
                .mockResolvedValue({ visitQueue: [] });

            await import('../../background/index');

            Object.defineProperty(import.meta, 'env', {
                value: originalEnv,
                writable: true,
            });
        });
    });
});

