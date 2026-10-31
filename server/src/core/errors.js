/**
 * @module core/errors
 * Base error classes and central error handler for the HTTP core.
 */

/**
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * @param {number} status - HTTP status code
   * @param {string} code - Machine-readable error code (e.g. 'NOT_FOUND')
   * @param {string} message - Human-readable message
   * @param {unknown} [details] - Optional structured details (e.g. Zod issues)
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  /**
   * @param {string} [message]
   * @param {unknown} [details]
   */
  constructor(message = 'Validation failed', details) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthenticatedError extends ApiError {
  /** @param {string} [message] */
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHENTICATED', message);
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends ApiError {
  /** @param {string} [message] */
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  /** @param {string} [message] */
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  /** @param {string} [message] */
  constructor(message = 'Conflict') {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends ApiError {
  /** @param {string} [message] */
  constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMITED', message);
    this.name = 'RateLimitedError';
  }
}

/**
 * Central error handler. Converts any thrown value to the standard JSON envelope.
 * Must NOT be called if the response has already been sent (check res.headersSent first).
 *
 * @param {unknown} err
 * @param {import('./context.js').Ctx} ctx
 */
export function errorHandler(err, ctx) {
  if (ctx.res.headersSent) return;

  const isProduction = process.env.NODE_ENV === 'production';

  if (err instanceof ApiError) {
    const body = JSON.stringify({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    ctx.res.writeHead(err.status, { 'Content-Type': 'application/json' });
    ctx.res.end(body);
    return;
  }

  // Unexpected errors — log them
  if (ctx.log) {
    ctx.log.error({ err }, 'Unhandled error');
  }

  const body = JSON.stringify({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(isProduction ? {} : { stack: err?.stack }),
    },
  });
  ctx.res.writeHead(500, { 'Content-Type': 'application/json' });
  ctx.res.end(body);
}
