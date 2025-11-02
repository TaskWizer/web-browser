/**
 * Web Browser API Backend
 *
 * Cloudflare Workers-compatible API server for web-browser functionality
 * Can be deployed as a standalone microservice or integrated mode
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
// Conditional import for shared package or mock
let createAuthService: any;
let createApiResponse: any;
let createApiError: any;

try {
  const shared = require('@taskwizer/shared/auth');
  const utils = require('@taskwizer/shared/utils');
  createAuthService = shared.createAuthService;
  createApiResponse = utils.createApiResponse;
  createApiError = utils.createApiError;
} catch (error) {
  // Fallback to mock for standalone builds
  const mock = require('../src/shared-mock');
  createAuthService = mock.createAuthService;
  createApiResponse = mock.createApiResponse;
  createApiError = mock.createApiError;
}
import { rateLimitMiddleware } from './middleware/rateLimit';
import { browserRoutes } from './routes/browser';
import { contentRoutes } from './routes/content';
import type { Env, WebBrowserConfig } from '../src/types';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://taskwizer.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('*', logger());

// Configuration loading
function loadConfig(env: Env): WebBrowserConfig {
  return {
    enableApi: env.ENABLE_WEB_BROWSER_API === 'true',
    apiBasePath: env.WEB_BROWSER_API_BASE_PATH || '/api/web-browser',
    standalone: env.WEB_BROWSER_STANDALONE === 'true',
    defaultUrl: env.WEB_BROWSER_DEFAULT_URL || 'https://example.com',
    enablePdf: env.WEB_BROWSER_ENABLE_PDF !== 'false',
    enableEpub: env.WEB_BROWSER_ENABLE_EPUB !== 'false',
    maxFileSize: parseInt(env.WEB_BROWSER_MAX_FILE_SIZE || '10485760'), // 10MB
  };
}

// API enable/disable middleware
app.use('*', async (c, next) => {
  const config = loadConfig(c.env);

  if (!config.enableApi) {
    return c.json(createApiResponse(false, null, createApiError(
      'API_DISABLED',
      'Web Browser API is disabled',
      false,
      'This feature is currently unavailable'
    )), 503);
  }

  c.set('config', config);
  await next();
});

// Authentication middleware (reuse main app's auth system)
app.use('*', async (c, next) => {
  const config = c.get('config') as WebBrowserConfig;

  // Skip auth for health check and docs
  if (c.req.path === '/health' || c.req.path === '/docs') {
    await next();
    return;
  }

  const authService = createAuthService(c.env);
  const authMiddleware = authService.createAuthMiddleware();

  await authMiddleware(c, next);
});

// Rate limiting middleware
app.use('*', rateLimitMiddleware);

// Health check endpoint
app.get('/health', (c) => {
  const config = c.get('config') as WebBrowserConfig;

  return c.json(createApiResponse(true, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    config: {
      enableApi: config.enableApi,
      standalone: config.standalone,
      apiBasePath: config.apiBasePath,
    },
    services: {
      api: true,
      auth: !!c.env.JWT_SECRET,
      storage: !!c.env.CACHE_KV,
    },
  }));
});

// API documentation endpoint
app.get('/docs', (c) => {
  const config = c.get('config') as WebBrowserConfig;

  const docs = {
    title: 'TaskWizer Web Browser API',
    version: '1.0.0',
    description: 'RESTful API for web browser automation and content rendering',
    baseUrl: `${c.req.url.split('/api')[0]}${config.apiBasePath}`,
    endpoints: [
      {
        path: '/health',
        method: 'GET',
        description: 'Health check endpoint',
        auth: false,
      },
      {
        path: '/browser/navigate',
        method: 'POST',
        description: 'Navigate to a URL',
        auth: true,
        body: {
          url: 'string',
          waitForSelector: 'string (optional)',
          timeout: 'number (optional)',
        },
      },
      {
        path: '/browser/screenshot',
        method: 'POST',
        description: 'Take a screenshot of current page',
        auth: true,
        body: {
          width: 'number (optional)',
          height: 'number (optional)',
          format: 'string (optional, png/jpeg)',
        },
      },
      {
        path: '/browser/execute',
        method: 'POST',
        description: 'Execute JavaScript in the page',
        auth: true,
        body: {
          script: 'string',
          args: 'array (optional)',
        },
      },
      {
        path: '/content/render',
        method: 'POST',
        description: 'Render web content (markdown, HTML, etc.)',
        auth: true,
        body: {
          content: 'string',
          type: 'string (markdown/html)',
          options: 'object (optional)',
        },
      },
    ],
  };

  return c.json(createApiResponse(true, docs));
});

// API routes
app.route('/browser', browserRoutes);
app.app.route('/content', contentRoutes);

// Error handling middleware
app.onError((err, c) => {
  console.error('Web Browser API Error:', err);

  const error = createApiError(
    'INTERNAL_ERROR',
    err.message || 'An unexpected error occurred',
    false,
    'An error occurred while processing your request',
    { stack: err.stack }
  );

  return c.json(createApiResponse(false, null, error), 500);
});

// 404 handler
app.notFound((c) => {
  const error = createApiError(
    'NOT_FOUND',
    `Endpoint not found: ${c.req.method} ${c.req.path}`,
    false,
    'The requested endpoint does not exist'
  );

  return c.json(createApiResponse(false, null, error), 404);
});

export default app;