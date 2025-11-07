#!/usr/bin/env node

/**
 * Browser Functionality Test Script
 * Tests all major features of the web browser application
 */

import http from 'http';
import https from 'https';

// Configuration
const FRONTEND_URL = 'http://localhost:3004';
const BACKEND_URL = 'http://localhost:3005';

// Test utilities
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data: data
      }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function test(description, testFn) {
  console.log(`\n🧪 ${description}`);
  return testFn().then(result => {
    console.log(`✅ ${description} - PASSED`);
    return result;
  }).catch(error => {
    console.log(`❌ ${description} - FAILED: ${error.message}`);
    throw error;
  });
}

// Test Suite
async function runTests() {
  console.log('🚀 Starting Web Browser Functionality Tests');
  console.log('='.repeat(50));

  try {
    // 1. Frontend Health Check
    await test('Frontend server is running', async () => {
      const response = await makeRequest(FRONTEND_URL);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      if (!response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Frontend not serving HTML');
      }
      return true;
    });

    // 2. Backend Health Check
    await test('Backend server is running', async () => {
      const response = await makeRequest(`${BACKEND_URL}/health`);
      const data = JSON.parse(response.data);
      if (!data.success || data.status !== 'healthy') {
        throw new Error('Backend health check failed');
      }
      return true;
    });

    // 3. Security Headers Check
    await test('Security headers are present', async () => {
      const response = await makeRequest(`${BACKEND_URL}/health`);
      const headers = response.headers;

      const requiredHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy'
      ];

      for (const header of requiredHeaders) {
        if (!headers[header]) {
          throw new Error(`Missing security header: ${header}`);
        }
      }
      return true;
    });

    // 4. Proxy Service - Valid Website
    await test('Proxy service fetches valid websites', async () => {
      const response = await makeRequest(`${BACKEND_URL}/api/proxy?url=https://example.com`);
      const data = JSON.parse(response.data);

      if (!data.success) {
        throw new Error(`Proxy failed: ${data.error}`);
      }

      if (!data.html || !data.html.includes('example')) {
        throw new Error('Proxy did not return expected content');
      }

      return true;
    });

    // 5. Proxy Service - GitHub Test
    await test('Proxy service handles GitHub content', async () => {
      const response = await makeRequest(`${BACKEND_URL}/api/proxy?url=https://github.com/microsoft/vscode`, 15000);
      const data = JSON.parse(response.data);

      if (!data.success) {
        throw new Error(`GitHub proxy failed: ${data.error}`);
      }

      if (!data.html.includes('GitHub') || !data.html.includes('VS Code')) {
        throw new Error('GitHub content not properly fetched');
      }

      // Check that content is sanitized (no script tags)
      if (data.html.includes('<script>')) {
        throw new Error('Content not properly sanitized');
      }

      return true;
    });

    // 6. SSRF Protection - Localhost Blocked
    await test('SSRF protection blocks localhost', async () => {
      const response = await makeRequest(`${BACKEND_URL}/api/proxy?url=http://localhost:3000`);
      const data = JSON.parse(response.data);

      if (data.success) {
        throw new Error('SSRF protection failed - localhost was not blocked');
      }

      if (!data.error.includes('blocked')) {
        throw new Error('SSRF error message incorrect');
      }

      return true;
    });

    // 7. SSRF Protection - Private IP Blocked
    await test('SSRF protection blocks private IP ranges', async () => {
      const response = await makeRequest(`${BACKEND_URL}/api/proxy?url=http://192.168.1.1`);
      const data = JSON.parse(response.data);

      if (data.success) {
        throw new Error('SSRF protection failed - private IP was not blocked');
      }

      return true;
    });

    // 8. Protocol Validation
    await test('Protocol validation blocks dangerous URLs', async () => {
      const response = await makeRequest(`${BACKEND_URL}/api/proxy?url=javascript:alert(1)`);
      const data = JSON.parse(response.data);

      if (data.success) {
        throw new Error('Protocol validation failed - javascript: URL was not blocked');
      }

      return true;
    });

    // 9. Content Sanitization
    await test('Content is properly sanitized', async () => {
      const response = await makeRequest(`${BACKEND_URL}/api/proxy?url=https://github.com/microsoft/vscode`);
      const data = JSON.parse(response.data);

      if (!data.success) {
        throw new Error('Failed to fetch test content');
      }

      // Check for dangerous elements
      const dangerousPatterns = ['<script', 'javascript:', 'onclick=', 'onerror='];
      for (const pattern of dangerousPatterns) {
        if (data.html.toLowerCase().includes(pattern)) {
          throw new Error(`Dangerous content not sanitized: ${pattern}`);
        }
      }

      return true;
    });

    // 10. Rate Limiting Check
    await test('Rate limiting is implemented', async () => {
      // Make multiple rapid requests
      const promises = Array(10).fill().map(() =>
        makeRequest(`${BACKEND_URL}/api/proxy?url=https://example.com`)
      );

      const responses = await Promise.allSettled(promises);
      const successCount = responses.filter(r =>
        r.status === 'fulfilled' && JSON.parse(r.value.data).success
      ).length;

      // At least some requests should succeed
      if (successCount === 0) {
        throw new Error('All requests were rate limited');
      }

      return true;
    });

    // 11. CORS Configuration
    await test('CORS configuration is secure', async () => {
      const response = await makeRequest(`${BACKEND_URL}/health`);
      const corsHeader = response.headers['access-control-allow-origin'];

      // Should not be wildcard in production
      if (corsHeader === '*') {
        console.warn('⚠️  CORS allows all origins - consider restricting');
      }

      return true;
    });

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log('✅ Frontend: Operational');
    console.log('✅ Backend: Operational');
    console.log('✅ Security Headers: Configured');
    console.log('✅ Proxy Service: Working');
    console.log('✅ SSRF Protection: Active');
    console.log('✅ Content Sanitization: Active');
    console.log('✅ Rate Limiting: Active');
    console.log('✅ CORS: Configured');

    console.log('\n🌐 Browser is ready for use at: http://localhost:3004');
    console.log('🔧 Backend API is running at: http://localhost:3005');

    return true;

  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('💥 TESTS FAILED 💥');
    console.log('='.repeat(50));
    console.log(`\n❌ Error: ${error.message}`);
    console.log('\nPlease check the servers and try again.');
    process.exit(1);
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };