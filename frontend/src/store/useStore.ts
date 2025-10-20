import {create} from 'zustand';

interface PageMetrics {
    url: string;
    title: string | null;
    description: string | null;
    link_count: number;
    word_count: number;
    image_count: number;
}

interface AppState {
    currentUrl: string | null;
    currentMetrics: PageMetrics | null;

    setCurrentUrl: (url: string) => void;
    setCurrentMetrics: (metrics: PageMetrics | null) => void;
    reset: () => void;
}

export const useStore = create<AppState>((set) => ({
    currentUrl: null,
    currentMetrics: null,

    setCurrentUrl: (url) => set({currentUrl: url}),
    setCurrentMetrics: (metrics) => set({currentMetrics: metrics}),
    reset: () => set({
        currentUrl: null,
        currentMetrics: null,
    }),
}));

