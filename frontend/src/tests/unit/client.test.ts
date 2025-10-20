import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { visitApi, Visit, PaginatedVisits, Metrics } from '../../api/client';

const API_BASE_URL = 'http://localhost:8000/api';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('visitApi', () => {
  describe('getHistory', () => {
    it('should fetch visit history successfully', async () => {
      const mockVisits: Visit[] = [
        {
          id: 1,
          url: 'https://example.com',
          title: 'Example',
          description: 'Example site',
          datetime_visited: '2024-01-01T00:00:00Z',
          link_count: 10,
          word_count: 500,
          image_count: 5,
        },
      ];

      const mockResponse: PaginatedVisits = {
        items: mockVisits,
        total: 1,
        page: 1,
        page_size: 10,
        has_more: false,
      };

      server.use(
        http.get(`${API_BASE_URL}/visits/history`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Success',
            data: mockResponse,
            status_code: 200,
          });
        })
      );

      const result = await visitApi.getHistory('https://example.com', 1, 10);

      expect(result).toEqual(mockResponse);
      expect(result.items).toHaveLength(1);
      expect(result.has_more).toBe(false);
    });

    it('should use default pagination params', async () => {
      const mockResponse: PaginatedVisits = {
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
        has_more: false,
      };

      server.use(
        http.get(`${API_BASE_URL}/visits/history`, ({ request }) => {
          const url = new URL(request.url);
          const page = url.searchParams.get('page');
          const pageSize = url.searchParams.get('page_size');

          expect(page).toBe('1');
          expect(pageSize).toBe('10');

          return HttpResponse.json({
            success: true,
            message: 'Success',
            data: mockResponse,
            status_code: 200,
          });
        })
      );

      await visitApi.getHistory('https://example.com');
    });

    it('should handle pagination correctly', async () => {
      const mockResponse: PaginatedVisits = {
        items: [],
        total: 100,
        page: 2,
        page_size: 20,
        has_more: true,
      };

      server.use(
        http.get(`${API_BASE_URL}/visits/history`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('page')).toBe('2');
          expect(url.searchParams.get('page_size')).toBe('20');

          return HttpResponse.json({
            success: true,
            message: 'Success',
            data: mockResponse,
            status_code: 200,
          });
        })
      );

      const result = await visitApi.getHistory('https://example.com', 2, 20);
      expect(result.page).toBe(2);
      expect(result.has_more).toBe(true);
    });

    it('should handle API errors with error array', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/history`, () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Error occurred',
              errors: ['Invalid URL', 'Rate limit exceeded'],
              status_code: 400,
            },
            { status: 400 }
          );
        })
      );

      await expect(visitApi.getHistory('invalid')).rejects.toThrow('Invalid URL, Rate limit exceeded');
    });

    it('should handle API errors with message fallback', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/history`, () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Something went wrong',
              status_code: 500,
            },
            { status: 500 }
          );
        })
      );

      await expect(visitApi.getHistory('https://example.com')).rejects.toThrow('Something went wrong');
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/history`, () => {
          return HttpResponse.error();
        })
      );

      await expect(visitApi.getHistory('https://example.com')).rejects.toThrow('Network error: Unable to reach server');
    });
  });

  describe('getMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const mockMetrics: Metrics = {
        total_visits: 42,
      };

      server.use(
        http.get(`${API_BASE_URL}/visits/metrics`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Success',
            data: mockMetrics,
            status_code: 200,
          });
        })
      );

      const result = await visitApi.getMetrics('https://example.com');

      expect(result).toEqual(mockMetrics);
      expect(result.total_visits).toBe(42);
    });

    it('should pass URL as query parameter', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/metrics`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('url')).toBe('https://test.com');

          return HttpResponse.json({
            success: true,
            message: 'Success',
            data: { total_visits: 0 },
            status_code: 200,
          });
        })
      );

      await visitApi.getMetrics('https://test.com');
    });

    it('should handle zero visits', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/metrics`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Success',
            data: { total_visits: 0 },
            status_code: 200,
          });
        })
      );

      const result = await visitApi.getMetrics('https://new-site.com');
      expect(result.total_visits).toBe(0);
    });

    it('should handle API errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/metrics`, () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Unauthorized',
              status_code: 401,
            },
            { status: 401 }
          );
        })
      );

      await expect(visitApi.getMetrics('https://example.com')).rejects.toThrow('Unauthorized');
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/metrics`, () => {
          return HttpResponse.error();
        })
      );

      await expect(visitApi.getMetrics('https://example.com')).rejects.toThrow('Network error: Unable to reach server');
    });
  });

  describe('response interceptor', () => {
    it('should extract data from successful response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/metrics`, () => {
          return HttpResponse.json({
            success: true,
            message: 'Data retrieved',
            data: { total_visits: 10 },
            status_code: 200,
          });
        })
      );

      const result = await visitApi.getMetrics('https://example.com');
      expect(result).toEqual({ total_visits: 10 });
    });

    it('should handle generic error message fallback', async () => {
      server.use(
        http.get(`${API_BASE_URL}/visits/history`, () => {
          return HttpResponse.json(
            {
              success: false,
              status_code: 500,
            },
            { status: 500 }
          );
        })
      );

      await expect(visitApi.getHistory('https://example.com')).rejects.toThrow('An error occurred');
    });
  });
});

