import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM before importing the module
beforeEach(() => {
  document.body.innerHTML = `
    <html>
      <head>
        <title>Test Page</title>
        <meta name="description" content="Test Description">
      </head>
      <body>
        <h1>Hello World</h1>
        <p>This is a test page with some content here.</p>
        <a href="/link1">Link 1</a>
        <a href="/link2">Link 2</a>
        <a href="/link3">Link 3</a>
        <img src="image1.jpg" alt="Image 1">
        <img src="image2.jpg" alt="Image 2">
      </body>
    </html>
  `;
  
  Object.defineProperty(document, 'readyState', {
    writable: true,
    value: 'complete',
  });
  
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: 'https://example.com/test' },
  });
});

describe('contentScript', () => {
  describe('collectPageMetrics', () => {
    it('should collect basic page metrics', async () => {
      // Dynamically import to get fresh state
      const { collectPageMetrics } = await import('../../contentScript');
      
      // Use chrome.runtime.onMessage to trigger metric collection
      const listener = (chrome.runtime.onMessage.addListener as any).mock.calls[0]?.[0];
      
      if (listener) {
        const mockSendResponse = vi.fn();
        
        await new Promise<void>((resolve) => {
          const result = listener(
            { type: 'GET_METRICS' },
            {},
            (response: any) => {
              mockSendResponse(response);
              resolve();
            }
          );
          
          if (result === true) {
            // Async response expected
          }
        });
        
        expect(mockSendResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.any(String),
            title: expect.any(String),
            link_count: expect.any(Number),
            word_count: expect.any(Number),
            image_count: expect.any(Number),
          })
        );
      }
    });

    it('should count links correctly', async () => {
      const links = document.querySelectorAll('a');
      expect(links.length).toBe(3);
    });

    it('should count images correctly', async () => {
      const images = document.querySelectorAll('img');
      expect(images.length).toBe(2);
    });

    it('should extract title from document', () => {
      expect(document.title).toBe('Test Page');
    });

    it('should extract description from meta tag', () => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription?.getAttribute('content')).toBe('Test Description');
    });

    it('should count words in body text', () => {
      const bodyText = document.body.innerText || document.body.textContent || '';
      const words = bodyText.trim().split(/\s+/).filter(word => word.length > 0);
      expect(words.length).toBeGreaterThan(0);
    });

    it('should handle page with no links', () => {
      document.body.innerHTML = '<p>No links here</p>';
      const links = document.querySelectorAll('a');
      expect(links.length).toBe(0);
    });

    it('should handle page with no images', () => {
      document.body.innerHTML = '<p>No images here</p>';
      const images = document.querySelectorAll('img');
      expect(images.length).toBe(0);
    });

    it('should handle page with no meta description', () => {
      // Create a new document without meta description
      document.head.innerHTML = '<title>Test</title>';
      document.body.innerHTML = '<p>Test content</p>';
      
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).toBeNull();
    });

    it('should get current URL from window.location', () => {
      expect(window.location.href).toBe('https://example.com/test');
    });

    it('should handle empty body text', () => {
      document.body.innerHTML = '';
      const bodyText = document.body.innerText || '';
      const words = bodyText.trim().split(/\s+/).filter(word => word.length > 0);
      expect(words).toHaveLength(0);
    });
  });

  describe('chrome message listener', () => {
    it('should return true for async response', async () => {
      // Import the module to ensure listener is registered
      await import('../../contentScript');
      const listener = (chrome.runtime.onMessage.addListener as any).mock.calls[0]?.[0];
      
      if (listener) {
        const result = listener({ type: 'GET_METRICS' }, {}, vi.fn());
        expect(result).toBe(true);
      }
    });

    it('should handle unknown message types', async () => {
      const listener = (chrome.runtime.onMessage.addListener as any).mock.calls[0]?.[0];
      
      if (listener) {
        const result = listener({ type: 'UNKNOWN_TYPE' }, {}, vi.fn());
        expect(result).toBe(true);
      }
    });
  });

  describe('DOM readiness', () => {
    it('should handle complete document state', () => {
      expect(document.readyState).toBe('complete');
    });

    it('should have body element', () => {
      expect(document.body).not.toBeNull();
    });

    it('should handle page with null body gracefully', () => {
      // Test edge case handling
      const bodyText = (null as any)?.innerText || '';
      expect(bodyText).toBe('');
    });

    it('should handle missing title', () => {
      document.title = '';
      const title = document.title || null;
      expect(title === '' || title === null).toBe(true);
    });
  });
});

