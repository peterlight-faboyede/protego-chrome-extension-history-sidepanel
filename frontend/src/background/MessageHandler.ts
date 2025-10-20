import { SyncManager } from './SyncManager';

export class MessageHandler {
    constructor(private syncManager: SyncManager) {}

    handleMessage(
        message: any,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
    ): boolean {
        if (message.type === 'PAGE_METRICS') {
            this.handlePageMetrics(message.data);
            return true;
        }

        if (message.type === 'SYNC_QUEUE') {
            this.handleSyncQueue(sendResponse);
            return true;
        }

        return true;
    }

    private handlePageMetrics(data: any): void {
        chrome.storage.local.set({
            lastMetrics: data,
            lastUpdate: Date.now(),
        });

        chrome.runtime.sendMessage(
            {
                type: 'METRICS_UPDATED',
                data,
            },
            () => {
                if (chrome.runtime.lastError) {
                    // Side panel might not be open - this is fine
                }
            }
        );
    }

    private handleSyncQueue(sendResponse: (response?: any) => void): void {
        this.syncManager.resetForManualSync();

        this.syncManager.syncQueuedVisits()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(() => {
                sendResponse({ success: false });
            });
    }
}
