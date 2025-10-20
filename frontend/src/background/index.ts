import { BackoffCalculator } from './BackoffCalculator';
import { SyncManager } from './SyncManager';
import { MetricsRetriever } from './MetricsRetriever';
import { MessageHandler } from './MessageHandler';
import { TabEventHandler } from './TabEventHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;
const BASE_SYNC_INTERVAL = Number(import.meta.env.VITE_QUEUE_SYNC_INTERVAL) || 10000;
const MAX_RETRY_ATTEMPTS = 5;
const MAX_BACKOFF_INTERVAL = 300000;

const backoffCalculator = new BackoffCalculator({
    baseInterval: BASE_SYNC_INTERVAL,
    maxInterval: MAX_BACKOFF_INTERVAL,
    maxRetries: MAX_RETRY_ATTEMPTS,
});

const syncManager = new SyncManager(
    {
        apiBaseUrl: API_BASE_URL,
        apiTimeout: API_TIMEOUT,
        isDev: import.meta.env.DEV,
    },
    backoffCalculator
);

const metricsRetriever = new MetricsRetriever({
    maxRetries: 3,
    baseDelay: 300,
});

const messageHandler = new MessageHandler(syncManager);
const tabEventHandler = new TabEventHandler(metricsRetriever);

function scheduleSyncLoop(): void {
    syncManager.scheduleNextSync(() => {
        syncManager.syncQueuedVisits().then(() => {
            scheduleSyncLoop();
        });
    });
}

scheduleSyncLoop();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
    messageHandler.handleMessage(message, sender, sendResponse)
);

chrome.action.onClicked.addListener((tab) => tabEventHandler.handleActionClicked(tab));

chrome.tabs.onActivated.addListener((activeInfo) =>
    tabEventHandler.handleTabActivated(activeInfo)
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
    tabEventHandler.handleTabUpdated(tabId, changeInfo, tab)
);

export { BackoffCalculator, SyncManager, MetricsRetriever, MessageHandler, TabEventHandler };

