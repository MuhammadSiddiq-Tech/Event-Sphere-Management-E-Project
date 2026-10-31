import { describe, it, expect, jest } from '@jest/globals';
import { secureHeaders, cors, sanitiseBody, normaliseQuery } from '../../src/core/security.js';

function makeRes() {
  const headers = {};
  const res = {
    headersSent: false,
    writableEnded: false,
    statusCode: 200,
    writeHead: jest.fn((status, hdrs) => {
      res.statusCode = status;
      res.headersSent = true;
      if (hdrs) Object.assign(headers, hdrs);
    }),
    end: jest.fn(() => {
      res.writableEnded = true;
    }),
    setHeader: jest.fn((k, v) => {
      headers[k] = v;
    }),
    getHeader: jest.fn((k) => headers[k]),
    _headers: headers,
  };
  return res;
}

function makeCtx(method = 'GET', overrides = {}) {
  const res = makeRes();
  return {
    req: { headers: {}, method, socket: { remoteAddress: '1.2.3.4' } },
    res,
    method,
    query: {},
    body: null,
    ...overrides,
  };
}

describe('secureHeaders', () => {
  it('sets X-Content-Type-Options: nosniff', async () => {
    const ctx = makeCtx();
    await secureHeaders(ctx, async () => {});
    expect(ctx.res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it('sets X-Frame-Options: DENY', async () => {
    const ctx = makeCtx();
    await secureHeaders(ctx, async () => {});
    expect(ctx.res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  it('sets Content-Security-Policy', async () => {
    const ctx = makeCtx();
    await secureHeaders(ctx, async () => {});
    const cspCall = ctx.res.setHeader.mock.calls.find((c) => c[0] === 'Content-Security-Policy');
    expect(cspCall).toBeTruthy();
    expect(cspCall[1]).toContain("default-src 'self'");
  });

  it('sets Referrer-Policy', async () => {
    const ctx = makeCtx();
    await secureHeaders(ctx, async () => {});
    expect(ctx.res.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    );
  });

  it('sets Permissions-Policy', async () => {
    const ctx = makeCtx();
    await secureHeaders(ctx, async () => {});
    const call = ctx.res.setHeader.mock.calls.find((c) => c[0] === 'Permissions-Policy');
    expect(call).toBeTruthy();
  });

  it('does NOT set HSTS in non-production', async () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const ctx = makeCtx();
    await secureHeaders(ctx, async () => {});
    const call = ctx.res.setHeader.mock.calls.find((c) => c[0] === 'Strict-Transport-Security');
    expect(call).toBeUndefined();
    process.env.NODE_ENV = orig;
  });

  it('sets HSTS in production', async () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const ctx = makeCtx();
    await secureHeaders(ctx, async () => {});
    const call = ctx.res.setHeader.mock.calls.find((c) => c[0] === 'Strict-Transport-Security');
    expect(call).toBeTruthy();
    process.env.NODE_ENV = orig;
  });
});

describe('cors', () => {
  const allowedOrigin = 'http://localhost:5173';
  const corsMiddleware = cors(allowedOrigin);

  it('handles OPTIONS preflight with matching origin: 204 + CORS headers', async () => {
    const ctx = makeCtx('OPTIONS');
    ctx.req.headers['origin'] = allowedOrigin;
    await corsMiddleware(ctx, async () => {});
    expect(ctx.res.writeHead).toHaveBeenCalledWith(
      204,
      expect.objectContaining({ 'Access-Control-Allow-Origin': allowedOrigin })
    );
    expect(ctx.res.end).toHaveBeenCalled();
  });

  it('handles OPTIONS preflight with non-matching origin: 204, no CORS headers', async () => {
    const ctx = makeCtx('OPTIONS');
    ctx.req.headers['origin'] = 'http://evil.com';
    await corsMiddleware(ctx, async () => {});
    // writeHead called with just 204, no headers object (or headers without ACAO)
    expect(ctx.res.writeHead).toHaveBeenCalledWith(204);
    const callArgs = ctx.res.writeHead.mock.calls[0];
    // If a second arg was passed it must not contain ACAO
    if (callArgs[1]) {
      expect(callArgs[1]).not.toHaveProperty('Access-Control-Allow-Origin');
    } else {
      // No headers arg at all — CORS headers correctly omitted
      expect(callArgs.length).toBe(1);
    }
  });

  it('sets ACAO header for matching origin on non-OPTIONS requests', async () => {
    const ctx = makeCtx('GET');
    ctx.req.headers['origin'] = allowedOrigin;
    await corsMiddleware(ctx, async () => {});
    expect(ctx.res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', allowedOrigin);
  });

  it('does NOT set ACAO for non-matching origin on non-OPTIONS', async () => {
    const ctx = makeCtx('GET');
    ctx.req.headers['origin'] = 'http://attacker.com';
    await corsMiddleware(ctx, async () => {});
    const call = ctx.res.setHeader.mock.calls.find((c) => c[0] === 'Access-Control-Allow-Origin');
    expect(call).toBeUndefined();
  });
});

describe('sanitiseBody', () => {
  it('removes keys starting with $', async () => {
    const ctx = makeCtx('POST');
    ctx.body = { $where: '1==1', name: 'ok' };
    await sanitiseBody(ctx, async () => {});
    expect(ctx.body).toEqual({ name: 'ok' });
    expect(ctx.body.$where).toBeUndefined();
  });

  it('removes dot-notation keys', async () => {
    const ctx = makeCtx('POST');
    ctx.body = { 'user.role': 'admin', name: 'alice' };
    await sanitiseBody(ctx, async () => {});
    expect(ctx.body).toEqual({ name: 'alice' });
  });

  it('sanitises nested objects', async () => {
    const ctx = makeCtx('POST');
    ctx.body = { nested: { $gt: 5, value: 1 } };
    await sanitiseBody(ctx, async () => {});
    expect(ctx.body).toEqual({ nested: { value: 1 } });
  });

  it('passes through body when no dangerous keys', async () => {
    const ctx = makeCtx('POST');
    ctx.body = { name: 'test', count: 3 };
    await sanitiseBody(ctx, async () => {});
    expect(ctx.body).toEqual({ name: 'test', count: 3 });
  });

  it('is a no-op when body is null', async () => {
    const ctx = makeCtx('GET');
    ctx.body = null;
    await sanitiseBody(ctx, async () => {});
    expect(ctx.body).toBeNull();
  });
});

describe('normaliseQuery', () => {
  it('converts array values to first element', async () => {
    const ctx = makeCtx('GET');
    ctx.query = { page: ['1', '2'] };
    await normaliseQuery(ctx, async () => {});
    expect(ctx.query.page).toBe('1');
  });

  it('leaves string values unchanged', async () => {
    const ctx = makeCtx('GET');
    ctx.query = { sort: 'name' };
    await normaliseQuery(ctx, async () => {});
    expect(ctx.query.sort).toBe('name');
  });
});
