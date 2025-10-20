export interface MetricsRetryConfig {
    maxRetries: number;
    baseDelay: number;
}

export class MetricsRetriever {
    constructor(private config: MetricsRetryConfig) {}

    async getMetricsWithRetry(tabId: number): Promise<any> {
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabId, { type: 'GET_METRICS' }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });

                return response;
            } catch (error: any) {
                if (attempt < this.config.maxRetries) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.config.baseDelay * attempt)
                    );
                } else {
                    throw error;
                }
            }
        }
    }

    async sendMetricsUpdate(data: any): Promise<void> {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                {
                    type: 'METRICS_UPDATED',
                    data,
                },
                () => {
                    if (chrome.runtime.lastError) {
                        // Side panel might not be open - this is fine
                    }
                    resolve();
                }
            );
        });
    }
}
