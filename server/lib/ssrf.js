// SSRF validation utilities (no external dependencies)
// ESM module (root package.json has "type": "module")

import dns from 'node:dns/promises';
import net from 'node:net';

// Allowed URL schemes
export const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

// IPv4 helpers
function ipToInt(ip) {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return null;
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

function inCidr(ip, cidr) {
  // cidr like "10.0.0.0/8"
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  if (ipInt == null || baseInt == null || Number.isNaN(bits) || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

const BLOCKED_V4_CIDRS = [
  '127.0.0.0/8',   // loopback
  '10.0.0.0/8',    // RFC1918
  '172.16.0.0/12', // RFC1918
  '192.168.0.0/16',// RFC1918
  '169.254.0.0/16',// link-local
  '100.64.0.0/10', // CGNAT
  '0.0.0.0/8',     // current network
  '192.0.0.0/24',  // IETF Protocol Assignments
  '198.18.0.0/15', // benchmark tests
  '224.0.0.0/4',   // multicast
  '240.0.0.0/4',   // reserved
  '255.255.255.255/32', // broadcast
];

export function isPrivateIPv4(ip) {
  if (net.isIP(ip) !== 4) return false;
  return BLOCKED_V4_CIDRS.some((cidr) => inCidr(ip, cidr));
}

export function isBlockedIPv6(ip) {
  // Conservative checks for common unsafe ranges (without external libs)
  if (net.isIP(ip) !== 6) return false;
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;              // loopback
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7 unique local
  if (lower.startsWith('fe80:')) return true;    // link-local
  if (lower.startsWith('::ffff:')) {
    // IPv4-mapped IPv6, extract IPv4 and evaluate
    const last = lower.split(':').pop();
    if (last && last.includes('.')) {
      return isPrivateIPv4(last);
    }
  }
  return false;
}

export function isUnsafeScheme(urlString) {
  try {
    const u = new URL(urlString);
    return !ALLOWED_SCHEMES.has(u.protocol);
  } catch {
    return true; // invalid URL => unsafe
  }
}

export function isBlockedHostLiteral(hostname) {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost')) return true;
  if (net.isIP(lower) === 4) return isPrivateIPv4(lower);
  if (net.isIP(lower) === 6) return isBlockedIPv6(lower);
  return false; // domain name (DNS check required to be conclusive)
}

// Full async validator with DNS resolution (for server-side use)
export async function validateUrlWithDns(urlString) {
  try {
    const u = new URL(urlString);
    if (!ALLOWED_SCHEMES.has(u.protocol)) {
      return { ok: false, reason: 'Blocked scheme' };
    }

    const hostname = u.hostname;
    if (isBlockedHostLiteral(hostname)) {
      return { ok: false, reason: 'Blocked host literal' };
    }

    // Resolve A/AAAA records and evaluate addresses
    let addrs = [];
    try {
      // dns.lookup handles A/AAAA and CNAME resolution
      const res = await dns.lookup(hostname, { all: true });
      addrs = res.map((r) => r.address);
    } catch (e) {
      // If DNS fails, treat as invalid
      return { ok: false, reason: 'DNS resolution failed' };
    }

    for (const ip of addrs) {
      if (net.isIP(ip) === 4 && isPrivateIPv4(ip)) {
        return { ok: false, reason: 'Resolved to private IPv4' };
      }
      if (net.isIP(ip) === 6 && isBlockedIPv6(ip)) {
        return { ok: false, reason: 'Resolved to restricted IPv6' };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }
}

// Synchronous quick checks (no DNS) — good for client-side guardrails
export function validateUrlSync(urlString) {
  try {
    const u = new URL(urlString);
    if (!ALLOWED_SCHEMES.has(u.protocol)) {
      return { ok: false, reason: 'Blocked scheme' };
    }
    if (isBlockedHostLiteral(u.hostname)) {
      return { ok: false, reason: 'Blocked host literal' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }
}

