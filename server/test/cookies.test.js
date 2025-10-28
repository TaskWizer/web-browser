import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CookieStore } from '../lib/cookies.js';

describe('CookieStore', () => {
  let store;
  const stores = [];

  beforeEach(() => {
    store = new CookieStore();
    stores.push(store);
  });

  after(() => {
    // Clean up all stores to prevent test hanging
    stores.forEach(s => s.destroy());
  });

  describe('getDomainKey', () => {
    it('should extract domain from URL', () => {
      assert.equal(store.getDomainKey('http://example.com/path'), 'example.com');
      assert.equal(store.getDomainKey('https://www.example.com/path'), 'www.example.com');
      assert.equal(store.getDomainKey('http://subdomain.example.com:8080/path'), 'subdomain.example.com');
    });

    it('should return empty string for invalid URL', () => {
      assert.equal(store.getDomainKey('not-a-url'), '');
      assert.equal(store.getDomainKey(''), '');
    });
  });

  describe('parseSetCookie', () => {
    it('should parse simple cookie', () => {
      const cookie = store.parseSetCookie('sessionId=abc123', 'example.com');
      assert.ok(cookie);
      assert.equal(cookie.name, 'sessionId');
      assert.equal(cookie.value, 'abc123');
      assert.equal(cookie.options.domain, 'example.com');
      assert.equal(cookie.expiresAt, 0); // Session cookie
    });

    it('should parse cookie with domain attribute', () => {
      const cookie = store.parseSetCookie('sessionId=abc123; Domain=.example.com', 'example.com');
      assert.ok(cookie);
      assert.equal(cookie.options.domain, 'example.com'); // Leading dot removed
    });

    it('should parse cookie with path attribute', () => {
      const cookie = store.parseSetCookie('sessionId=abc123; Path=/api', 'example.com');
      assert.ok(cookie);
      assert.equal(cookie.options.path, '/api');
    });

    it('should parse cookie with Max-Age attribute', () => {
      const before = Date.now();
      const cookie = store.parseSetCookie('sessionId=abc123; Max-Age=3600', 'example.com');
      const after = Date.now();
      
      assert.ok(cookie);
      assert.ok(cookie.expiresAt > before);
      assert.ok(cookie.expiresAt <= after + 3600000); // Within 1 hour
      assert.equal(cookie.options.maxAge, 3600);
    });

    it('should parse cookie with Expires attribute', () => {
      const futureDate = new Date(Date.now() + 86400000).toUTCString(); // 1 day from now
      const cookie = store.parseSetCookie(`sessionId=abc123; Expires=${futureDate}`, 'example.com');
      
      assert.ok(cookie);
      assert.ok(cookie.expiresAt > Date.now());
    });

    it('should parse cookie with HttpOnly attribute', () => {
      const cookie = store.parseSetCookie('sessionId=abc123; HttpOnly', 'example.com');
      assert.ok(cookie);
      assert.equal(cookie.options.httpOnly, true);
    });

    it('should parse cookie with Secure attribute', () => {
      const cookie = store.parseSetCookie('sessionId=abc123; Secure', 'example.com');
      assert.ok(cookie);
      assert.equal(cookie.options.secure, true);
    });

    it('should parse cookie with SameSite attribute', () => {
      const cookie1 = store.parseSetCookie('sessionId=abc123; SameSite=Strict', 'example.com');
      assert.equal(cookie1.options.sameSite, 'Strict');

      const cookie2 = store.parseSetCookie('sessionId=abc123; SameSite=Lax', 'example.com');
      assert.equal(cookie2.options.sameSite, 'Lax');

      const cookie3 = store.parseSetCookie('sessionId=abc123; SameSite=None', 'example.com');
      assert.equal(cookie3.options.sameSite, 'None');
    });

    it('should parse cookie with multiple attributes', () => {
      const cookie = store.parseSetCookie(
        'sessionId=abc123; Domain=example.com; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Strict',
        'example.com'
      );
      
      assert.ok(cookie);
      assert.equal(cookie.name, 'sessionId');
      assert.equal(cookie.value, 'abc123');
      assert.equal(cookie.options.domain, 'example.com');
      assert.equal(cookie.options.path, '/');
      assert.equal(cookie.options.httpOnly, true);
      assert.equal(cookie.options.secure, true);
      assert.equal(cookie.options.sameSite, 'Strict');
      assert.ok(cookie.expiresAt > Date.now());
    });

    it('should return null for invalid cookie', () => {
      assert.equal(store.parseSetCookie('', 'example.com'), null);
      assert.equal(store.parseSetCookie('invalid', 'example.com'), null);
    });
  });

  describe('storeCookies and getCookies', () => {
    it('should store and retrieve simple cookie', () => {
      store.storeCookies('http://example.com', 'sessionId=abc123');
      const cookies = store.getCookies('http://example.com');
      assert.equal(cookies, 'sessionId=abc123');
    });

    it('should store and retrieve multiple cookies', () => {
      store.storeCookies('http://example.com', [
        'sessionId=abc123',
        'userId=user456',
      ]);
      const cookies = store.getCookies('http://example.com');
      assert.ok(cookies.includes('sessionId=abc123'));
      assert.ok(cookies.includes('userId=user456'));
    });

    it('should update existing cookie', () => {
      store.storeCookies('http://example.com', 'sessionId=abc123');
      store.storeCookies('http://example.com', 'sessionId=xyz789');
      const cookies = store.getCookies('http://example.com');
      assert.equal(cookies, 'sessionId=xyz789');
    });

    it('should return empty string for domain with no cookies', () => {
      const cookies = store.getCookies('http://example.com');
      assert.equal(cookies, '');
    });

    it('should isolate cookies by domain', () => {
      store.storeCookies('http://example.com', 'sessionId=abc123');
      store.storeCookies('http://other.com', 'sessionId=xyz789');
      
      const cookies1 = store.getCookies('http://example.com');
      const cookies2 = store.getCookies('http://other.com');
      
      assert.equal(cookies1, 'sessionId=abc123');
      assert.equal(cookies2, 'sessionId=xyz789');
    });

    it('should not return expired cookies', async () => {
      // Store cookie with 1 second expiry
      store.storeCookies('http://example.com', 'sessionId=abc123; Max-Age=1');
      
      // Should be available immediately
      let cookies = store.getCookies('http://example.com');
      assert.equal(cookies, 'sessionId=abc123');
      
      // Wait 1.5 seconds for cookie to expire
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Should be expired now
      cookies = store.getCookies('http://example.com');
      assert.equal(cookies, '');
    });
  });

  describe('cleanup', () => {
    it('should remove expired cookies', async () => {
      // Store cookie with 1 second expiry
      store.storeCookies('http://example.com', 'sessionId=abc123; Max-Age=1');
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Run cleanup
      store.cleanup();
      
      // Cookie should be gone
      const cookies = store.getCookies('http://example.com');
      assert.equal(cookies, '');
    });

    it('should keep valid cookies', () => {
      store.storeCookies('http://example.com', 'sessionId=abc123; Max-Age=3600');
      store.cleanup();
      
      const cookies = store.getCookies('http://example.com');
      assert.equal(cookies, 'sessionId=abc123');
    });
  });

  describe('clear', () => {
    it('should clear all cookies', () => {
      store.storeCookies('http://example.com', 'sessionId=abc123');
      store.storeCookies('http://other.com', 'userId=user456');
      
      store.clear();
      
      assert.equal(store.getCookies('http://example.com'), '');
      assert.equal(store.getCookies('http://other.com'), '');
    });
  });

  describe('clearDomain', () => {
    it('should clear cookies for specific domain', () => {
      store.storeCookies('http://example.com', 'sessionId=abc123');
      store.storeCookies('http://other.com', 'userId=user456');
      
      store.clearDomain('example.com');
      
      assert.equal(store.getCookies('http://example.com'), '');
      assert.equal(store.getCookies('http://other.com'), 'userId=user456');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      store.storeCookies('http://example.com', ['sessionId=abc123', 'userId=user456']);
      store.storeCookies('http://other.com', 'token=xyz789');
      
      const stats = store.getStats();
      
      assert.equal(stats.domains, 2);
      assert.equal(stats.totalCookies, 3);
      assert.equal(stats.cookiesByDomain['example.com'], 2);
      assert.equal(stats.cookiesByDomain['other.com'], 1);
    });
  });
});

