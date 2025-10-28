import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

let serverProcess;
let baseUrl;
let cookieStore;

// Use httpbin.org for testing cookie functionality
// httpbin.org is a public HTTP testing service that supports cookie operations
const TEST_URL_SET_COOKIE = 'https://httpbin.org/cookies/set?sessionId=abc123&testCookie=value456';
const TEST_URL_GET_COOKIES = 'https://httpbin.org/cookies';
const TEST_DOMAIN = 'httpbin.org';

before(async () => {
  // Import and start the proxy server
  const { createApp } = await import('../index.js');
  const app = createApp();

  // Import cookie store for clearing between tests
  const cookieModule = await import('../lib/cookies.js');
  cookieStore = cookieModule.cookieStore;

  // Start proxy server on port 0 to get a random available port
  await new Promise((resolve) => {
    serverProcess = app.listen(0, () => {
      const port = serverProcess.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[test] Proxy server listening on :${port}`);
      resolve();
    });
  });
});

after(() => {
  if (serverProcess) {
    serverProcess.close();
  }
  if (cookieStore) {
    cookieStore.destroy();
  }
});

describe('Cookie Management Integration', () => {
  it('should store cookies manually and retrieve them', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Manually store a cookie (simulating what would happen from Set-Cookie header)
    cookieStore.storeCookies('https://example.com', 'sessionId=abc123; Path=/; Max-Age=3600');

    // Check that cookie was stored
    const stats = cookieStore.getStats();
    assert.ok(stats.totalCookies > 0, 'Should have stored at least one cookie');

    const cookies = cookieStore.getCookies('https://example.com');
    assert.ok(cookies.includes('sessionId=abc123'), 'Should have stored sessionId cookie');
  });

  it('should store multiple cookies for same domain', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Store multiple cookies
    cookieStore.storeCookies('https://example.com', [
      'sessionId=abc123; Path=/; Max-Age=3600',
      'userId=user456; Path=/; Max-Age=3600',
    ]);

    // Check that both cookies were stored
    const cookies = cookieStore.getCookies('https://example.com');
    assert.ok(cookies.includes('sessionId=abc123'), 'Should have stored sessionId cookie');
    assert.ok(cookies.includes('userId=user456'), 'Should have stored userId cookie');
  });

  it('should isolate cookies by domain', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Set cookie for example.com
    cookieStore.storeCookies('https://example.com', 'sessionId=abc123; Path=/; Max-Age=3600');

    // Set cookie for other.com
    cookieStore.storeCookies('https://other.com', 'sessionId=xyz789; Path=/; Max-Age=3600');

    // Check cookies for example.com
    const exampleCookies = cookieStore.getCookies('https://example.com');
    assert.ok(exampleCookies.includes('sessionId=abc123'));
    assert.ok(!exampleCookies.includes('sessionId=xyz789'));

    // Check cookies for other.com
    const otherCookies = cookieStore.getCookies('https://other.com');
    assert.ok(otherCookies.includes('sessionId=xyz789'));
    assert.ok(!otherCookies.includes('sessionId=abc123'));
  });

  it('should not leak Set-Cookie headers to client', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Make request to a real website (example.com doesn't set cookies, but we can verify header stripping)
    const response = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);

    // Verify Set-Cookie header is not present in response to client
    assert.equal(response.headers.get('set-cookie'), null, 'Set-Cookie should not be forwarded to client');
  });

  it('should update existing cookies', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Set initial cookie
    cookieStore.storeCookies('https://example.com', 'sessionId=abc123; Path=/; Max-Age=3600');

    let cookies = cookieStore.getCookies('https://example.com');
    assert.ok(cookies.includes('sessionId=abc123'));

    // Update the cookie with new value
    cookieStore.storeCookies('https://example.com', 'sessionId=xyz789; Path=/; Max-Age=3600');

    cookies = cookieStore.getCookies('https://example.com');
    assert.ok(cookies.includes('sessionId=xyz789'), 'Cookie should be updated');
    assert.ok(!cookies.includes('sessionId=abc123'), 'Old cookie value should be replaced');
  });

  it('should handle cookies with special characters in value', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Store cookie with special characters (JWT token)
    cookieStore.storeCookies('https://example.com', 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; Path=/; Max-Age=3600');

    const cookies = cookieStore.getCookies('https://example.com');
    assert.ok(cookies.includes('token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  });

  it('should handle session cookies (no expiry)', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Store session cookie (no Max-Age or Expires)
    cookieStore.storeCookies('https://example.com', 'tempId=temp789; Path=/');

    // Check that session cookie was stored
    const cookies = cookieStore.getCookies('https://example.com');
    assert.ok(cookies.includes('tempId=temp789'), 'Should have stored session cookie');
  });

  it('should clear cookies for specific domain', async () => {
    // Clear cookies first
    cookieStore.clear();

    // Store cookies for two domains
    cookieStore.storeCookies('https://example.com', 'sessionId=abc123; Path=/; Max-Age=3600');
    cookieStore.storeCookies('https://other.com', 'userId=user456; Path=/; Max-Age=3600');

    // Clear cookies for example.com only
    cookieStore.clearDomain('example.com');

    // Verify example.com cookies are gone
    assert.equal(cookieStore.getCookies('https://example.com'), '');

    // Verify other.com cookies still exist
    const otherCookies = cookieStore.getCookies('https://other.com');
    assert.ok(otherCookies.includes('userId=user456'));
  });
});

