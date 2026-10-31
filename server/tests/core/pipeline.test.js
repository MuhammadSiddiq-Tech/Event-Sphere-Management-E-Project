import { describe, it, expect, jest } from '@jest/globals';
import { compose, createHandler } from '../../src/core/pipeline.js';
import { Router } from '../../src/core/router.js';

function makeReq(method = 'GET', url = '/', headers = {}) {
  return {
    method,
    url,
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  };
}

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

describe('compose', () => {
  it('runs middlewares in order', async () => {
    const order = [];
    const a = async (ctx, next) => {
      order.push('a');
      await next();
    };
    const b = async (ctx, next) => {
      order.push('b');
      await next();
    };
    const c = async (ctx, next) => {
      order.push('c');
      await next();
    };
    await compose([a, b, c])({});
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('runs code after next() on the way out (onion order)', async () => {
    const order = [];
    const a = async (ctx, next) => {
      order.push('a-in');
      await next();
      order.push('a-out');
    };
    const b = async (ctx, next) => {
      order.push('b-in');
      await next();
      order.push('b-out');
    };
    const c = async (ctx, next) => {
      order.push('c');
      await next();
    };
    await compose([a, b, c])({});
    expect(order).toEqual(['a-in', 'b-in', 'c', 'b-out', 'a-out']);
  });

  it('propagates errors from middlewares', async () => {
    const fn = compose([
      // eslint-disable-next-line no-unused-vars
      async (_ctx, _next) => {
        throw new Error('middleware error');
      },
    ]);
    await expect(fn({})).rejects.toThrow('middleware error');
  });

  it('throws if next() is called multiple times', async () => {
    const fn = compose([
      async (_ctx, next) => {
        await next();
        await next(); // second call — should throw
      },
    ]);
    await expect(fn({})).rejects.toThrow('next() called multiple times');
  });

  it('works with async middlewares that await async work', async () => {
    const results = [];
    const delayed = async (ctx, next) => {
      await new Promise((r) => setTimeout(r, 1));
      results.push('done');
      await next();
    };
    await compose([delayed])({});
    expect(results).toEqual(['done']);
  });
});

describe('createHandler', () => {
  it('sends response when route matches', async () => {
    const r = new Router();
    r.get('/test', async (ctx) => {
      ctx.json(200, { ok: true });
    });
    const handler = createHandler(r, []);
    const req = makeReq('GET', '/test');
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 JSON for unknown route', async () => {
    const r = new Router();
    const handler = createHandler(r, []);
    const res = makeRes();
    await handler(makeReq('GET', '/nope'), res);
    expect(res.statusCode).toBe(404);
  });

  it('returns 405 JSON for wrong method', async () => {
    const r = new Router();
    r.get('/only-get', async (ctx) => ctx.json(200, {}));
    const handler = createHandler(r, []);
    const res = makeRes();
    await handler(makeReq('POST', '/only-get'), res);
    expect(res.statusCode).toBe(405);
  });

  it('runs global middlewares before route handler', async () => {
    const order = [];
    const r = new Router();
    r.get('/x', async (ctx) => {
      order.push('handler');
      ctx.json(200, {});
    });
    const mw = async (ctx, next) => {
      order.push('global');
      await next();
    };
    const handler = createHandler(r, [mw]);
    const res = makeRes();
    await handler(makeReq('GET', '/x'), res);
    expect(order).toEqual(['global', 'handler']);
  });

  it('catches errors from handlers and returns JSON error', async () => {
    const r = new Router();
    r.get('/boom', async () => {
      throw new Error('unexpected');
    });
    const handler = createHandler(r, []);
    const res = makeRes();
    await handler(makeReq('GET', '/boom'), res);
    expect(res.statusCode).toBe(500);
  });
});
