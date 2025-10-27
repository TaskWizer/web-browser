import express from 'express';
import { validateUrlWithDns, ALLOWED_SCHEMES } from './lib/ssrf.js';
import { Readable } from 'node:stream';

const app = express();

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

app.get('/api/proxy', async (req, res) => {
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

