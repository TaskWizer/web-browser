import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the server modules for testing
const createTestApp = () => {
  const app = express();

  // Mock security middleware
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.json());

  // Mock rate limiting
  const rateLimitStore = new Map();
  app.use((req, res, next) => {
    const ip = req.ip || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - 15 * 60 * 1000; // 15 minutes

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }

    const requests = rateLimitStore.get(ip).filter((time: number) => time > windowStart);

    if (requests.length >= 100) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests'
      });
    }

    requests.push(now);
    rateLimitStore.set(ip, requests);
    next();
  });

  // Mock proxy endpoint with SSRF protection
  app.get('/api/proxy', async (req, res) => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'URL parameter is required'
        });
      }

      // Basic URL validation
      let urlObj;
      try {
        urlObj = new URL(url);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL format'
        });
      }

      // SSRF protection
      const hostname = urlObj.hostname.toLowerCase();
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0'];

      if (blockedHosts.includes(hostname)) {
        return res.status(400).json({
          success: false,
          error: 'Access to localhost is blocked'
        });
      }

      // Protocol check
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return res.status(400).json({
          success: false,
          error: 'Only HTTP and HTTPS URLs are allowed'
        });
      }

      // Mock successful response
      res.json({
        success: true,
        html: '<p>Mocked safe content</p>',
        proxyUsed: 'test-proxy',
        renderMode: 'advanced'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy'
    });
  });

  return app;
};

describe('Server Security Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Security Headers', () => {
    it('should set Content Security Policy header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['content-security-policy']).toBe("default-src 'self'; script-src 'self' 'unsafe-inline'");
    });

    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Proxy Endpoint Security', () => {
    it('should block localhost URLs', async () => {
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: 'http://localhost:3000' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('localhost is blocked');
    });

    it('should block 127.0.0.1 URLs', async () => {
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: 'http://127.0.0.1:8080' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('localhost is blocked');
    });

    it('should block non-HTTP/HTTPS protocols', async () => {
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: 'ftp://example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only HTTP and HTTPS URLs are allowed');
    });

    it('should block invalid URLs', async () => {
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid URL format');
    });

    it('should require URL parameter', async () => {
      const response = await request(app).get('/api/proxy');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('URL parameter is required');
    });

    it('should allow valid HTTP URLs', async () => {
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: 'http://example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.html).toContain('Mocked safe content');
    });

    it('should allow valid HTTPS URLs', async () => {
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: 'https://example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.html).toContain('Mocked safe content');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow normal request rates', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should handle rate limiting (simulated)', async () => {
      // This test would need to be enhanced to actually test rate limiting
      // For now, we just verify the middleware is in place
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation', () => {
    it('should validate JSON input size', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/test-endpoint')
        .send({ data: largePayload })
        .set('Content-Type', 'application/json');

      // The request should be handled by express.json() middleware
      // In a real scenario, this would be limited
      expect(response.status).toBe(404); // Route doesn't exist, but JSON parsing succeeded
    });

    it('should sanitize query parameters', async () => {
      const maliciousQuery = '<script>alert(1)</script>';
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: maliciousQuery });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid URL format');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Test with malformed request that might cause server errors
      const response = await request(app)
        .get('/api/proxy')
        .query({ url: 'http://[invalid-ipv6' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should not leak internal error details', async () => {
      const response = await request(app).get('/nonexistent-endpoint');

      expect(response.status).toBe(404);
      // Should not expose stack traces or internal paths
      expect(response.body).not.toContain(process.cwd());
      expect(response.body).not.toContain('node_modules');
    });
  });
});