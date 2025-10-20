import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;
const BASE_SYNC_INTERVAL = Number(import.meta.env.VITE_QUEUE_SYNC_INTERVAL) || 10000;
const MAX_RETRY_ATTEMPTS = 5;
const MAX_BACKOFF_INTERVAL = 300000; // 5 minutes max

interface SyncState {
    failureCount: number;
    lastSyncAttempt: number;
    currentInterval: number;
    timeoutId: number | null;
}

const syncState: SyncState = {
    failureCount: 0,
    lastSyncAttempt: 0,
    currentInterval: BASE_SYNC_INTERVAL,
    timeoutId: null,
};

function calculateBackoffInterval(failureCount: number): number {
    // Exponential backoff: base * 2^failureCount, capped at MAX_BACKOFF_INTERVAL
    const backoff = BASE_SYNC_INTERVAL * Math.pow(2, failureCount);
    return Math.min(backoff, MAX_BACKOFF_INTERVAL);
}

async function syncQueuedVisits(): Promise<void> {
    const now = Date.now();
    syncState.lastSyncAttempt = now;

    const {visitQueue = []} = await chrome.storage.local.get(['visitQueue']);
    
    // Don't sync if queue is empty
    if (visitQueue.length === 0) {
        // Reset failure count on empty queue
        if (syncState.failureCount > 0) {
            syncState.failureCount = 0;
            syncState.currentInterval = BASE_SYNC_INTERVAL;
        }
        scheduleNextSync();
        return;
    }

    // Check if we've exceeded max retry attempts
    if (syncState.failureCount >= MAX_RETRY_ATTEMPTS) {
        // Wait for manual sync or longer backoff
        scheduleNextSync();
        return;
    }

    try {
        const visits = visitQueue.map(({timestamp, ...v}: any) => v);
        await axios.post(`${API_BASE_URL}/visits/batch`, visits, {
            headers: {'Content-Type': 'application/json'},
            timeout: API_TIMEOUT,
        });
        
        // Success - clear queue and reset failure count
        await chrome.storage.local.remove(['visitQueue']);
        syncState.failureCount = 0;
        syncState.currentInterval = BASE_SYNC_INTERVAL;
        
        // Notify sidepanel that sync completed
        chrome.runtime.sendMessage({type: 'QUEUE_SYNCED'}, () => {
            if (chrome.runtime.lastError) return;
        });
    } catch (err) {
        // Increment failure count and apply backoff
        syncState.failureCount++;
        syncState.currentInterval = calculateBackoffInterval(syncState.failureCount);
        
        // Only log if we haven't exceeded max retries
        if (syncState.failureCount < MAX_RETRY_ATTEMPTS) {
            if (import.meta.env.DEV) {
                console.warn(
                    `Background sync failed (attempt ${syncState.failureCount}/${MAX_RETRY_ATTEMPTS}). ` +
                    `Next retry in ${syncState.currentInterval / 1000}s`,
                    err
                );
            }
        } else {
            if (import.meta.env.DEV) {
                console.error(
                    `Background sync failed after ${MAX_RETRY_ATTEMPTS} attempts. ` +
                    `Will retry after ${syncState.currentInterval / 1000}s or on manual sync.`,
                    err
                );
            }
        }
    }
    
    scheduleNextSync();
}

function scheduleNextSync(): void {
    // Clear existing timeout
    if (syncState.timeoutId !== null) {
        clearTimeout(syncState.timeoutId);
    }
    
    // Schedule next sync with current interval (includes backoff)
    syncState.timeoutId = setTimeout(syncQueuedVisits, syncState.currentInterval) as unknown as number;
}

// Start the sync loop
scheduleNextSync();

async function getMetricsWithRetry(tabId: number, maxRetries = 3, delay = 500): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tabId, {type: 'GET_METRICS'}, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            return response;
        } catch (error: any) {
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            } else {
                throw error;
            }
        }
    }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'PAGE_METRICS') {
        chrome.storage.local.set({
            lastMetrics: message.data,
            lastUpdate: Date.now(),
        });

        chrome.runtime.sendMessage(
            {
                type: 'METRICS_UPDATED',
                data: message.data,
            },
            () => {
                if (chrome.runtime.lastError) {
                    // Side panel might not be open - this is fine
                }
            }
        );
    }

    if (message.type === 'SYNC_QUEUE') {
        // Manual sync - reset failure count to allow immediate retry
        syncState.failureCount = 0;
        syncState.currentInterval = BASE_SYNC_INTERVAL;
        
        syncQueuedVisits().then(() => {
            sendResponse({success: true});
        }).catch(() => {
            sendResponse({success: false});
        });
        return true;
    }

    return true;
});

chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({windowId: tab.windowId});
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && !tab.url.startsWith('chrome://') && tab.status === 'complete') {
        try {
            const response = await getMetricsWithRetry(activeInfo.tabId, 3, 300);

            chrome.runtime.sendMessage(
                {
                    type: 'METRICS_UPDATED',
                    data: response,
                },
                () => {
                    if (chrome.runtime.lastError) {
                        // Side panel might not be open - this is fine
                    }
                }
            );
        } catch (error: any) {
            // Content script not available even after retries - this is expected for restricted pages
        }
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        setTimeout(async () => {
            try {
                const response = await getMetricsWithRetry(tabId, 3, 400);
                chrome.runtime.sendMessage(
                    {
                        type: 'METRICS_UPDATED',
                        data: response,
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            // Side panel not listening
                        }
                    }
                );
            } catch (error: any) {
                // Content script not available after retries
            }
        }, 800);
    }
});

