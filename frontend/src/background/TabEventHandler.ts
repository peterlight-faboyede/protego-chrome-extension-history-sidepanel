import { MetricsRetriever } from './MetricsRetriever';

export class TabEventHandler {
    constructor(private metricsRetriever: MetricsRetriever) {}

    async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): Promise<void> {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (tab.url && !tab.url.startsWith('chrome://') && tab.status === 'complete') {
                try {
                    const response = await this.metricsRetriever.getMetricsWithRetry(activeInfo.tabId);
                    await this.metricsRetriever.sendMetricsUpdate(response);
                } catch (error: any) {
                    // Content script not available even after retries - this is expected for restricted pages
                }
            }
        } catch (error: any) {
            // Tab not found or other Chrome API errors - this is expected for closed tabs
        }
    }

    async handleTabUpdated(
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab
    ): Promise<void> {
        if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
            setTimeout(async () => {
                try {
                    const response = await this.metricsRetriever.getMetricsWithRetry(tabId);
                    await this.metricsRetriever.sendMetricsUpdate(response);
                } catch (error: any) {
                    // Content script not available after retries
                }
            }, 800);
        }
    }

    handleActionClicked(tab: chrome.tabs.Tab): void {
        if (tab.windowId) {
            chrome.sidePanel.open({ windowId: tab.windowId });
        }
    }
}
