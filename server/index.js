/**
 * SSRF-enforcing proxy server for DEVELOPMENT MODE ONLY.
 *
 * This server provides SSRF protection and rate limiting during local development.
 * In production (Cloudflare Pages), the frontend uses third-party CORS proxies.
 *
 * To run in development:
 *   Terminal 1: npm run server:start
 *   Terminal 2: npm run dev
 *
 * The frontend automatically detects the environment:
 *   - Development (localhost:5173): Uses http://127.0.0.1:3001/api/proxy (this server)
 *   - Production/Preview: Uses https://api.allorigins.win/raw?url= (third-party)
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateUrlWithDns, ALLOWED_SCHEMES } from './lib/ssrf.js';
import { responseCache } from './lib/cache.js';
import { cookieStore } from './lib/cookies.js';
import { Readable } from 'node:stream';

const app = express();

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute default
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests/minute default

// Create rate limiter for /api/proxy endpoint
const proxyRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers (use standard RateLimit-* instead)
  message: { error: 'Rate limit exceeded', retryAfter: null }, // Will be populated by handler
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime.getTime() / 1000 - Date.now() / 1000);
    console.warn(`[rate-limit] IP ${req.ip} exceeded rate limit`);
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter,
    });
  },
  // Use IP from X-Forwarded-For if behind proxy, otherwise req.ip
  // Note: express-rate-limit will handle IPv6 subnet masking automatically
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip;
  },
  // Disable IPv6 subnet validation since we're using a custom keyGenerator
  validate: {
    keyGeneratorIpFallback: false,
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/api/proxy/ping';
  },
});

// Basic CORS for frontend access (Vite dev @ :5173 and prod)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health check
app.get('/api/proxy/ping', (req, res) => {
  res.json({ ok: true });
});

function withTimeout(ms) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error('Timeout')), ms);
  return { signal: ac.signal, cancel: () => clearTimeout(timer) };
}

function isAllowedMethod(method) {
  return method === 'GET' || method === 'HEAD';
}

async function fetchWithFollow(inputUrl, options = {}) {
  const { timeoutMs = 10000, maxRedirects = 5, headers = {}, onRedirect = null } = options;
  let currentUrl = inputUrl;
  let redirects = 0;

  while (true) {
    const { signal, cancel } = withTimeout(timeoutMs);
    try {
      // Do not allow automatic redirects so we can re-validate
      const resp = await fetch(currentUrl, { redirect: 'manual', signal, headers });

      // Handle manual redirects
      if (resp.status >= 300 && resp.status < 400 && resp.headers.get('location')) {
        // Call onRedirect callback if provided (for cookie capture)
        if (onRedirect) {
          onRedirect(resp, currentUrl);
        }

        if (redirects >= maxRedirects) {
          return new Response('Too many redirects', { status: 508 });
        }
        const nextUrl = new URL(resp.headers.get('location'), currentUrl).toString();
        const v = await validateUrlWithDns(nextUrl);
        if (!v.ok) {
          return new Response(`Blocked by SSRF policy (redirect): ${v.reason || 'invalid target'}`, { status: 400 });
        }
        currentUrl = nextUrl;
        redirects += 1;
        continue;
      }

      return resp;
    } finally {
      cancel();
    }
  }
}

// Apply rate limiting to /api/proxy endpoint
app.get('/api/proxy', proxyRateLimiter, async (req, res) => {
  const target = req.query.url;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Basic parse
  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Allowed methods only
  if (!isAllowedMethod(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enforce allowed schemes quickly
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return res.status(400).json({ error: 'Blocked by SSRF policy: scheme not allowed' });
  }

  // Full DNS-based SSRF validation
  const validation = await validateUrlWithDns(target);
  if (!validation.ok) {
    return res.status(400).json({ error: `Blocked by SSRF policy: ${validation.reason || 'denied'}` });
  }

  // Check cache first
  const cached = responseCache.get(target);
  if (cached) {
    const remainingTTL = responseCache.getRemainingTTL(target);
    console.log(`[cache] HIT ${target} (TTL: ${remainingTTL}s)`);

    // Set cache status headers
    res.setHeader('X-Cache-Status', 'HIT');
    res.setHeader('X-Cache-TTL', remainingTTL.toString());

    // Set cached headers
    Object.entries(cached.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send cached response
    res.status(cached.status);
    return res.send(cached.body);
  }

  console.log(`[cache] MISS ${target}`);

  try {
    // Get stored cookies for this domain
    const cookieHeader = cookieStore.getCookies(target);
    const fetchHeaders = {};
    if (cookieHeader) {
      fetchHeaders['Cookie'] = cookieHeader;
      console.log(`[cookies] Sending cookies to ${target}: ${cookieHeader}`);
    }

    // Callback to capture cookies from redirect responses
    const onRedirect = (resp, url) => {
      const redirectCookies = [];
      resp.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          redirectCookies.push(value);
        }
      });
      if (redirectCookies.length > 0) {
        cookieStore.storeCookies(url, redirectCookies);
        console.log(`[cookies] Stored ${redirectCookies.length} cookie(s) from redirect ${url}`);
      }
    };

    const upstream = await fetchWithFollow(target, { timeoutMs: 15000, maxRedirects: 5, headers: fetchHeaders, onRedirect });

    // Capture Set-Cookie headers from final response
    const setCookieHeaders = [];
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      }
    });

    // Store cookies from final upstream response
    if (setCookieHeaders.length > 0) {
      cookieStore.storeCookies(target, setCookieHeaders);
      console.log(`[cookies] Stored ${setCookieHeaders.length} cookie(s) from ${target}`);
    }

    // Headers to strip (prevent iframe blocking, CSP restrictions, and encoding issues)
    const headersToStrip = new Set([
      'x-frame-options',
      'content-security-policy',
      'content-security-policy-report-only',
      'set-cookie',  // Security: don't leak cookies to client (we manage them server-side)
      'set-cookie2',
      'content-encoding',  // Node's fetch auto-decompresses, so don't forward this
      'transfer-encoding',  // We're re-streaming, so don't forward this
    ]);

    // Collect headers for caching
    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!headersToStrip.has(lowerKey)) {
        responseHeaders[key] = value;
      }
    });

    // Read body into buffer for caching
    const bodyBuffer = upstream.body ? Buffer.from(await upstream.arrayBuffer()) : Buffer.alloc(0);

    // Check if we should cache this response
    if (responseCache.shouldCache(upstream.status, upstream.headers)) {
      responseCache.set(target, bodyBuffer, upstream.status, responseHeaders);
    }

    // Set cache status header
    res.setHeader('X-Cache-Status', 'MISS');

    // Set response headers
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send response
    res.status(upstream.status);
    res.send(bodyBuffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Upstream fetch failed: ${msg}` });
  }
});

export function createApp() {
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`[proxy] SSRF-enforcing proxy listening on :${port}`);
  });
}

