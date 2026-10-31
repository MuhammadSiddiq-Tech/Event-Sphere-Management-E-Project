/**
 * @module core/security
 * In-house security middlewares: secure headers, CORS, NoSQL sanitiser, query normaliser.
 */
import { ApiError } from './errors.js';

const MAX_SANITISE_DEPTH = 20;

/**
 * Recursively remove keys that start with '$' or contain '.' (NoSQL injection prevention).
 * @param {unknown} obj
 * @param {number} [depth]
 * @returns {unknown}
 */
function sanitise(obj, depth = 0) {
  if (depth > MAX_SANITISE_DEPTH) {
    throw new ApiError(400, 'PAYLOAD_TOO_DEEP', 'Request body nesting exceeds maximum depth');
  }
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitise(item, depth + 1));

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitise(val, depth + 1);
  }
  return clean;
}

/**
 * Set security-related response headers on every request.
 * @param {import('./context.js').Ctx} ctx
 * @param {() => Promise<void>} next
 */
export async function secureHeaders(ctx, next) {
  ctx.res.setHeader('X-Content-Type-Options', 'nosniff');
  ctx.res.setHeader('X-Frame-Options', 'DENY');
  ctx.res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' ws: wss:; " +
      "font-src 'self' data:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
  );
  ctx.res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  ctx.res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  ctx.res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    ctx.res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  await next();
}

/**
 * CORS middleware factory.
 * Handles preflight OPTIONS requests and sets CORS headers for matching origins.
 *
 * @param {string} allowedOrigin - The single allowed origin (e.g. 'http://localhost:5173')
 * @returns {(ctx: import('./context.js').Ctx, next: () => Promise<void>) => Promise<void>}
 */
export function cors(allowedOrigin) {
  return async function corsMiddleware(ctx, next) {
    const origin = ctx.req.headers['origin'];
    const originMatches = origin === allowedOrigin;

    if (ctx.method === 'OPTIONS') {
      if (originMatches) {
        ctx.res.writeHead(204, {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Request-ID',
          'Access-Control-Max-Age': '86400',
        });
      } else {
        ctx.res.writeHead(204);
      }
      ctx.res.end();
      return; // Do NOT call next() for OPTIONS
    }

    if (originMatches) {
      ctx.res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      ctx.res.setHeader('Access-Control-Allow-Credentials', 'true');
      ctx.res.setHeader('Vary', 'Origin');
    }
    await next();
  };
}

/**
 * Remove dangerous keys (MongoDB operators, dot-notation) from ctx.body.
 * Must run after body parsing.
 * @param {import('./context.js').Ctx} ctx
 * @param {() => Promise<void>} next
 */
export async function sanitiseBody(ctx, next) {
  if (ctx.body && typeof ctx.body === 'object') {
    ctx.body = sanitise(ctx.body);
  }
  await next();
}

/**
 * Normalise query params — ensure each value is a string, not an array.
 * @param {import('./context.js').Ctx} ctx
 * @param {() => Promise<void>} next
 */
export async function normaliseQuery(ctx, next) {
  for (const [key, val] of Object.entries(ctx.query)) {
    if (Array.isArray(val)) ctx.query[key] = val[0];
  }
  await next();
}
