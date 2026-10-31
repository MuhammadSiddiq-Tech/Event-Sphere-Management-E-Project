import { describe, it, expect, jest } from '@jest/globals';
import {
  ApiError,
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitedError,
  errorHandler,
} from '../../src/core/errors.js';

function mockRes() {
  const headers = {};
  const res = {
    headersSent: false,
    writableEnded: false,
    writeHead: jest.fn((status, hdrs) => {
      res.statusCode = status;
      if (hdrs) Object.assign(headers, hdrs);
    }),
    end: jest.fn((body) => {
      res._body = body;
    }),
    setHeader: jest.fn((k, v) => {
      headers[k] = v;
    }),
    getHeader: jest.fn((k) => headers[k]),
    _headers: headers,
  };
  return res;
}

describe('ApiError', () => {
  it('stores status, code, message, name, and stack', () => {
    const err = new ApiError(400, 'BAD', 'bad request');
    expect(err.status).toBe(400);
    expect(err.code).toBe('BAD');
    expect(err.message).toBe('bad request');
    expect(err.name).toBe('ApiError');
    expect(err.stack).toBeTruthy();
  });

  it('stores optional details', () => {
    const err = new ApiError(400, 'BAD', 'msg', [{ field: 'x' }]);
    expect(err.details).toEqual([{ field: 'x' }]);
  });

  it('is an instance of Error', () => {
    expect(new ApiError(400, 'X', 'x')).toBeInstanceOf(Error);
  });
});

describe('error subclasses', () => {
  it('ValidationError: status 400, code VALIDATION_ERROR, instanceof ApiError', () => {
    const e = new ValidationError();
    expect(e.status).toBe(400);
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e).toBeInstanceOf(ApiError);
    expect(e.name).toBe('ValidationError');
  });

  it('UnauthenticatedError: status 401', () => {
    const e = new UnauthenticatedError();
    expect(e.status).toBe(401);
    expect(e.code).toBe('UNAUTHENTICATED');
  });

  it('ForbiddenError: status 403', () => {
    const e = new ForbiddenError();
    expect(e.status).toBe(403);
    expect(e.code).toBe('FORBIDDEN');
  });

  it('NotFoundError: status 404', () => {
    const e = new NotFoundError();
    expect(e.status).toBe(404);
    expect(e.code).toBe('NOT_FOUND');
  });

  it('ConflictError: status 409', () => {
    const e = new ConflictError();
    expect(e.status).toBe(409);
    expect(e.code).toBe('CONFLICT');
  });

  it('RateLimitedError: status 429', () => {
    const e = new RateLimitedError();
    expect(e.status).toBe(429);
    expect(e.code).toBe('RATE_LIMITED');
  });
});

describe('errorHandler', () => {
  it('writes ApiError envelope with correct status and code', () => {
    const res = mockRes();
    const ctx = { res, log: null };
    errorHandler(new NotFoundError('thing not found'), ctx);

    expect(res.writeHead).toHaveBeenCalledWith(
      404,
      expect.objectContaining({ 'Content-Type': 'application/json' })
    );
    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('thing not found');
  });

  it('includes details when ApiError has details', () => {
    const res = mockRes();
    const ctx = { res, log: null };
    errorHandler(new ValidationError('bad', [{ field: 'email' }]), ctx);
    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.error.details).toEqual([{ field: 'email' }]);
  });

  it('returns 500 with INTERNAL_ERROR for non-ApiError', () => {
    const res = mockRes();
    const ctx = { res, log: { error: jest.fn() } };
    errorHandler(new Error('boom'), ctx);
    expect(res.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('omits stack in production', () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    const ctx = { res, log: { error: jest.fn() } };
    errorHandler(new Error('boom'), ctx);
    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.error.stack).toBeUndefined();
    process.env.NODE_ENV = orig;
  });

  it('includes stack in non-production', () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    const ctx = { res, log: { error: jest.fn() } };
    errorHandler(new Error('boom'), ctx);
    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.error.stack).toBeTruthy();
    process.env.NODE_ENV = orig;
  });

  it('does nothing if headersSent', () => {
    const res = mockRes();
    res.headersSent = true;
    const ctx = { res, log: null };
    errorHandler(new NotFoundError(), ctx);
    expect(res.writeHead).not.toHaveBeenCalled();
  });
});
