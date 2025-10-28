// Simple in-memory cache with TTL support (no external dependencies)
// ESM module (root package.json has "type": "module")

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {Buffer} body - Response body as Buffer
 * @property {number} status - HTTP status code
 * @property {Object} headers - Response headers
 * @property {number} expiresAt - Timestamp when entry expires (ms since epoch)
 */

/**
 * Simple in-memory cache with TTL support
 */
export class ResponseCache {
  constructor() {
    /** @type {Map<string, CacheEntry>} */
    this.cache = new Map();
    
    // Start cleanup interval (every 60 seconds)
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get TTL in seconds based on content type
   * @param {string} contentType - Content-Type header value
   * @returns {number} TTL in seconds
   */
  getTTL(contentType) {
    if (!contentType) return 300; // 5 minutes default

    const lower = contentType.toLowerCase();
    
    // HTML content: 5 minutes
    if (lower.includes('text/html')) return 300;
    
    // Static assets: 1 hour
    if (
      lower.includes('text/css') ||
      lower.includes('text/javascript') ||
      lower.includes('application/javascript') ||
      lower.includes('image/') ||
      lower.includes('font/')
    ) {
      return 3600;
    }
    
    // JSON/API responses: 2 minutes
    if (lower.includes('application/json')) return 120;
    
    // Default: 5 minutes
    return 300;
  }

  /**
   * Check if response should be cached
   * @param {number} status - HTTP status code
   * @param {Object} headers - Response headers (Headers object or plain object)
   * @returns {boolean} True if response should be cached
   */
  shouldCache(status, headers) {
    // Only cache successful responses
    if (status !== 200) return false;

    // Check Cache-Control header
    const cacheControl = this.getHeader(headers, 'cache-control');
    if (cacheControl) {
      const lower = cacheControl.toLowerCase();
      // Don't cache if no-store or private
      if (lower.includes('no-store') || lower.includes('private')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get header value from Headers object or plain object
   * @param {Object} headers - Headers object or plain object
   * @param {string} name - Header name (case-insensitive)
   * @returns {string|null} Header value or null
   */
  getHeader(headers, name) {
    // Handle Headers object (has .get method)
    if (headers && typeof headers.get === 'function') {
      return headers.get(name);
    }
    
    // Handle plain object
    if (headers && typeof headers === 'object') {
      const lowerName = name.toLowerCase();
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lowerName) {
          return value;
        }
      }
    }
    
    return null;
  }

  /**
   * Store response in cache
   * @param {string} key - Cache key (usually the URL)
   * @param {Buffer} body - Response body as Buffer
   * @param {number} status - HTTP status code
   * @param {Object} headers - Response headers
   * @param {number} [ttlSeconds] - Optional TTL override in seconds
   */
  set(key, body, status, headers, ttlSeconds = null) {
    // Determine TTL
    const contentType = this.getHeader(headers, 'content-type') || '';
    const ttl = ttlSeconds !== null ? ttlSeconds : this.getTTL(contentType);
    const expiresAt = Date.now() + (ttl * 1000);

    // Convert headers to plain object for storage
    const headersObj = {};
    if (headers && typeof headers.forEach === 'function') {
      headers.forEach((value, key) => {
        headersObj[key] = value;
      });
    } else if (headers && typeof headers === 'object') {
      Object.assign(headersObj, headers);
    }

    this.cache.set(key, {
      body,
      status,
      headers: headersObj,
      expiresAt,
    });

    console.log(`[cache] Stored ${key} (TTL: ${ttl}s, expires: ${new Date(expiresAt).toISOString()})`);
  }

  /**
   * Get response from cache
   * @param {string} key - Cache key (usually the URL)
   * @returns {CacheEntry|null} Cache entry or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`[cache] Expired ${key}`);
      return null;
    }

    return entry;
  }

  /**
   * Get remaining TTL for a cache entry
   * @param {string} key - Cache key
   * @returns {number} Remaining TTL in seconds, or 0 if not found/expired
   */
  getRemainingTTL(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return 0;
    }

    const remaining = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    
    if (remaining === 0) {
      this.cache.delete(key);
    }

    return remaining;
  }

  /**
   * Remove expired entries from cache
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[cache] Cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[cache] Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
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
export const responseCache = new ResponseCache();

