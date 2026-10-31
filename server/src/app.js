/**
 * @module app
 * Creates and returns the Node.js HTTP request handler.
 * @returns {import('node:http').RequestListener}
 */
import { router } from './core/router.js';
import { createHandler } from './core/pipeline.js';
import { parseBody } from './core/body.js';
import { secureHeaders, cors, sanitiseBody, normaliseQuery } from './core/security.js';
import { createGlobalLimiter } from './core/rate-limit.js';
import { serveStatic } from './core/static.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

// Register the /health route
router.get('/health', async (ctx) => {
  ctx.json(200, { status: 'ok', timestamp: new Date().toISOString() });
});

const globalLimiter = createGlobalLimiter();

const globalMiddlewares = [
  secureHeaders,
  cors(env.CLIENT_URL),
  globalLimiter.middleware(),
  async (ctx, next) => {
    await parseBody(ctx);
    await next();
  },
  sanitiseBody,
  normaliseQuery,
  serveStatic(env.UPLOAD_DIR),
];

/**
 * Create and return the Node.js HTTP request handler.
 * @returns {import('node:http').RequestListener}
 */
export function createApp() {
  return createHandler(router, globalMiddlewares, logger);
}
