import {useEffect, useState} from 'react';
import {useQuery, useInfiniteQuery, useQueryClient} from '@tanstack/react-query';
import {useStore} from '../store/useStore';
import {visitApi, Visit} from '../api/client';
import {visitQueue} from '../utils/visitQueue';
import {urlRateLimiter} from '../utils/rateLimiter';
import MetricsCard from './components/MetricsCard';
import HistoryList from './components/HistoryList';
import Header from './components/Header';
import PageInfo from './components/PageInfo';
import './styles/App.scss';

function App() {
    const {currentUrl, currentMetrics, setCurrentUrl, setCurrentMetrics, reset} = useStore();
    const [initialized, setInitialized] = useState(false);
    const [queuedVisits, setQueuedVisits] = useState<Visit[]>([]);
    const [queueCount, setQueueCount] = useState(0);
    const queryClient = useQueryClient();

    const loadQueuedVisits = async () => {
        const currentUrl = useStore.getState().currentUrl;
        if (!currentUrl) return;
        const queued = await visitQueue.getByUrl(currentUrl);
        setQueuedVisits(queued.map((v, idx) => ({
            id: -idx - 1,
            url: v.url,
            title: v.title ?? null,
            description: v.description ?? null,
            datetime_visited: new Date(v.timestamp).toISOString(),
            link_count: v.link_count,
            word_count: v.word_count,
            image_count: v.image_count,
        })));
        setQueueCount(queued.length);
    };

    const triggerManualSync = () => {
        chrome.runtime.sendMessage({type: 'SYNC_QUEUE'}, () => {
            if (chrome.runtime.lastError) return;
        });
    };

    const {data: metricsData} = useQuery({
        queryKey: ['metrics', currentUrl, queueCount],
        queryFn: async () => {
            const data = await visitApi.getMetrics(currentUrl!);
            return {total_visits: data.total_visits + queueCount};
        },
        enabled: !!currentUrl && currentUrl !== '' && !currentUrl.startsWith('chrome://') && initialized,
    });

    const {
        data: historyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: historyLoading,
        error: historyError,
    } = useInfiniteQuery({
        queryKey: ['history', currentUrl],
        queryFn: ({pageParam = 1}) => visitApi.getHistory(currentUrl!, pageParam, 10),
        enabled: !!currentUrl && currentUrl !== '' && !currentUrl.startsWith('chrome://') && initialized,
        getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });

    useEffect(() => {
        if (currentUrl && initialized) {
            loadQueuedVisits();
        }
    }, [currentUrl, initialized]);

    useEffect(() => {
        const loadCurrentTab = async () => {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

            if (tab.url && !tab.url.startsWith('chrome://')) {
                setCurrentUrl(tab.url);

                const stored = await chrome.storage.local.get(['lastMetrics']);

                if (stored.lastMetrics && stored.lastMetrics.url === tab.url) {
                    setCurrentMetrics(stored.lastMetrics);
                }
            }
            setInitialized(true);
        };

        loadCurrentTab();

        const messageListener = async (message: any) => {
            if (message.type === 'QUEUE_SYNCED') {
                queryClient.invalidateQueries({queryKey: ['history']});
                queryClient.invalidateQueries({queryKey: ['metrics']});
                await loadQueuedVisits();
                return;
            }
            if (message.type === 'METRICS_UPDATED') {
                setCurrentMetrics(message.data);
                if (urlRateLimiter.canAdd(message.data.url)) {
                    await visitQueue.add({
                        url: message.data.url,
                        title: message.data.title,
                        description: message.data.description,
                        link_count: message.data.link_count,
                        word_count: message.data.word_count,
                        image_count: message.data.image_count,
                    });
                    await loadQueuedVisits();
                }
            }
        };

        const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
            const tab = await chrome.tabs.get(activeInfo.tabId);

            if (tab.url && !tab.url.startsWith('chrome://')) {
                const latestUrl = useStore.getState().currentUrl;
                if (tab.url !== latestUrl) {
                    setCurrentUrl(tab.url);
                    setCurrentMetrics(null);
                }
            } else {
                reset();
            }
        };

        const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, _tab: chrome.tabs.Tab) => {
            if (changeInfo.url) {
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    if (tabs[0]?.id === tabId && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
                        const latestUrl = useStore.getState().currentUrl;
                        if (tabs[0]?.url !== latestUrl) {
                            setCurrentUrl(tabs[0].url);
                            setCurrentMetrics(null);
                        }
                    } else {
                        reset();
                    }
                });
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onUpdated.addListener(handleTabUpdated);

        return () => {
            triggerManualSync();
            chrome.runtime.onMessage.removeListener(messageListener);
            chrome.tabs.onActivated.removeListener(handleTabActivated);
            chrome.tabs.onUpdated.removeListener(handleTabUpdated);
        };
    }, []);

    const backendHistory = historyData?.pages.flatMap((page) => page.items) ?? [];
    const allHistory = [...queuedVisits, ...backendHistory];
    const isLoading = historyLoading;
    const error = historyError?.message;

    if (!initialized) {
        return (
            <div className="app">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (!currentUrl || currentUrl.startsWith('chrome://')) {
        return (
            <div className="app">
                <Header/>
                <div className="empty-state">
                    <p>Navigate to a webpage to see its history and metrics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <Header/>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                </div>
            )}

            {isLoading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    {currentMetrics && (
                        <PageInfo
                            title={currentMetrics.title}
                            description={currentMetrics.description}
                            url={currentUrl!}
                        />
                    )}
                    <MetricsCard
                        currentMetrics={currentMetrics}
                        aggregatedMetrics={metricsData ?? null}
                    />
                    <HistoryList
                        history={allHistory}
                        hasMore={hasNextPage ?? false}
                        loading={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                    />
                </>
            )}
        </div>
    );
}

export default App;

