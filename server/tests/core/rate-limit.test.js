import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { RateLimiter, createGlobalLimiter, createAuthLimiter } from '../../src/core/rate-limit.js';
import { RateLimitedError } from '../../src/core/errors.js';

function makeCtx(ip = '1.2.3.4', email = '') {
  const headers = {};
  const res = {
    setHeader: jest.fn((k, v) => {
      headers[k] = v;
    }),
    getHeader: jest.fn((k) => headers[k]),
    _headers: headers,
  };
  return {
    req: { socket: { remoteAddress: ip }, headers: {}, body: { email } },
    res,
    body: { email },
  };
}

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests under the limit', async () => {
    const store = new Map();
    const limiter = new RateLimiter({
      windowMs: 60_000,
      max: 3,
      keyFn: (ctx) => ctx.req.socket.remoteAddress,
      store,
    });
    const mw = limiter.middleware();
    const ctx = makeCtx();

    await mw(ctx, async () => {});
    await mw(ctx, async () => {});

    expect(ctx.res._headers['X-RateLimit-Remaining']).toBe('1');
  });

  it('allows the max-th request but blocks the (max+1)-th', async () => {
    const store = new Map();
    const limiter = new RateLimiter({
      windowMs: 60_000,
      max: 3,
      keyFn: (ctx) => ctx.req.socket.remoteAddress,
      store,
    });
    const mw = limiter.middleware();
    const ctx = makeCtx();
    const noop = async () => {};

    await mw(ctx, noop);
    await mw(ctx, noop);
    await mw(ctx, noop); // 3rd = at limit, should pass

    await expect(mw(ctx, noop)).rejects.toBeInstanceOf(RateLimitedError);
  });

  it('sets Retry-After header when limit exceeded', async () => {
    const store = new Map();
    const limiter = new RateLimiter({
      windowMs: 60_000,
      max: 1,
      keyFn: (ctx) => ctx.req.socket.remoteAddress,
      store,
    });
    const mw = limiter.middleware();
    const ctx = makeCtx();

    await mw(ctx, async () => {});
    try {
      await mw(ctx, async () => {});
    } catch {
      // expected
    }
    expect(ctx.res._headers['Retry-After']).toBeDefined();
  });

  it('resets counter after window expires', async () => {
    const store = new Map();
    const windowMs = 60_000;
    const limiter = new RateLimiter({
      windowMs,
      max: 1,
      keyFn: (ctx) => ctx.req.socket.remoteAddress,
      store,
    });
    const mw = limiter.middleware();
    const ctx = makeCtx();
    const noop = async () => {};

    await mw(ctx, noop); // 1st — ok
    await expect(mw(ctx, noop)).rejects.toBeInstanceOf(RateLimitedError); // 2nd — blocked

    // Advance clock past window
    jest.advanceTimersByTime(windowMs + 1);

    // Should succeed again
    await expect(mw(ctx, noop)).resolves.toBeUndefined();
  });

  it('tracks different keys independently', async () => {
    const store = new Map();
    const limiter = new RateLimiter({
      windowMs: 60_000,
      max: 1,
      keyFn: (ctx) => ctx.req.socket.remoteAddress,
      store,
    });
    const mw = limiter.middleware();
    const ctx1 = makeCtx('1.1.1.1');
    const ctx2 = makeCtx('2.2.2.2');

    await mw(ctx1, async () => {});
    await expect(mw(ctx1, async () => {})).rejects.toBeInstanceOf(RateLimitedError);
    // Different key — should succeed
    await expect(mw(ctx2, async () => {})).resolves.toBeUndefined();
  });
});

describe('createGlobalLimiter', () => {
  it('has max=500 and windowMs=15*60*1000', () => {
    const l = createGlobalLimiter();
    expect(l.max).toBe(500);
    expect(l.windowMs).toBe(15 * 60 * 1000);
  });
});

describe('createAuthLimiter', () => {
  it('has max=10', () => {
    const l = createAuthLimiter();
    expect(l.max).toBe(10);
  });
});
