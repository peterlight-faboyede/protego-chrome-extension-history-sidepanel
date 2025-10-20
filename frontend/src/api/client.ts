import axios from 'axios';
import { config } from '../config/env';

export interface Visit {
    id: number;
    url: string;
    title: string | null;
    description: string | null;
    datetime_visited: string;
    link_count: number;
    word_count: number;
    image_count: number;
}

export interface PaginatedVisits {
    items: Visit[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
}

export interface Metrics {
    total_visits: number;
}

export interface VisitCreate {
    url: string;
    title?: string | null;
    description?: string | null;
    link_count: number;
    word_count: number;
    image_count: number;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors?: string[];
    error_codes?: string[];
    status_code: number;
}

const apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => {
        const apiResponse = response.data as ApiResponse<any>;
        if (apiResponse.success) {
            response.data = apiResponse.data;
        }
        return response;
    },
    (error) => {
        if (error.response?.data) {
            const apiError = error.response.data as ApiResponse<any>;
            const errorMessage = apiError.errors?.join(', ') || apiError.message || 'An error occurred';
            throw new Error(errorMessage);
        }

        if (error.request) {
            throw new Error('Network error: Unable to reach server');
        }

        throw new Error(error.message || 'Unknown error');
    }
);

export const visitApi = {
    getHistory: async (url: string, page: number = 1, page_size: number = 10): Promise<PaginatedVisits> => {
        const response = await apiClient.get<PaginatedVisits>('/visits/history', {
            params: {url, page, page_size},
        });
        return response.data;
    },

    getMetrics: async (url: string): Promise<Metrics> => {
        const response = await apiClient.get<Metrics>('/visits/metrics', {
            params: {url},
        });
        return response.data;
    },
};

