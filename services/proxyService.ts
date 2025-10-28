/**
 * Proxy Service for CORS Bypass
 * 
 * This service handles fetching external web content through a CORS proxy,
 * allowing us to bypass CORS restrictions and render external websites
 * within our sandboxed browser environment.
 */

export interface ProxyConfig {
  // Primary proxy URL (allorigins.win by default)
  primaryProxy: string;
  // Fallback proxy URLs in case primary fails
  fallbackProxies: string[];
  // Timeout for proxy requests (ms)
  timeout: number;
}

export interface ProxyResponse {
  success: boolean;
  html?: string;
  error?: string;
  proxyUsed?: string;
  renderMode?: 'advanced' | 'fallback' | 'error';
}

function inferPrimaryProxy(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Only use local SSRF-enforcing backend in development mode (port 5173)
    const isDev = /localhost:5173|127\.0\.0\.1:5173/.test(origin);
    if (isDev) {
      return 'http://127.0.0.1:3001/api/proxy?url=';
    }
    // In production/preview, use third-party CORS proxy (Cloudflare Pages has no backend)
    return 'https://corsproxy.io/?';
  }
  // Fallback for SSR/build time
  return 'https://corsproxy.io/?';
}

const DEFAULT_CONFIG: ProxyConfig = {
  primaryProxy: inferPrimaryProxy(),
  // Fallback proxies for production (not used in dev to enforce SSRF protection)
  fallbackProxies: [
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/raw?url=',
  ],
  timeout: 15000, // 15 seconds
};

/**
 * Fetch content through a CORS proxy with timeout
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 * This is a basic sanitization - for production, consider using DOMPurify
 */
function sanitizeHTML(html: string): string {
  // Remove potentially dangerous script tags and event handlers
  let sanitized = html;
  
  // Remove script tags (but keep content for debugging)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

/**
 * Rewrite URLs in HTML to go through the proxy
 * This ensures that resources (CSS, images, etc.) are also fetched through the proxy
 */
function rewriteURLs(html: string, originalUrl: string, proxyUrl: string): string {
  try {
    const baseUrl = new URL(originalUrl);
    const origin = baseUrl.origin;
    
    let rewritten = html;
    
    // Rewrite absolute URLs
    rewritten = rewritten.replace(
      /(?:href|src)=["']https?:\/\/[^"']*["']/gi,
      (match) => {
        const url = match.match(/["'](https?:\/\/[^"']*)["']/)?.[1];
        if (url) {
          return match.replace(url, `${proxyUrl}${encodeURIComponent(url)}`);
        }
        return match;
      }
    );
    
    // Rewrite relative URLs to absolute
    rewritten = rewritten.replace(
      /(?:href|src)=["']\/[^"']*["']/gi,
      (match) => {
        const path = match.match(/["'](\/[^"']*)["']/)?.[1];
        if (path) {
          const absoluteUrl = `${origin}${path}`;
          return match.replace(path, `${proxyUrl}${encodeURIComponent(absoluteUrl)}`);
        }
        return match;
      }
    );
    
    return rewritten;
  } catch (error) {
    console.error('Error rewriting URLs:', error);
    return html;
  }
}

/**
 * Fetch website content through CORS proxy
 */
export async function fetchThroughProxy(
  url: string,
  config: Partial<ProxyConfig> = {}
): Promise<ProxyResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const proxies = [finalConfig.primaryProxy, ...finalConfig.fallbackProxies];
  
  // Validate URL (basic format) and client-side pre-SSRF checks
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid URL provided',
      renderMode: 'error',
    };
  }

  // Allow only http/https
  const isAllowedScheme = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  if (!isAllowedScheme) {
    return {
      success: false,
      error: 'Blocked by SSRF policy: scheme not allowed',
      renderMode: 'error',
    };
  }

  // Quick client-side literal host checks (cannot DNS resolve in browser)
  const hostname = urlObj.hostname.toLowerCase();
  const isIPv4Literal = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');

  const inRange = (ip: string, base: string, bits: number) => {
    const toInt = (s: string) => s.split('.').map(Number).reduce((acc, n) => (acc << 8) + (n & 255), 0);
    const ipInt = toInt(ip);
    const baseInt = toInt(base);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
  };

  if (isLocalhost) {
    return {
      success: false,
      error: 'Blocked by SSRF policy: localhost not allowed',
      renderMode: 'error',
    };
  }

  if (isIPv4Literal) {
    const ip = hostname;
    const blocked = (
      inRange(ip, '127.0.0.0', 8)  ||
      inRange(ip, '10.0.0.0', 8)   ||
      inRange(ip, '172.16.0.0', 12)||
      inRange(ip, '192.168.0.0', 16)||
      inRange(ip, '169.254.0.0', 16)||
      inRange(ip, '100.64.0.0', 10)||
      inRange(ip, '0.0.0.0', 8)    ||
      ip === '255.255.255.255'
    );
    if (blocked) {
      return {
        success: false,
        error: 'Blocked by SSRF policy: private/special IP literal not allowed',
        renderMode: 'error',
      };
    }
  }

  // Try each proxy in sequence
  for (let i = 0; i < proxies.length; i++) {
    const proxyUrl = proxies[i];
    const proxiedUrl = `${proxyUrl}${encodeURIComponent(url)}`;
    
    try {
      console.log(`[ProxyService] Attempting to fetch ${url} through proxy ${i + 1}/${proxies.length}`);
      
      const response = await fetchWithTimeout(proxiedUrl, finalConfig.timeout);
      
      if (!response.ok) {
        console.warn(`[ProxyService] Proxy ${i + 1} returned status ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      
      if (!html || html.trim().length === 0) {
        console.warn(`[ProxyService] Proxy ${i + 1} returned empty content`);
        continue;
      }
      
      // Sanitize and rewrite URLs
      const sanitized = sanitizeHTML(html);
      const rewritten = rewriteURLs(sanitized, url, proxyUrl);
      
      console.log(`[ProxyService] Successfully fetched content through proxy ${i + 1}`);
      
      return {
        success: true,
        html: rewritten,
        proxyUsed: proxyUrl,
        renderMode: 'advanced',
      };
    } catch (error) {
      console.warn(`[ProxyService] Proxy ${i + 1} failed:`, error);
      
      // If this was the last proxy, return error
      if (i === proxies.length - 1) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch through proxy',
          renderMode: 'error',
        };
      }
      
      // Otherwise, try next proxy
      continue;
    }
  }
  
  // Should never reach here, but just in case
  return {
    success: false,
    error: 'All proxies failed',
    renderMode: 'error',
  };
}

/**
 * Check if a URL is likely to work with direct iframe embedding
 * (i.e., doesn't have X-Frame-Options or CSP restrictions)
 */
export function canUseDirectIframe(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Some domains are known to allow iframe embedding
    const allowedDomains = [
      'wikipedia.org',
      'youtube.com',
      'vimeo.com',
      'codepen.io',
    ];
    
    return allowedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

