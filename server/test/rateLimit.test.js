import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// We'll test the rate limiter by making actual HTTP requests to the server
let serverProcess;
let baseUrl;

before(async () => {
  // Import and start the server
  const { createApp } = await import('../index.js');
  const app = createApp();

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
});

describe('Rate Limiting', () => {
  it('should allow requests under the rate limit', async () => {
    // Make 5 requests (well under the default 100/minute limit)
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
      assert.equal(response.status, 200, `Request ${i + 1} should succeed with 200`);
      
      // Check rate limit headers are present
      assert.ok(response.headers.has('ratelimit-limit'), 'Should have RateLimit-Limit header');
      assert.ok(response.headers.has('ratelimit-remaining'), 'Should have RateLimit-Remaining header');
      assert.ok(response.headers.has('ratelimit-reset'), 'Should have RateLimit-Reset header');
      
      const remaining = parseInt(response.headers.get('ratelimit-remaining'), 10);
      assert.ok(remaining >= 0, 'Remaining requests should be non-negative');
    }
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // Get the rate limit from environment or use default
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    
    // Make requests up to the limit + 1
    let lastResponse;
    let exceededAt = -1;
    
    for (let i = 0; i < maxRequests + 10; i++) {
      lastResponse = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
      
      if (lastResponse.status === 429) {
        exceededAt = i;
        break;
      }
    }
    
    // Should have hit rate limit
    assert.ok(exceededAt >= 0, 'Should have exceeded rate limit');
    assert.ok(exceededAt <= maxRequests, `Should exceed at or before ${maxRequests} requests`);
    
    // Check 429 response
    assert.equal(lastResponse.status, 429, 'Should return 429 Too Many Requests');
    
    // Check response body
    const body = await lastResponse.json();
    assert.equal(body.error, 'Rate limit exceeded', 'Should have correct error message');
    assert.ok(typeof body.retryAfter === 'number', 'Should have retryAfter field');
    assert.ok(body.retryAfter > 0, 'retryAfter should be positive');
    assert.ok(body.retryAfter <= 60, 'retryAfter should be within window (60 seconds)');
  });

  it('should include correct rate limit headers on 429 response', async () => {
    // First, exhaust the rate limit
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    
    for (let i = 0; i < maxRequests + 5; i++) {
      const response = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
      
      if (response.status === 429) {
        // Check headers on 429 response
        assert.ok(response.headers.has('ratelimit-limit'), 'Should have RateLimit-Limit header');
        assert.ok(response.headers.has('ratelimit-remaining'), 'Should have RateLimit-Remaining header');
        assert.ok(response.headers.has('ratelimit-reset'), 'Should have RateLimit-Reset header');
        assert.ok(response.headers.has('retry-after'), 'Should have Retry-After header');
        
        const remaining = parseInt(response.headers.get('ratelimit-remaining'), 10);
        assert.equal(remaining, 0, 'Remaining should be 0 when rate limited');
        
        const retryAfter = parseInt(response.headers.get('retry-after'), 10);
        assert.ok(retryAfter > 0, 'Retry-After should be positive');
        assert.ok(retryAfter <= 60, 'Retry-After should be within window');
        
        return; // Test passed
      }
    }
    
    assert.fail('Should have received 429 response');
  });

  it('should reset rate limit after window expires', async function() {
    // This test takes time, so increase timeout
    this.timeout = 70000; // 70 seconds
    
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
    
    // Make requests to exhaust limit
    let response;
    for (let i = 0; i < maxRequests + 5; i++) {
      response = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
      if (response.status === 429) break;
    }
    
    assert.equal(response.status, 429, 'Should be rate limited');
    
    // Wait for window to expire (add 2 seconds buffer)
    const waitTime = windowMs + 2000;
    console.log(`[test] Waiting ${waitTime}ms for rate limit window to reset...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Try again - should succeed
    response = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
    assert.equal(response.status, 200, 'Should succeed after rate limit window resets');
    
    // Check that remaining count is reset
    const remaining = parseInt(response.headers.get('ratelimit-remaining'), 10);
    assert.ok(remaining > 0, 'Should have requests remaining after reset');
  });

  it('should track different IPs independently', async () => {
    // Make a request with default IP
    const response1 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
    assert.equal(response1.status, 200, 'First IP should succeed');
    const remaining1 = parseInt(response1.headers.get('ratelimit-remaining'), 10);
    
    // Make a request with different X-Forwarded-For header
    const response2 = await fetch(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`, {
      headers: {
        'X-Forwarded-For': '203.0.113.1', // Different IP (TEST-NET-3)
      },
    });
    assert.equal(response2.status, 200, 'Second IP should succeed');
    const remaining2 = parseInt(response2.headers.get('ratelimit-remaining'), 10);
    
    // The second IP should have a fresh count (not affected by first IP's requests)
    // Note: This test is approximate because both IPs are making requests
    // In a real scenario, remaining2 should be close to the max limit
    assert.ok(remaining2 >= remaining1, 'Different IPs should have independent rate limits');
  });

  it('should not rate limit health check endpoint', async () => {
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    
    // Make many requests to health check (more than rate limit)
    for (let i = 0; i < maxRequests + 10; i++) {
      const response = await fetch(`${baseUrl}/api/proxy/ping`);
      assert.equal(response.status, 200, `Health check request ${i + 1} should always succeed`);
      
      // Health check should not have rate limit headers
      // (express-rate-limit skips adding headers when skip() returns true)
    }
  });
});

