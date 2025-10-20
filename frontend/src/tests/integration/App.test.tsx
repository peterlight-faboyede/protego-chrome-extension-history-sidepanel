import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../sidepanel/App';

// Create a test QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderApp = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock chrome.tabs.query to return a test tab
    chrome.tabs.query = vi.fn().mockResolvedValue([{
      url: 'https://example.com',
      active: true,
      currentWindow: true,
    }]);
    
    // Mock chrome.storage.local.get
    chrome.storage.local.get = vi.fn().mockResolvedValue({});
  });

  it('should render loading state initially', async () => {
    renderApp();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render header after initialization', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('History Sidepanel')).toBeInTheDocument();
    });
  });


  it('should register chrome message listeners', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
    });
  });

  it('should cleanup listeners on unmount', async () => {
    const { unmount } = renderApp();
    
    await waitFor(() => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
    expect(chrome.tabs.onActivated.removeListener).toHaveBeenCalled();
    expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalled();
  });

  it('should display current page URL', async () => {
    chrome.tabs.query = vi.fn().mockResolvedValue([{
      url: 'https://test-page.com',
      active: true,
      currentWindow: true,
    }]);
    
    chrome.storage.local.get = vi.fn().mockResolvedValue({
      lastMetrics: {
        url: 'https://test-page.com',
        title: 'Test Page',
        description: 'Test description',
        link_count: 5,
        word_count: 100,
        image_count: 2,
      },
    });
    
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  it('should handle METRICS_UPDATED message', async () => {
    chrome.tabs.query = vi.fn().mockResolvedValue([{
      url: 'https://example.com',
      active: true,
      currentWindow: true,
    }]);
    
    renderApp();
    
    await waitFor(() => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
    
    // Get the message listener
    const listener = (chrome.runtime.onMessage.addListener as any).mock.calls[0][0];
    
    // Trigger METRICS_UPDATED message
    listener({
      type: 'METRICS_UPDATED',
      data: {
        url: 'https://example.com',
        title: 'Updated Page',
        description: 'Updated description',
        link_count: 15,
        word_count: 300,
        image_count: 8,
      },
    });
    
    await waitFor(() => {
      expect(screen.getByText('Updated Page')).toBeInTheDocument();
    });
  });

  it('should handle tab activation', async () => {
    chrome.tabs.query = vi.fn().mockResolvedValue([{
      url: 'https://example.com',
      active: true,
      currentWindow: true,
    }]);
    
    chrome.tabs.get = vi.fn().mockResolvedValue({
      url: 'https://newpage.com',
      active: true,
      currentWindow: true,
    });
    
    renderApp();
    
    await waitFor(() => {
      expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
    });
    
    // Get the tab activation listener
    const listener = (chrome.tabs.onActivated.addListener as any).mock.calls[0][0];
    
    // Trigger tab activation
    await listener({ tabId: 123, windowId: 1 });
  });

  it('should handle tab updates', async () => {
    chrome.tabs.query = vi.fn()
      .mockResolvedValueOnce([{
        url: 'https://example.com',
        active: true,
        currentWindow: true,
      }])
      .mockResolvedValueOnce([{
        id: 123,
        url: 'https://updated-page.com',
        active: true,
        currentWindow: true,
      }]);
    
    renderApp();
    
    await waitFor(() => {
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
    });
    
    // Get the tab update listener
    const listener = (chrome.tabs.onUpdated.addListener as any).mock.calls[0][0];
    
    // Trigger tab update
    listener(123, { url: 'https://updated-page.com' }, { url: 'https://updated-page.com' });
  });

  it('should send manual sync on unmount', async () => {
    const { unmount } = renderApp();
    
    await waitFor(() => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'SYNC_QUEUE' },
      expect.any(Function)
    );
  });

  it('should handle QUEUE_SYNCED message', async () => {
    chrome.tabs.query = vi.fn().mockResolvedValue([{
      url: 'https://example.com',
      active: true,
      currentWindow: true,
    }]);
    
    renderApp();
    
    await waitFor(() => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
    
    // Get the message listener
    const listener = (chrome.runtime.onMessage.addListener as any).mock.calls[0][0];
    
    // Trigger QUEUE_SYNCED message
    await listener({ type: 'QUEUE_SYNCED' });
  });

  it('should handle tab activation with chrome:// URL', async () => {
    chrome.tabs.query = vi.fn().mockResolvedValue([{
      url: 'https://example.com',
      active: true,
      currentWindow: true,
    }]);
    
    chrome.tabs.get = vi.fn().mockResolvedValue({
      url: 'chrome://settings',
      active: true,
      currentWindow: true,
    });
    
    renderApp();
    
    await waitFor(() => {
      expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
    });
    
    // Get the tab activation listener
    const listener = (chrome.tabs.onActivated.addListener as any).mock.calls[0][0];
    
    // Trigger tab activation with chrome:// URL
    await listener({ tabId: 456, windowId: 1 });
  });

  it('should handle tab update with same URL', async () => {
    chrome.tabs.query = vi.fn()
      .mockResolvedValue([{
        id: 123,
        url: 'https://example.com',
        active: true,
        currentWindow: true,
      }]);
    
    renderApp();
    
    await waitFor(() => {
      expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
    });
    
    // Get the tab update listener
    const listener = (chrome.tabs.onUpdated.addListener as any).mock.calls[0][0];
    
    // Trigger tab update with same URL
    listener(123, { url: 'https://example.com' }, { url: 'https://example.com' });
  });
});

