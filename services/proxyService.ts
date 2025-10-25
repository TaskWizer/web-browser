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

const DEFAULT_CONFIG: ProxyConfig = {
  primaryProxy: 'https://api.allorigins.win/raw?url=',
  fallbackProxies: [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ],
  timeout: 10000, // 10 seconds
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
  
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid URL provided',
      renderMode: 'error',
    };
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

