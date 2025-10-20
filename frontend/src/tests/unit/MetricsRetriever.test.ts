import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsRetriever } from '../../background/MetricsRetriever';

describe('MetricsRetriever', () => {
    let retriever: MetricsRetriever;

    beforeEach(() => {
        vi.clearAllMocks();
        retriever = new MetricsRetriever({
            maxRetries: 3,
            baseDelay: 100,
        });
    });

    describe('getMetricsWithRetry', () => {
        it('should return metrics on first successful attempt', async () => {
            const mockResponse = { scrollDepth: 50, timeOnPage: 1000 };
            const sendMessageSpy = vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    callback(mockResponse);
                });

            const result = await retriever.getMetricsWithRetry(123);

            expect(result).toEqual(mockResponse);
            expect(sendMessageSpy).toHaveBeenCalledTimes(1);
            expect(sendMessageSpy).toHaveBeenCalledWith(
                123,
                { type: 'GET_METRICS' },
                expect.any(Function)
            );
        });

        it('should retry on failure and succeed', async () => {
            const mockResponse = { scrollDepth: 75, timeOnPage: 2000 };
            let attemptCount = 0;
            
            const sendMessageSpy = vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    attemptCount++;
                    if (attemptCount < 2) {
                        chrome.runtime.lastError = { message: 'Connection failed' };
                    } else {
                        chrome.runtime.lastError = undefined;
                    }
                    callback(attemptCount < 2 ? undefined : mockResponse);
                });

            const result = await retriever.getMetricsWithRetry(456);

            expect(result).toEqual(mockResponse);
            expect(sendMessageSpy).toHaveBeenCalledTimes(2);
        });

        it('should throw error after max retries', async () => {
            const sendMessageSpy = vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    chrome.runtime.lastError = { message: 'Persistent error' };
                    callback(undefined);
                });

            await expect(retriever.getMetricsWithRetry(789))
                .rejects.toThrow();

            expect(sendMessageSpy).toHaveBeenCalledTimes(3);
        });

        it('should apply increasing delay between retries', async () => {
            vi.useFakeTimers();
            const sendMessageSpy = vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    chrome.runtime.lastError = { message: 'Error' };
                    callback(undefined);
                });

            const promise = retriever.getMetricsWithRetry(111);

            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(200);

            await expect(promise).rejects.toThrow();
            expect(sendMessageSpy).toHaveBeenCalledTimes(3);

            vi.useRealTimers();
        });
    });

    describe('sendMetricsUpdate', () => {
        it('should send metrics update message', async () => {
            const mockData = { scrollDepth: 90, timeOnPage: 3000 };
            const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((message, callback: any) => {
                    callback();
                    return Promise.resolve();
                });

            await retriever.sendMetricsUpdate(mockData);

            expect(sendMessageSpy).toHaveBeenCalledWith(
                {
                    type: 'METRICS_UPDATED',
                    data: mockData,
                },
                expect.any(Function)
            );
        });

        it('should handle runtime errors gracefully', async () => {
            const mockData = { scrollDepth: 60 };
            const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage')
                .mockImplementation((message, callback: any) => {
                    chrome.runtime.lastError = { message: 'No receiver' };
                    callback();
                    return Promise.resolve();
                });

            await expect(retriever.sendMetricsUpdate(mockData))
                .resolves.toBeUndefined();

            expect(sendMessageSpy).toHaveBeenCalled();
        });
    });

    describe('custom retry config', () => {
        it('should respect custom maxRetries', async () => {
            const customRetriever = new MetricsRetriever({
                maxRetries: 5,
                baseDelay: 50,
            });

            const sendMessageSpy = vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    chrome.runtime.lastError = { message: 'Error' };
                    callback(undefined);
                });

            await expect(customRetriever.getMetricsWithRetry(999))
                .rejects.toThrow();

            expect(sendMessageSpy).toHaveBeenCalledTimes(5);
        });

        it('should use custom baseDelay for retry timing', async () => {
            vi.useFakeTimers();
            
            const customRetriever = new MetricsRetriever({
                maxRetries: 2,
                baseDelay: 200,
            });

            const sendMessageSpy = vi.spyOn(chrome.tabs, 'sendMessage')
                .mockImplementation((tabId, message, callback: any) => {
                    chrome.runtime.lastError = { message: 'Error' };
                    callback(undefined);
                });

            const promise = customRetriever.getMetricsWithRetry(888);

            await vi.advanceTimersByTimeAsync(200);

            await expect(promise).rejects.toThrow();
            expect(sendMessageSpy).toHaveBeenCalledTimes(2);

            vi.useRealTimers();
        });
    });
});

