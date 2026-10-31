/**
 * @module core/rate-limit
 * Sliding-window rate limiter with an in-memory Map store.
 */
import { RateLimitedError } from './errors.js';

/**
 * @class RateLimiter
 */
export class RateLimiter {
  /**
   * @param {object} options
   * @param {number} options.windowMs   - Window duration in ms
   * @param {number} options.max        - Max requests per window
   * @param {(ctx: object) => string} options.keyFn  - Extract rate-limit key from ctx
   * @param {Map} [options.store]       - Inject a custom Map (for testing)
   */
  constructor({ windowMs, max, keyFn, store }) {
    this.windowMs = windowMs;
    this.max = max;
    this.keyFn = keyFn;
    /** @type {Map<string, {count: number, resetAt: number}>} */
    this._store = store ?? new Map();
  }

  /**
   * Clean expired entries lazily on each request for the same key.
   * @param {string} key
   */
  _clean(key) {
    const entry = this._store.get(key);
    if (entry && Date.now() > entry.resetAt) {
      this._store.delete(key);
    }
  }

  /**
   * Returns an async middleware function.
   * @returns {(ctx: object, next: () => Promise<void>) => Promise<void>}
   */
  middleware() {
    return async (ctx, next) => {
      const key = this.keyFn(ctx);
      this._clean(key);

      const now = Date.now();
      let entry = this._store.get(key);
      if (!entry) {
        entry = { count: 0, resetAt: now + this.windowMs };
        this._store.set(key, entry);
      }

      entry.count += 1;
      const remaining = Math.max(0, this.max - entry.count);
      const resetSec = Math.ceil((entry.resetAt - now) / 1000);

      ctx.res.setHeader('X-RateLimit-Limit', String(this.max));
      ctx.res.setHeader('X-RateLimit-Remaining', String(remaining));
      ctx.res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

      if (entry.count > this.max) {
        ctx.res.setHeader('Retry-After', String(resetSec));
        throw new RateLimitedError(`Rate limit exceeded. Retry after ${resetSec}s`);
      }

      await next();
    };
  }
}

/**
 * Global rate limiter: 500 req / 15 min per IP.
 * @returns {RateLimiter}
 */
export function createGlobalLimiter() {
  return new RateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500,
    keyFn: (ctx) => ctx.req.socket?.remoteAddress ?? 'unknown',
  });
}

/**
 * Auth rate limiter: 10 req / 15 min per IP + email.
 * @returns {RateLimiter}
 */
export function createAuthLimiter() {
  return new RateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyFn: (ctx) => {
      const ip = ctx.req.socket?.remoteAddress ?? 'unknown';
      const email = ctx.body?.email ?? '';
      return `${ip}:${email}`;
    },
  });
}
