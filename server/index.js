import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateUrlWithDns, ALLOWED_SCHEMES } from './lib/ssrf.js';
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
  const { timeoutMs = 10000, maxRedirects = 5 } = options;
  let currentUrl = inputUrl;
  let redirects = 0;

  while (true) {
    const { signal, cancel } = withTimeout(timeoutMs);
    try {
      // Do not allow automatic redirects so we can re-validate
      const resp = await fetch(currentUrl, { redirect: 'manual', signal });

      // Handle manual redirects
      if (resp.status >= 300 && resp.status < 400 && resp.headers.get('location')) {
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

  try {
    const upstream = await fetchWithFollow(target, { timeoutMs: 15000, maxRedirects: 5 });

    // Propagate status
    res.status(upstream.status);

    // Copy selective headers
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    const cacheControl = upstream.headers.get('cache-control');
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);
    // DO NOT forward Set-Cookie for security

    // Pipe body
    if (upstream.body) {
      // Convert Web stream to Node stream
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on('error', () => res.end());
      nodeStream.pipe(res);
    } else {
      res.end();
    }
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

