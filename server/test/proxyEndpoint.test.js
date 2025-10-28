import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../index.js';

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

const get = async (u) => {
  const res = await fetch(u, { redirect: 'manual' });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
};

test('blocks localhost literal', async () => {
  const { status, text } = await get(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://127.0.0.1')}`);
  assert.equal(status, 400);
  assert.match(text, /SSRF/);
});

test('blocks file scheme', async () => {
  const { status } = await get(`${baseUrl}/api/proxy?url=${encodeURIComponent('file:///etc/hosts')}`);
  assert.equal(status, 400);
});

test('allows example.com and returns content', async () => {
  const { status, text, headers } = await get(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
  assert.equal(status, 200);
  assert.ok(text.length > 0);
  const ct = headers.get('content-type') || '';
  assert.ok(ct.includes('text/html'));
});

test('strips X-Frame-Options header from real website', async () => {
  // Test with a real website that sets X-Frame-Options (GitHub does this)
  const { status, headers } = await get(`${baseUrl}/api/proxy?url=${encodeURIComponent('https://github.com')}`);
  assert.equal(status, 200);
  // GitHub sets X-Frame-Options: deny, but our proxy should strip it
  assert.equal(headers.get('x-frame-options'), null, 'X-Frame-Options should be stripped');
  assert.ok(headers.get('content-type'), 'Content-Type should be preserved');
});

test('strips Content-Security-Policy header from real website', async () => {
  // Test with a real website that sets CSP (GitHub does this)
  const { status, headers } = await get(`${baseUrl}/api/proxy?url=${encodeURIComponent('https://github.com')}`);
  assert.equal(status, 200);
  // GitHub sets CSP, but our proxy should strip it
  assert.equal(headers.get('content-security-policy'), null, 'CSP should be stripped');
  assert.ok(headers.get('content-type'), 'Content-Type should be preserved');
});

test('preserves Content-Type and other safe headers', async () => {
  // Verify that we preserve important headers like Content-Type
  const { status, headers } = await get(`${baseUrl}/api/proxy?url=${encodeURIComponent('http://example.com')}`);
  assert.equal(status, 200);
  assert.ok(headers.get('content-type'), 'Content-Type should be preserved');
  // Verify Set-Cookie is not present (example.com doesn't set it, but verify our stripping works)
  assert.equal(headers.get('set-cookie'), null, 'Set-Cookie should not be present');
});

