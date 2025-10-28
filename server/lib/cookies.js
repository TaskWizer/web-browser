// Cookie management for proxy server
// Stores cookies per domain to enable session persistence and login functionality
// ESM module (root package.json has "type": "module")

import { parse as parseCookie, serialize as serializeCookie } from 'cookie';

/**
 * Cookie entry structure
 * @typedef {Object} CookieEntry
 * @property {string} name - Cookie name
 * @property {string} value - Cookie value
 * @property {Object} options - Cookie options (domain, path, expires, maxAge, httpOnly, secure, sameSite)
 * @property {number} expiresAt - Timestamp when cookie expires (ms since epoch), 0 for session cookies
 */

/**
 * Cookie store for managing cookies per domain
 */
export class CookieStore {
  constructor() {
    /** @type {Map<string, Map<string, CookieEntry>>} */
    this.store = new Map(); // domain -> cookieName -> CookieEntry
    
    // Start cleanup interval (every 5 minutes)
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Get domain key from URL
   * @param {string} urlString - Full URL
   * @returns {string} Domain key (e.g., "example.com")
   */
  getDomainKey(urlString) {
    try {
      const url = new URL(urlString);
      return url.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Parse Set-Cookie header value into cookie entry
   * @param {string} setCookieValue - Set-Cookie header value
   * @param {string} domain - Domain for the cookie
   * @returns {CookieEntry|null} Parsed cookie entry or null if invalid
   */
  parseSetCookie(setCookieValue, domain) {
    try {
      // Split cookie string into name=value and attributes
      const parts = setCookieValue.split(';').map(p => p.trim());
      if (parts.length === 0) return null;

      // Parse first part (name=value)
      const [nameValue, ...attributeParts] = parts;
      const eqIndex = nameValue.indexOf('=');
      if (eqIndex === -1) return null;

      const name = nameValue.substring(0, eqIndex).trim();
      const value = nameValue.substring(eqIndex + 1).trim();

      if (!name) return null;

      // Parse attributes
      const options = {
        domain: domain.toLowerCase(),
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      };

      let expiresAt = 0; // 0 = session cookie

      for (const attr of attributeParts) {
        const attrEqIndex = attr.indexOf('=');
        const attrName = (attrEqIndex === -1 ? attr : attr.substring(0, attrEqIndex)).toLowerCase();
        const attrValue = attrEqIndex === -1 ? '' : attr.substring(attrEqIndex + 1);

        switch (attrName) {
          case 'domain':
            options.domain = attrValue.toLowerCase().replace(/^\./, ''); // Remove leading dot
            break;
          case 'path':
            options.path = attrValue;
            break;
          case 'expires':
            try {
              const date = new Date(attrValue);
              if (!isNaN(date.getTime())) {
                expiresAt = date.getTime();
              }
            } catch {
              // Ignore invalid date
            }
            break;
          case 'max-age':
            try {
              const maxAge = parseInt(attrValue, 10);
              if (!isNaN(maxAge) && maxAge > 0) {
                expiresAt = Date.now() + (maxAge * 1000);
                options.maxAge = maxAge;
              }
            } catch {
              // Ignore invalid max-age
            }
            break;
          case 'httponly':
            options.httpOnly = true;
            break;
          case 'secure':
            options.secure = true;
            break;
          case 'samesite':
            const sameSiteValue = attrValue.toLowerCase();
            if (['strict', 'lax', 'none'].includes(sameSiteValue)) {
              options.sameSite = sameSiteValue.charAt(0).toUpperCase() + sameSiteValue.slice(1);
            }
            break;
        }
      }

      return {
        name,
        value,
        options,
        expiresAt,
      };
    } catch (error) {
      console.error('[cookies] Error parsing Set-Cookie:', error);
      return null;
    }
  }

  /**
   * Store cookies from Set-Cookie headers
   * @param {string} urlString - URL that set the cookies
   * @param {string|string[]} setCookieHeaders - Set-Cookie header value(s)
   */
  storeCookies(urlString, setCookieHeaders) {
    const domainKey = this.getDomainKey(urlString);
    if (!domainKey) return;

    // Ensure domain map exists
    if (!this.store.has(domainKey)) {
      this.store.set(domainKey, new Map());
    }

    const domainCookies = this.store.get(domainKey);

    // Handle both single string and array of strings
    const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

    for (const setCookieValue of headers) {
      if (!setCookieValue || typeof setCookieValue !== 'string') continue;

      const cookie = this.parseSetCookie(setCookieValue, domainKey);
      if (cookie) {
        domainCookies.set(cookie.name, cookie);
        console.log(`[cookies] Stored cookie ${cookie.name} for ${domainKey} (expires: ${cookie.expiresAt ? new Date(cookie.expiresAt).toISOString() : 'session'})`);
      }
    }
  }

  /**
   * Get cookies for a URL as Cookie header value
   * @param {string} urlString - URL to get cookies for
   * @returns {string} Cookie header value (e.g., "name1=value1; name2=value2")
   */
  getCookies(urlString) {
    const domainKey = this.getDomainKey(urlString);
    if (!domainKey) return '';

    const domainCookies = this.store.get(domainKey);
    if (!domainCookies || domainCookies.size === 0) return '';

    const now = Date.now();
    const validCookies = [];

    for (const [name, cookie] of domainCookies.entries()) {
      // Skip expired cookies
      if (cookie.expiresAt > 0 && cookie.expiresAt < now) {
        domainCookies.delete(name);
        continue;
      }

      validCookies.push(`${cookie.name}=${cookie.value}`);
    }

    return validCookies.join('; ');
  }

  /**
   * Remove expired cookies from store
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [domain, domainCookies] of this.store.entries()) {
      for (const [name, cookie] of domainCookies.entries()) {
        if (cookie.expiresAt > 0 && cookie.expiresAt < now) {
          domainCookies.delete(name);
          removed++;
        }
      }

      // Remove empty domain maps
      if (domainCookies.size === 0) {
        this.store.delete(domain);
      }
    }

    if (removed > 0) {
      console.log(`[cookies] Cleanup: removed ${removed} expired cookies`);
    }
  }

  /**
   * Clear all cookies
   */
  clear() {
    const totalCookies = Array.from(this.store.values()).reduce((sum, map) => sum + map.size, 0);
    this.store.clear();
    console.log(`[cookies] Cleared ${totalCookies} cookies`);
  }

  /**
   * Clear cookies for a specific domain
   * @param {string} domain - Domain to clear cookies for
   */
  clearDomain(domain) {
    const domainKey = domain.toLowerCase();
    const domainCookies = this.store.get(domainKey);
    if (domainCookies) {
      const count = domainCookies.size;
      this.store.delete(domainKey);
      console.log(`[cookies] Cleared ${count} cookies for ${domainKey}`);
    }
  }

  /**
   * Get cookie statistics
   * @returns {Object} Cookie stats
   */
  getStats() {
    const stats = {
      domains: this.store.size,
      totalCookies: 0,
      cookiesByDomain: {},
    };

    for (const [domain, domainCookies] of this.store.entries()) {
      const count = domainCookies.size;
      stats.totalCookies += count;
      stats.cookiesByDomain[domain] = count;
    }

    return stats;
  }

  /**
   * Stop cleanup interval (for testing)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const cookieStore = new CookieStore();

