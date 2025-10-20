const RATE_LIMIT = Number(import.meta.env.VITE_VISIT_RATE_LIMIT) || 30000;
const CLEANUP_INTERVAL = 60000; // 1 minute

class UrlRateLimiter {
    private lastVisitTime: Map<string, number> = new Map();
    private cleanupIntervalId: number | null = null;

    constructor() {
        this.startCleanup();
    }

    canAdd(url: string): boolean {
        const now = Date.now();
        const lastTime = this.lastVisitTime.get(url);

        if (!lastTime || now - lastTime >= RATE_LIMIT) {
            this.lastVisitTime.set(url, now);
            return true;
        }

        return false;
    }

    cleanup(): void {
        const now = Date.now();
        for (const [url, timestamp] of this.lastVisitTime.entries()) {
            if (now - timestamp >= RATE_LIMIT) {
                this.lastVisitTime.delete(url);
            }
        }
    }

    startCleanup(): void {
        if (this.cleanupIntervalId !== null) {
            return; // Already started
        }
        this.cleanupIntervalId = window.setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
    }

    stopCleanup(): void {
        if (this.cleanupIntervalId !== null) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
        }
    }

    reset(): void {
        this.stopCleanup();
        this.lastVisitTime.clear();
        this.startCleanup();
    }
}

export const urlRateLimiter = new UrlRateLimiter();

