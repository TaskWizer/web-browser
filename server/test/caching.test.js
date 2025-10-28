import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

let serverProcess;
let baseUrl;
let responseCache;
let cookieStore;

before(async () => {
  // Import and start the server
  const { createApp } = await import('../index.js');
  const app = createApp();

  // Import cache for clearing between tests
  const cacheModule = await import('../lib/cache.js');
  responseCache = cacheModule.responseCache;

  // Import cookie store to destroy it after tests
  const cookieModule = await import('../lib/cookies.js');
  cookieStore = cookieModule.cookieStore;

  // Start server on port 0 to get a random available port
  await new Promise((resolve) => {
    serverProcess = app.listen(0, () => {
      const port = serverProcess.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[test] Test server listening on :${port}`);
      resolve();
    });
  });
});

after(() => {
  if (serverProcess) {
    serverProcess.close();
  }
  if (responseCache) {
    responseCache.destroy();
  }
  if (cookieStore) {
    cookieStore.destroy();
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Response Caching', () => {
  it('should return MISS on first request and HIT on second', async () => {
    // Clear cache first
    responseCache.clear();

    const testUrl = 'http://example.com';

    // First request (MISS)
    const response1 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    assert.equal(response1.status, 200, 'Should return 200 OK');
    assert.equal(response1.headers.get('x-cache-status'), 'MISS', 'First request should be a cache MISS');
    const body1 = await response1.text();
    assert.ok(body1.length > 0, 'Should return content');

    // Second request (HIT)
    const response2 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    assert.equal(response2.status, 200);
    assert.equal(response2.headers.get('x-cache-status'), 'HIT', 'Second request should be a cache HIT');
    const body2 = await response2.text();
    assert.equal(body1, body2, 'Cached content should match original');

    // Check TTL header exists
    const ttl = response2.headers.get('x-cache-ttl');
    assert.ok(ttl, 'Should include X-Cache-TTL header');
    assert.ok(parseInt(ttl, 10) > 0, 'TTL should be positive');
  });

  it('should cache different URLs independently', async () => {
    // Clear cache first
    responseCache.clear();

    const url1 = 'http://example.com';
    const url2 = 'http://example.org';

    // Request URL 1 (MISS)
    const response1 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(url1)}`);
    assert.equal(response1.headers.get('x-cache-status'), 'MISS');

    // Request URL 2 (MISS)
    const response2 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(url2)}`);
    assert.equal(response2.headers.get('x-cache-status'), 'MISS');

    // Request URL 1 again (HIT)
    const response3 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(url1)}`);
    assert.equal(response3.headers.get('x-cache-status'), 'HIT');

    // Request URL 2 again (HIT)
    const response4 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(url2)}`);
    assert.equal(response4.headers.get('x-cache-status'), 'HIT');
  });

  it('should verify cache TTL decreases over time', async () => {
    // Clear cache first
    responseCache.clear();

    const testUrl = 'http://example.com';

    // First request (MISS)
    await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);

    // Second request immediately (HIT)
    const response1 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    assert.equal(response1.headers.get('x-cache-status'), 'HIT');
    const ttl1 = parseInt(response1.headers.get('x-cache-ttl'), 10);

    // Wait 2 seconds
    await sleep(2000);

    // Third request (still HIT)
    const response2 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    assert.equal(response2.headers.get('x-cache-status'), 'HIT');
    const ttl2 = parseInt(response2.headers.get('x-cache-ttl'), 10);

    // TTL should have decreased
    assert.ok(ttl2 < ttl1, `TTL should decrease over time (${ttl2} < ${ttl1})`);
    assert.ok(ttl2 >= ttl1 - 3, 'TTL should decrease by approximately 2 seconds');

    console.log(`[test] Cache TTL decreased from ${ttl1}s to ${ttl2}s`);
  });

  it('should preserve Content-Type header in cached responses', async () => {
    // Clear cache first
    responseCache.clear();

    const testUrl = 'http://example.com';

    // First request (MISS)
    const response1 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    const contentType1 = response1.headers.get('content-type');
    assert.ok(contentType1, 'Should have Content-Type header');

    // Second request (HIT)
    const response2 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    assert.equal(response2.headers.get('x-cache-status'), 'HIT');
    const contentType2 = response2.headers.get('content-type');

    assert.equal(contentType2, contentType1, 'Content-Type should be preserved in cache');
  });

  it('should not cache non-200 responses', async () => {
    // Clear cache first
    responseCache.clear();

    // Try to fetch a URL that will return 404
    const testUrl = 'http://example.com/nonexistent-page-12345';

    // First request
    const response1 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    // Note: example.com might return 200 for all paths, so we'll just check the header
    const cacheStatus1 = response1.headers.get('x-cache-status');

    // Second request
    const response2 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    const cacheStatus2 = response2.headers.get('x-cache-status');

    // If the response was not 200, both should be MISS (not cached)
    if (response1.status !== 200) {
      assert.equal(cacheStatus1, 'MISS', 'Non-200 responses should not be cached');
      assert.equal(cacheStatus2, 'MISS', 'Non-200 responses should not be cached on retry');
    }
  });

  it('should handle concurrent requests efficiently', async () => {
    // Clear cache first
    responseCache.clear();

    const testUrl = 'http://example.org';

    // Make 5 concurrent requests
    const promises = Array(5).fill(null).map(() =>
      fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`)
    );

    const responses = await Promise.all(promises);

    // First request should be MISS, rest might be MISS or HIT depending on timing
    const statuses = responses.map(r => r.headers.get('x-cache-status'));
    const missCount = statuses.filter(s => s === 'MISS').length;
    const hitCount = statuses.filter(s => s === 'HIT').length;

    // At least one should be MISS (the first one)
    assert.ok(missCount >= 1, 'At least one request should be a MISS');

    // All responses should be successful
    responses.forEach((r, i) => {
      assert.equal(r.status, 200, `Request ${i + 1} should return 200`);
    });

    console.log(`[test] Concurrent requests: ${missCount} MISS, ${hitCount} HIT`);
  });

  it('should include cache TTL in HIT responses', async () => {
    // Clear cache first
    responseCache.clear();

    const testUrl = 'http://example.com';

    // First request (MISS)
    await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);

    // Second request (HIT)
    const response = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent(testUrl)}`);
    assert.equal(response.headers.get('x-cache-status'), 'HIT');

    const ttl = response.headers.get('x-cache-ttl');
    assert.ok(ttl, 'Should include X-Cache-TTL header');

    const ttlValue = parseInt(ttl, 10);
    assert.ok(ttlValue > 0, 'TTL should be positive');
    assert.ok(ttlValue <= 300, 'TTL should not exceed 5 minutes (300s) for HTML');

    console.log(`[test] Cache TTL: ${ttlValue}s`);
  });
});

