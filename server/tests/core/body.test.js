import { describe, it, expect } from '@jest/globals';
import { PassThrough } from 'node:stream';
import { parseBody } from '../../src/core/body.js';
import { ApiError } from '../../src/core/errors.js';

function makeCtx(method, contentType, body, extraHeaders = {}) {
  const req = new PassThrough();
  req.method = method;
  req.headers = { 'content-type': contentType, ...extraHeaders };
  req.socket = { remoteAddress: '127.0.0.1' };

  const ctx = {
    req,
    method,
    body: null,
    files: null,
  };

  // Feed body data into stream
  if (body !== undefined) {
    setImmediate(() => {
      req.end(body);
    });
  }

  return ctx;
}

describe('parseBody', () => {
  it('parses a JSON body', async () => {
    const ctx = makeCtx('POST', 'application/json', JSON.stringify({ name: 'test' }));
    await parseBody(ctx);
    expect(ctx.body).toEqual({ name: 'test' });
  });

  it('is a no-op for GET requests', async () => {
    const ctx = makeCtx('GET', 'application/json', '{"x":1}');
    await parseBody(ctx);
    expect(ctx.body).toBeNull();
  });

  it('is a no-op for empty body with no content-type', async () => {
    const ctx = makeCtx('POST', '', undefined);
    setImmediate(() => ctx.req.end());
    await parseBody(ctx);
    expect(ctx.body).toBeNull();
  });

  it('does not throw for POST with empty JSON body', async () => {
    const ctx = makeCtx('POST', 'application/json', '');
    await expect(parseBody(ctx)).resolves.toBeUndefined();
    expect(ctx.body).toBeNull();
  });

  it('throws 400 PARSE_ERROR for malformed JSON', async () => {
    const ctx = makeCtx('POST', 'application/json', 'not-json');
    await expect(parseBody(ctx)).rejects.toMatchObject({
      status: 400,
      code: 'PARSE_ERROR',
    });
  });

  it('throws 415 for unsupported content-type with non-empty body', async () => {
    const ctx = makeCtx('POST', 'text/xml', '<root/>', { 'content-length': '8' });
    await expect(parseBody(ctx)).rejects.toMatchObject({
      status: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
  });

  it('does not throw 415 for unsupported type with empty body (content-length=0)', async () => {
    const ctx = makeCtx('POST', 'text/xml', '', { 'content-length': '0' });
    setImmediate(() => ctx.req.end());
    await expect(parseBody(ctx)).resolves.toBeUndefined();
  });

  it('throws 413 for body exceeding JSON limit', async () => {
    const bigBody = Buffer.alloc(1 * 1024 * 1024 + 1, 'x');
    const ctx = makeCtx('POST', 'application/json', bigBody);
    await expect(parseBody(ctx)).rejects.toMatchObject({
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
    });
  });

  it('is an ApiError for all thrown errors', async () => {
    const ctx = makeCtx('POST', 'application/json', 'not-json');
    try {
      await parseBody(ctx);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
    }
  });
});
