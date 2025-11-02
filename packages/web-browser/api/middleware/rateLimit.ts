/**
 * Rate Limiting Middleware
 *
 * Uses Cloudflare Workers KV for distributed rate limiting
 */

import { createMiddleware } from 'hono/factory';
// Conditional import for shared package or mock
let createApiError: any;
let RATE_LIMIT_CONFIG: any;

try {
  const utils = require('@taskwizer/shared/utils');
  const constants = require('@taskwizer/shared/constants');
  createApiError = utils.createApiError;
  RATE_LIMIT_CONFIG = constants.RATE_LIMIT_CONFIG;
} catch (error) {
  // Fallback to mock for standalone builds
  const mock = require('../../src/shared-mock');
  createApiError = mock.createApiError;
  RATE_LIMIT_CONFIG = mock.RATE_LIMIT_CONFIG;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

interface ClientInfo {
  identifier: string;
  isAuth: boolean;
}

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const authContext = c.get('auth');
  const clientInfo = getClientInfo(c.req, authContext);

  const limit = authContext ?
    RATE_LIMIT_CONFIG.AUTHENTICATED_LIMIT :
    RATE_LIMIT_CONFIG.DEFAULT_LIMIT;

  const window = authContext ?
    RATE_LIMIT_CONFIG.AUTHENTICATED_WINDOW :
    RATE_LIMIT_CONFIG.DEFAULT_WINDOW;

  try {
    const rateLimitKey = `rate_limit:${clientInfo.identifier}`;
    const now = Date.now();

    // Get current rate limit info
    const current = await c.env.RATE_LIMIT_KV.get(rateLimitKey);
    let rateLimitInfo: RateLimitInfo;

    if (current) {
      rateLimitInfo = JSON.parse(current) as RateLimitInfo;

      // Reset window if expired
      if (now > rateLimitInfo.resetTime) {
        rateLimitInfo = {
          count: 1,
          resetTime: now + window,
        };
      } else {
        rateLimitInfo.count++;
      }
    } else {
      rateLimitInfo = {
        count: 1,
        resetTime: now + window,
      };
    }

    // Store updated rate limit info
    await c.env.RATE_LIMIT_KV.put(
      rateLimitKey,
      JSON.stringify(rateLimitInfo),
      { expirationTtl: Math.ceil(window / 1000) }
    );

    // Check if rate limit exceeded
    if (rateLimitInfo.count > limit) {
      const error = createApiError(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests',
        false,
        'Rate limit exceeded. Please try again later.',
        {
          limit,
          remaining: Math.max(0, limit - rateLimitInfo.count),
          resetTime: rateLimitInfo.resetTime,
          retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000),
        }
      );

      // Add rate limit headers
      c.res.headers.set('X-RateLimit-Limit', limit.toString());
      c.res.headers.set('X-RateLimit-Remaining', '0');
      c.res.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());
      c.res.headers.set('Retry-After', Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString());

      return c.json({
        success: false,
        error,
      }, 429);
    }

    // Add rate limit headers for successful requests
    const remaining = Math.max(0, limit - rateLimitInfo.count);
    c.res.headers.set('X-RateLimit-Limit', limit.toString());
    c.res.headers.set('X-RateLimit-Remaining', remaining.toString());
    c.res.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());

    await next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    await next();
  }
});

function getClientInfo(req: Request, authContext?: any): ClientInfo {
  // Try to get user ID from auth context
  if (authContext?.user?.id) {
    return {
      identifier: `user:${authContext.user.id}`,
      isAuth: true,
    };
  }

  // Fall back to IP address
  const forwardedFor = req.headers.get('CF-Connecting-IP') ||
                       req.headers.get('X-Forwarded-For') ||
                       req.headers.get('X-Real-IP');

  const clientIP = forwardedFor?.split(',')[0]?.trim() || 'unknown';

  return {
    identifier: `ip:${clientIP}`,
    isAuth: false,
  };
}