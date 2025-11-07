import express from 'express';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { URL } from 'url';
import dns from 'dns/promises';

/**
 * Security utilities for SSRF protection
 */
const SECURITY_CONFIG = {
  // Blocked IP ranges for SSRF protection
  BLOCKED_IP_RANGES: [
    { start: '127.0.0.0', mask: 8 },      // Loopback
    { start: '10.0.0.0', mask: 8 },       // Private Class A
    { start: '172.16.0.0', mask: 12 },    // Private Class B
    { start: '192.168.0.0', mask: 16 },   // Private Class C
    { start: '169.254.0.0', mask: 16 },   // Link-local
    { start: '100.64.0.0', mask: 10 },    // Carrier-grade NAT
    { start: '0.0.0.0', mask: 8 },        // This network
    { start: '255.255.255.255', mask: 32 } // Broadcast
  ],

  // Allowed domains for additional security
  ALLOWED_DOMAINS: [
    'wikipedia.org',
    'youtube.com',
    'vimeo.com',
    'github.com',
    'stackoverflow.com'
  ],

  // Max content size for proxy responses (10MB)
  MAX_CONTENT_SIZE: 10 * 1024 * 1024
};

/**
 * Check if IP address is in blocked range
 */
function isIPBlocked(ip) {
  const ipToNumber = (ip) => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  };

  const ipNum = ipToNumber(ip);

  for (const range of SECURITY_CONFIG.BLOCKED_IP_RANGES) {
    const rangeStart = ipToNumber(range.start);
    const mask = range.mask === 0 ? 0 : (~0 << (32 - range.mask)) >>> 0;
    if ((ipNum & mask) === (rangeStart & mask)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate URL and perform SSRF protection checks
 */
async function validateURL(urlString) {
  try {
    const url = new URL(urlString);

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    // Block localhost and common internal hostnames
    const hostname = url.hostname.toLowerCase();
    const blockedHosts = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1',
      'local', 'internal', 'intranet', 'localhost.localdomain'
    ];

    if (blockedHosts.includes(hostname) || hostname.endsWith('.local')) {
      throw new Error('Access to localhost/internal addresses is blocked');
    }

    // DNS resolution check with IP blocking
    try {
      const addresses = await dns.resolve4(hostname);
      for (const addr of addresses) {
        if (isIPBlocked(addr)) {
          throw new Error('Access to private IP ranges is blocked');
        }
      }
    } catch (dnsError) {
      if (dnsError.message.includes('blocked')) {
        throw dnsError;
      }
      // If DNS resolution fails, allow the request but log it
      console.warn(`[SECURITY] DNS resolution failed for ${hostname}:`, dnsError.message);
    }

    // Additional domain allowlist check (optional, comment out for open access)
    // const isAllowed = SECURITY_CONFIG.ALLOWED_DOMAINS.some(domain =>
    //   hostname === domain || hostname.endsWith(`.${domain}`)
    // );
    // if (!isAllowed) {
    //   throw new Error('Domain not in allowlist');
    // }

    return true;
  } catch (error) {
    console.error('[SECURITY] URL validation failed:', error.message);
    throw error;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Security headers middleware
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https:; " +
    "frame-src 'self' https:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // Other security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://taskwizer.com',
      'https://www.taskwizer.com'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Content-Range']
}));

app.use(express.json({
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 1000
}));

// Enhanced rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Stricter limit for proxy endpoint
  message: {
    success: false,
    error: 'Too many proxy requests from this IP, please try again later.'
  }
});

app.use('/api', apiLimiter);
app.use('/api/proxy', proxyLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'taskwizer-web-browser-api',
    version: '1.0.0'
  });
});

// Custom proxy endpoint for external services
app.get('/api/proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    // Enhanced security validation
    try {
      await validateURL(url);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.message
      });
    }

    // Use jina.ai reader to fetch and parse the content
    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(jinaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Jina.ai API error: ${response.status} ${response.statusText}`);
      }

      // Check content length
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_CONTENT_SIZE) {
        throw new Error('Content too large');
      }

      let content = await response.text();

      // Ensure content doesn't exceed max size
      if (content.length > SECURITY_CONFIG.MAX_CONTENT_SIZE) {
        throw new Error('Content too large');
      }

      // Convert jina.ai markdown response to basic HTML
      const lines = content.split('\n');
      let markdownContent = '';
      let inMarkdownSection = false;

      for (const line of lines) {
        if (line.includes('Markdown Content:')) {
          inMarkdownSection = true;
          continue;
        }
        if (inMarkdownSection) {
          // Skip empty lines at the start of markdown content
          if (line.trim() !== '' || markdownContent !== '') {
            markdownContent += line + '\n';
          }
        }
      }

      if (markdownContent.trim() !== '') {
        // We found markdown content, convert it to HTML
        let markdown = markdownContent.trim();

        // Basic markdown to HTML conversion with XSS protection
        content = markdown
          .replace(/^# (.*$)/gim, (match, p1) => `<h1>${escapeHtml(p1)}</h1>`)
          .replace(/^## (.*$)/gim, (match, p1) => `<h2>${escapeHtml(p1)}</h2>`)
          .replace(/^### (.*$)/gim, (match, p1) => `<h3>${escapeHtml(p1)}</h3>`)
          .replace(/\*\*(.*?)\*\*/gim, (match, p1) => `<strong>${escapeHtml(p1)}</strong>`)
          .replace(/\*(.*?)\*/gim, (match, p1) => `<em>${escapeHtml(p1)}</em>`)
          .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (match, p1, p2) => {
            // Validate URL in markdown links
            try {
              new URL(p2);
              return `<a href="${escapeHtml(p2)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p1)}</a>`;
            } catch {
              return escapeHtml(match);
            }
          })
          .replace(/\n\n/gim, '</p><p>')
          .replace(/^(.+)$/gim, (match, p1) => `<p>${escapeHtml(p1)}</p>`)
          .replace(/<p><\/p>/gim, '')
          .replace(/<p>(<h[1-6]>)/gim, '$1')
          .replace(/(<\/h[1-6]>)<\/p>/gim, '$1');
      } else {
        // No markdown content found, wrap the whole response in <p> tags
        content = `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`;
      }

      res.json({
        success: true,
        html: content,
        proxyUsed: 'jina.ai',
        renderMode: 'advanced'
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('[PROXY] Proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content',
      details: error.message
    });
  }
});

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Gemini API proxy
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, model = 'models/gemma-3-27b-it' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      data: {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model,
        usage: data.usageMetadata
      }
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Browser automation endpoints - integrated with proxy service
app.post('/api/browser/navigate', async (req, res) => {
  try {
    const { url } = req.body;

    // Validate URL format
    if (!url || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format - must start with http:// or https://'
      });
    }

    // Test URL accessibility through proxy
    try {
      const fetchThroughProxy = (await import('../services/proxyService.js')).fetchThroughProxy;
      const proxyResponse = await fetchThroughProxy(url);

      if (proxyResponse.success) {
        res.json({
          success: true,
          data: {
            url,
            status: 'navigated',
            proxyUsed: proxyResponse.proxyUsed,
            renderMode: proxyResponse.renderMode || 'advanced',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Cannot access URL',
          details: proxyResponse.error
        });
      }
    } catch (proxyError) {
      res.status(500).json({
        success: false,
        error: 'Proxy service error',
        details: proxyError.message
      });
    }
  } catch (error) {
    console.error('Navigate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to navigate',
      details: error.message
    });
  }
});

// Browser navigation history endpoint
app.post('/api/browser/history', async (req, res) => {
  try {
    const { action, url } = req.body;

    // This would integrate with the BrowserService history management
    // For now, return a basic response
    res.json({
      success: true,
      data: {
        action,
        canGoBack: true,
        canGoForward: false,
        currentUrl: url || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle history action',
      details: error.message
    });
  }
});

// Content rendering endpoint
app.post('/api/content/render', async (req, res) => {
  try {
    const { content, type = 'markdown' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // Use ContentService for proper content rendering
    try {
      const { ContentServiceImpl } = await import('../services/contentService.js');
      const contentService = new ContentServiceImpl();

      const rendered = await contentService.renderContent(content, type);
      const extractedText = await contentService.extractText(rendered);

      res.json({
        success: true,
        data: {
          rendered,
          extractedText,
          type,
          timestamp: new Date().toISOString()
        }
      });
    } catch (contentError) {
      console.error('ContentService error:', contentError);
      // Fallback to basic rendering
      res.json({
        success: true,
        data: {
          rendered: type === 'markdown' ? `<div class="markdown">${content}</div>` : content,
          type,
          fallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to render content',
      details: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskWizer Web Browser API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});