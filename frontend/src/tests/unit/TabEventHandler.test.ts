import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabEventHandler } from '../../background/TabEventHandler';
import { MetricsRetriever } from '../../background/MetricsRetriever';

describe('TabEventHandler', () => {
    let tabEventHandler: TabEventHandler;
    let metricsRetriever: MetricsRetriever;

    beforeEach(() => {
        vi.clearAllMocks();
        metricsRetriever = new MetricsRetriever({
            maxRetries: 3,
            baseDelay: 300,
        });
        tabEventHandler = new TabEventHandler(metricsRetriever);
    });

    describe('handleTabActivated', () => {
        it('should retrieve and send metrics when tab is complete', async () => {
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
            const mockMetrics = { scrollDepth: 50, timeOnPage: 1000 };

            vi.spyOn(chrome.tabs, 'get').mockResolvedValue(mockTab);
            vi.spyOn(metricsRetriever, 'getMetricsWithRetry')
                .mockResolvedValue(mockMetrics);
            const sendUpdateSpy = vi.spyOn(metricsRetriever, 'sendMetricsUpdate')
                .mockResolvedValue(undefined);

            await tabEventHandler.handleTabActivated({ tabId: 123, windowId: 1 });

            expect(metricsRetriever.getMetricsWithRetry).toHaveBeenCalledWith(123);
            expect(sendUpdateSpy).toHaveBeenCalledWith(mockMetrics);
        });

        it('should not retrieve metrics for chrome:// URLs', async () => {
            const mockTab: chrome.tabs.Tab = {
                id: 456,
                url: 'chrome://extensions',
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
            const getMetricsSpy = vi.spyOn(metricsRetriever, 'getMetricsWithRetry');

            await tabEventHandler.handleTabActivated({ tabId: 456, windowId: 1 });

            expect(getMetricsSpy).not.toHaveBeenCalled();
        });

        it('should not retrieve metrics when tab is not complete', async () => {
            const mockTab: chrome.tabs.Tab = {
                id: 789,
                url: 'https://loading.com',
                status: 'loading',
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
            const getMetricsSpy = vi.spyOn(metricsRetriever, 'getMetricsWithRetry');

            await tabEventHandler.handleTabActivated({ tabId: 789, windowId: 1 });

            expect(getMetricsSpy).not.toHaveBeenCalled();
        });

        it('should handle errors when retrieving metrics', async () => {
            const mockTab: chrome.tabs.Tab = {
                id: 111,
                url: 'https://error.com',
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
            vi.spyOn(metricsRetriever, 'getMetricsWithRetry')
                .mockRejectedValue(new Error('Content script not available'));
            const sendUpdateSpy = vi.spyOn(metricsRetriever, 'sendMetricsUpdate');

            await expect(
                tabEventHandler.handleTabActivated({ tabId: 111, windowId: 1 })
            ).resolves.not.toThrow();

            expect(sendUpdateSpy).not.toHaveBeenCalled();
        });

        it('should not retrieve metrics when tab has no URL', async () => {
            const mockTab: chrome.tabs.Tab = {
                id: 222,
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
            const getMetricsSpy = vi.spyOn(metricsRetriever, 'getMetricsWithRetry');

            await tabEventHandler.handleTabActivated({ tabId: 222, windowId: 1 });

            expect(getMetricsSpy).not.toHaveBeenCalled();
        });
    });

    describe('handleTabUpdated', () => {
        it('should retrieve and send metrics after delay when tab completes', async () => {
            vi.useFakeTimers();

            const mockTab: chrome.tabs.Tab = {
                id: 333,
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
            const mockMetrics = { scrollDepth: 60, timeOnPage: 2000 };

            vi.spyOn(metricsRetriever, 'getMetricsWithRetry')
                .mockResolvedValue(mockMetrics);
            const sendUpdateSpy = vi.spyOn(metricsRetriever, 'sendMetricsUpdate')
                .mockResolvedValue(undefined);

            const promise = tabEventHandler.handleTabUpdated(
                333,
                { status: 'complete' },
                mockTab
            );

            await vi.advanceTimersByTimeAsync(800);
            await promise;

            expect(metricsRetriever.getMetricsWithRetry).toHaveBeenCalledWith(333);
            expect(sendUpdateSpy).toHaveBeenCalledWith(mockMetrics);

            vi.useRealTimers();
        });

        it('should not retrieve metrics for chrome:// URLs', async () => {
            const mockTab: chrome.tabs.Tab = {
                id: 444,
                url: 'chrome://settings',
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

            const getMetricsSpy = vi.spyOn(metricsRetriever, 'getMetricsWithRetry');

            await tabEventHandler.handleTabUpdated(
                444,
                { status: 'complete' },
                mockTab
            );

            expect(getMetricsSpy).not.toHaveBeenCalled();
        });

        it('should not retrieve metrics when status is not complete', async () => {
            const mockTab: chrome.tabs.Tab = {
                id: 555,
                url: 'https://loading.com',
                status: 'loading',
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

            const getMetricsSpy = vi.spyOn(metricsRetriever, 'getMetricsWithRetry');

            await tabEventHandler.handleTabUpdated(
                555,
                { status: 'loading' },
                mockTab
            );

            expect(getMetricsSpy).not.toHaveBeenCalled();
        });

        it('should handle errors when retrieving metrics', async () => {
            vi.useFakeTimers();

            const mockTab: chrome.tabs.Tab = {
                id: 666,
                url: 'https://error.com',
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

            vi.spyOn(metricsRetriever, 'getMetricsWithRetry')
                .mockRejectedValue(new Error('Script error'));
            const sendUpdateSpy = vi.spyOn(metricsRetriever, 'sendMetricsUpdate');

            const promise = tabEventHandler.handleTabUpdated(
                666,
                { status: 'complete' },
                mockTab
            );

            await vi.advanceTimersByTimeAsync(800);
            await promise;

            expect(sendUpdateSpy).not.toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should not retrieve metrics when tab has no URL', async () => {
            const mockTab: chrome.tabs.Tab = {
                id: 777,
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

            const getMetricsSpy = vi.spyOn(metricsRetriever, 'getMetricsWithRetry');

            await tabEventHandler.handleTabUpdated(
                777,
                { status: 'complete' },
                mockTab
            );

            expect(getMetricsSpy).not.toHaveBeenCalled();
        });
    });

    describe('handleActionClicked', () => {
        it('should open side panel when action is clicked', () => {
            const mockTab: chrome.tabs.Tab = {
                id: 888,
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

            tabEventHandler.handleActionClicked(mockTab);

            expect(openSpy).toHaveBeenCalledWith({ windowId: 1 });
        });

        it('should not open side panel when windowId is missing', () => {
            const mockTab: chrome.tabs.Tab = {
                id: 999,
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

            const openSpy = vi.spyOn(chrome.sidePanel, 'open');

            tabEventHandler.handleActionClicked(mockTab);

            expect(openSpy).not.toHaveBeenCalled();
        });
    });
});

