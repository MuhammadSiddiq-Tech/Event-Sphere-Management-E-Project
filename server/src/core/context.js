/**
 * @module core/context
 * Factory for the request context object passed to all handlers and middlewares.
 */
import { randomUUID } from 'node:crypto';
import { serialiseCookie } from './cookies.js';
import { compressResponse } from './compress.js';

/**
 * @typedef {Object} Ctx
 * @property {import('node:http').IncomingMessage} req
 * @property {import('node:http').ServerResponse} res
 * @property {string} method        - Uppercase HTTP method
 * @property {string} path          - URL pathname only (no query string)
 * @property {Record<string,string>} query   - Query params (first value wins)
 * @property {Record<string,string>} params  - Route params (set by router)
 * @property {unknown} body         - Parsed request body (set by body.js)
 * @property {unknown} files        - Parsed multipart files (set by body.js)
 * @property {Record<string,string>} cookies
 * @property {unknown} user         - Set by requireAuth middleware
 * @property {string} requestId
 * @property {object} log           - Pino child logger (or no-op)
 */

const noopLog = {
  info() {},
  warn() {},
  error() {},
  debug() {},
  trace() {},
  fatal() {},
  child() {
    return noopLog;
  },
};

/**
 * Build context object from raw Node.js req/res.
 * Accepts an optional logger so tests can inject a no-op.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {object} [logger]  - Pino logger (or compatible). Falls back to no-op.
 * @returns {Ctx}
 */
export function buildCtx(req, res, logger) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  const rawUrl = req.url ?? '/';
  const url = new URL(rawUrl, 'http://localhost');

  // Parse query string into plain object (first value wins for duplicates)
  const query = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (!(k in query)) query[k] = v;
  }

  const baseLog = logger ?? noopLog;
  const log = typeof baseLog.child === 'function' ? baseLog.child({ requestId }) : noopLog;

  const ctx = {
    req,
    res,
    method: req.method?.toUpperCase() ?? 'GET',
    path: url.pathname,
    query,
    params: {},
    body: null,
    files: null,
    cookies: {},
    user: null,
    requestId,
    log,

    /**
     * Send a JSON success response, with optional compression.
     * @param {number} status
     * @param {unknown} data
     * @param {unknown} [meta]
     */
    json(status, data, meta) {
      const payload = JSON.stringify({
        success: true,
        data,
        ...(meta !== undefined ? { meta } : {}),
      });
      const body = compressResponse(ctx, payload);
      if (!res.headersSent) {
        res.writeHead(status, {
          'Content-Type': 'application/json',
          'Content-Length': body.length,
        });
      }
      res.end(body);
    },

    /** Send 204 No Content */
    noContent() {
      if (!res.headersSent) {
        res.writeHead(204);
      }
      res.end();
    },

    /**
     * Set a cookie on the response.
     * @param {string} name
     * @param {string} value
     * @param {import('./cookies.js').CookieOptions} options
     */
    setCookie(name, value, options) {
      const header = serialiseCookie(name, value, options);
      const existing = res.getHeader('Set-Cookie') ?? [];
      const list = Array.isArray(existing) ? existing : [existing];
      res.setHeader('Set-Cookie', [...list, header]);
    },

    /**
     * Clear a cookie by setting maxAge=0.
     * @param {string} name
     * @param {import('./cookies.js').CookieOptions} [options]
     */
    clearCookie(name, options = {}) {
      const header = serialiseCookie(name, '', { ...options, maxAge: 0 });
      const existing = res.getHeader('Set-Cookie') ?? [];
      const list = Array.isArray(existing) ? existing : [existing];
      res.setHeader('Set-Cookie', [...list, header]);
    },
  };

  return ctx;
}
