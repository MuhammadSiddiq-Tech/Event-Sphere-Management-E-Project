import { describe, it, expect, jest } from '@jest/globals';
import { buildCtx } from '../../src/core/context.js';

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
    body: null,
    writeHead: jest.fn((status, hdrs) => {
      res.statusCode = status;
      if (hdrs) Object.assign(headers, hdrs);
    }),
    end: jest.fn((data) => {
      res.body = data;
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

describe('buildCtx', () => {
  it('sets method, path, query, params defaults', () => {
    const ctx = buildCtx(makeReq('GET', '/users?page=2'), makeRes());
    expect(ctx.method).toBe('GET');
    expect(ctx.path).toBe('/users');
    expect(ctx.query).toEqual({ page: '2' });
    expect(ctx.params).toEqual({});
    expect(ctx.body).toBeNull();
    expect(ctx.files).toBeNull();
    expect(ctx.cookies).toEqual({});
    expect(ctx.user).toBeNull();
  });

  it('uses x-request-id header when present', () => {
    const req = makeReq('GET', '/', { 'x-request-id': 'my-id' });
    const ctx = buildCtx(req, makeRes());
    expect(ctx.requestId).toBe('my-id');
  });

  it('generates a UUID requestId when header is absent', () => {
    const ctx = buildCtx(makeReq(), makeRes());
    expect(ctx.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('parses multiple query params', () => {
    const ctx = buildCtx(makeReq('GET', '/items?foo=bar&baz=1'), makeRes());
    expect(ctx.query).toEqual({ foo: 'bar', baz: '1' });
  });

  it('first value wins for duplicate query keys', () => {
    const ctx = buildCtx(makeReq('GET', '/x?a=1&a=2'), makeRes());
    expect(ctx.query.a).toBe('1');
  });

  it('does not crash with no logger', () => {
    expect(() => buildCtx(makeReq(), makeRes(), undefined)).not.toThrow();
  });

  it('log is a noop-compatible object when no logger provided', () => {
    const ctx = buildCtx(makeReq(), makeRes(), undefined);
    expect(() => ctx.log.info('test')).not.toThrow();
    expect(() => ctx.log.error('e')).not.toThrow();
  });
});

describe('ctx.json', () => {
  it('writes success envelope with status and data', () => {
    const res = makeRes();
    const ctx = buildCtx(makeReq('GET', '/'), res);
    ctx.json(200, { id: 1 });

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'application/json' })
    );
    const body = JSON.parse(res.body);
    expect(body).toEqual({ success: true, data: { id: 1 } });
  });

  it('includes meta when provided', () => {
    const res = makeRes();
    const ctx = buildCtx(makeReq('GET', '/'), res);
    ctx.json(200, [], { page: 1, total: 10 });
    const body = JSON.parse(res.body);
    expect(body.meta).toEqual({ page: 1, total: 10 });
  });
});

describe('ctx.noContent', () => {
  it('writes 204 with no body', () => {
    const res = makeRes();
    const ctx = buildCtx(makeReq(), res);
    ctx.noContent();
    expect(res.writeHead).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});
