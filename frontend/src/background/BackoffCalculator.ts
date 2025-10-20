export interface BackoffConfig {
    baseInterval: number;
    maxInterval: number;
    maxRetries: number;
}

export class BackoffCalculator {
    constructor(private config: BackoffConfig) {}

    calculateInterval(failureCount: number): number {
        const backoff = this.config.baseInterval * Math.pow(2, failureCount);
        return Math.min(backoff, this.config.maxInterval);
    }

    shouldRetry(failureCount: number): boolean {
        return failureCount < this.config.maxRetries;
    }

    getMaxRetries(): number {
        return this.config.maxRetries;
    }
}

