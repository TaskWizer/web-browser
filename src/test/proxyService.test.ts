import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchThroughProxy, canUseDirectIframe } from '../../services/proxyService';

// Mock fetch globally
global.fetch = vi.fn();

describe('ProxyService Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SSRF Protection', () => {
    it('should block localhost URLs', async () => {
      const result = await fetchThroughProxy('http://localhost:3000');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Blocked by SSRF policy: localhost not allowed');
    });

    it('should block 127.0.0.1 URLs', async () => {
      const result = await fetchThroughProxy('http://127.0.0.1:8080');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Blocked by SSRF policy: private/special IP literal not allowed');
    });

    it('should block private IP ranges', async () => {
      const testCases = [
        'http://10.0.0.1',
        'http://192.168.1.1',
        'http://172.16.0.1',
        'http://169.254.169.254'
      ];

      for (const url of testCases) {
        const result = await fetchThroughProxy(url);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Blocked by SSRF policy');
      }
    });

    it('should allow public HTTP URLs', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('<html><body>Test</body></html>')
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await fetchThroughProxy('http://example.com');
      expect(result.success).toBe(true);
      expect(result.html).toContain('Test');
    });

    it('should allow public HTTPS URLs', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('<html><body>Test</body></html>')
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await fetchThroughProxy('https://example.com');
      expect(result.success).toBe(true);
      expect(result.html).toContain('Test');
    });

    it('should block non-HTTP/HTTPS protocols', async () => {
      const testCases = [
        'ftp://example.com',
        'file:///etc/passwd',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
      ];

      for (const url of testCases) {
        const result = await fetchThroughProxy(url);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Blocked by SSRF policy: scheme not allowed');
      }
    });

    it('should handle invalid URLs', async () => {
      const result = await fetchThroughProxy('not-a-valid-url');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL provided');
    });
  });

  describe('Content Security', () => {
    it('should sanitize HTML content from proxy', async () => {
      const maliciousHtml = '<script>alert("XSS")</script><div>Safe content</div>';
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          success: true,
          html: maliciousHtml
        })
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await fetchThroughProxy('http://example.com');
      expect(result.success).toBe(true);
      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('Safe content');
    });

    it('should rewrite URLs to go through proxy', async () => {
      const htmlWithLinks = '<a href="http://example.com/page">Link</a>';
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          success: true,
          html: htmlWithLinks
        })
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await fetchThroughProxy('http://example.com');
      expect(result.success).toBe(true);
      expect(result.html).toContain('proxy?url=');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch timeouts', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('AbortError'));

      const result = await fetchThroughProxy('http://example.com', { timeout: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch through proxy');
    });

    it('should handle HTTP errors from proxy', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await fetchThroughProxy('http://example.com');
      expect(result.success).toBe(false);
      expect(result.error).toContain('All proxies failed');
    });

    it('should try fallback proxies when primary fails', async () => {
      const primaryErrorResponse = {
        ok: false,
        status: 500
      };
      const fallbackResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('<html>Fallback content</html>')
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce(primaryErrorResponse as any)
        .mockResolvedValueOnce(fallbackResponse as any);

      const result = await fetchThroughProxy('http://example.com');
      expect(result.success).toBe(true);
      expect(result.html).toContain('Fallback content');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('canUseDirectIframe', () => {
    it('should return true for allowed domains', () => {
      expect(canUseDirectIframe('https://en.wikipedia.org/wiki/Test')).toBe(true);
      expect(canUseDirectIframe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(canUseDirectIframe('https://vimeo.com/123456789')).toBe(true);
    });

    it('should return false for other domains', () => {
      expect(canUseDirectIframe('https://example.com')).toBe(false);
      expect(canUseDirectIframe('https://google.com')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(canUseDirectIframe('not-a-url')).toBe(false);
    });
  });
});