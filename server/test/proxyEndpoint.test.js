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

