import axios from 'axios';
import { BackoffCalculator } from './BackoffCalculator';

export interface SyncState {
    failureCount: number;
    lastSyncAttempt: number;
    currentInterval: number;
    timeoutId: number | null;
}

export interface SyncConfig {
    apiBaseUrl: string;
    apiTimeout: number;
    isDev: boolean;
}

export class SyncManager {
    private state: SyncState = {
        failureCount: 0,
        lastSyncAttempt: 0,
        currentInterval: 0,
        timeoutId: null,
    };

    constructor(
        private config: SyncConfig,
        private backoffCalculator: BackoffCalculator
    ) {
        this.state.currentInterval = backoffCalculator.calculateInterval(0);
    }

    async syncQueuedVisits(): Promise<void> {
        const now = Date.now();
        this.state.lastSyncAttempt = now;

        const { visitQueue = [] } = await chrome.storage.local.get(['visitQueue']);

        if (visitQueue.length === 0) {
            if (this.state.failureCount > 0) {
                this.resetState();
            }
            return;
        }

        if (!this.backoffCalculator.shouldRetry(this.state.failureCount)) {
            return;
        }

        try {
            const visits = visitQueue.map(({ timestamp, ...v }: any) => v);
            await axios.post(`${this.config.apiBaseUrl}/visits/batch`, visits, {
                headers: { 'Content-Type': 'application/json' },
                timeout: this.config.apiTimeout,
            });

            await chrome.storage.local.remove(['visitQueue']);
            this.resetState();

            chrome.runtime.sendMessage({ type: 'QUEUE_SYNCED' }, () => {
                if (chrome.runtime.lastError) return;
            });
        } catch (err) {
            this.handleSyncFailure(err);
        }
    }

    private handleSyncFailure(err: unknown): void {
        this.state.failureCount++;
        this.state.currentInterval = this.backoffCalculator.calculateInterval(
            this.state.failureCount
        );

        if (this.config.isDev) {
            const maxRetries = this.backoffCalculator.getMaxRetries();
            
            if (this.backoffCalculator.shouldRetry(this.state.failureCount)) {
                console.warn(
                    `Background sync failed (attempt ${this.state.failureCount}/${maxRetries}). ` +
                        `Next retry in ${this.state.currentInterval / 1000}s`,
                    err
                );
            } else {
                console.error(
                    `Background sync failed after ${maxRetries} attempts. ` +
                        `Will retry after ${this.state.currentInterval / 1000}s or on manual sync.`,
                    err
                );
            }
        }
    }

    private resetState(): void {
        this.state.failureCount = 0;
        this.state.currentInterval = this.backoffCalculator.calculateInterval(0);
    }

    scheduleNextSync(callback: () => void): void {
        if (this.state.timeoutId !== null) {
            clearTimeout(this.state.timeoutId);
        }

        this.state.timeoutId = setTimeout(callback, this.state.currentInterval) as unknown as number;
    }

    resetForManualSync(): void {
        this.resetState();
    }

    clearScheduledSync(): void {
        if (this.state.timeoutId !== null) {
            clearTimeout(this.state.timeoutId);
            this.state.timeoutId = null;
        }
    }

    getCurrentInterval(): number {
        return this.state.currentInterval;
    }

    getFailureCount(): number {
        return this.state.failureCount;
    }
}
