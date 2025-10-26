// Unit tests for SSRF utilities using Node's built-in test runner
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isPrivateIPv4,
  isBlockedIPv6,
  isUnsafeScheme,
  validateUrlSync,
} from '../lib/ssrf.js';

// IPv4 private and special ranges
const blockedIPv4 = [
  '127.0.0.1',
  '10.0.0.1',
  '172.16.0.1',
  '172.31.255.254',
  '192.168.1.1',
  '169.254.10.20',
  '100.64.0.1',
  '0.0.0.0',
  '255.255.255.255',
];

const allowedIPv4 = [
  '1.1.1.1',
  '8.8.8.8',
  '93.184.216.34', // example.com
];

test('isPrivateIPv4 blocks RFC1918, link-local, CGNAT, loopback, special', () => {
  for (const ip of blockedIPv4) {
    assert.equal(isPrivateIPv4(ip), true, `Expected ${ip} to be blocked`);
  }
  for (const ip of allowedIPv4) {
    assert.equal(isPrivateIPv4(ip), false, `Expected ${ip} to be allowed`);
  }
});

test('isBlockedIPv6 basic reserved checks', () => {
  assert.equal(isBlockedIPv6('::1'), true);
  assert.equal(isBlockedIPv6('fc00::1'), true);
  assert.equal(isBlockedIPv6('fd12:3456:789a::1'), true);
  assert.equal(isBlockedIPv6('fe80::1'), true);
  assert.equal(isBlockedIPv6('2001:4860:4860::8888'), false); // Google DNS IPv6
});

test('isUnsafeScheme blocks non-http(s)', () => {
  const bad = [
    'file:///etc/passwd',
    'ftp://example.com',
    'data:text/plain,hello',
    'javascript:alert(1)',
  ];
  for (const u of bad) {
    assert.equal(isUnsafeScheme(u), true, `Expected ${u} to be unsafe`);
  }
  const good = [
    'http://example.com',
    'https://example.com',
  ];
  for (const u of good) {
    assert.equal(isUnsafeScheme(u), false, `Expected ${u} to be safe`);
  }
});

test('validateUrlSync blocks obvious bad hosts and schemes', () => {
  const blocked = [
    'http://localhost',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://10.0.0.5',
    'http://192.168.0.7',
    'http://172.16.0.1',
    'http://169.254.1.5',
    'http://100.64.20.10',
    'file:///etc/passwd',
    'ftp://example.com',
    'data:text/plain,abc',
    'javascript:alert(1)',
  ];
  for (const u of blocked) {
    assert.equal(validateUrlSync(u).ok, false, `Expected ${u} to be blocked`);
  }

  const allowed = [
    'https://example.com',
    'http://1.1.1.1',
    'https://8.8.8.8',
  ];
  for (const u of allowed) {
    assert.equal(validateUrlSync(u).ok, true, `Expected ${u} to be allowed`);
  }
});

