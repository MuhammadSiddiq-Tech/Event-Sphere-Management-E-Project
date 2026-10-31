/**
 * @module core/pipeline
 * Koa-style middleware composer and HTTP request handler factory.
 */
import { buildCtx } from './context.js';
import { parseCookies } from './cookies.js';
import { errorHandler, NotFoundError, ApiError } from './errors.js';

/**
 * Compose an array of async middlewares into a single async function.
 * Each middleware receives (ctx, next) and must call next() to proceed.
 * Koa-style: middlewares form an onion — code after next() runs on the way out.
 *
 * @param {Array<(ctx: object, next: () => Promise<void>) => Promise<void>>} middlewares
 * @returns {(ctx: object) => Promise<void>}
 */
export function compose(middlewares) {
  return async function (ctx) {
    let index = -1;
    async function dispatch(i) {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      const fn = middlewares[i];
      if (!fn) return;
      await fn(ctx, () => dispatch(i + 1));
    }
    await dispatch(0);
  };
}

/**
 * Create the Node.js http request handler.
 *
 * @param {import('./router.js').Router} router
 * @param {Array<Function>} globalMiddlewares - Applied to every request before routing
 * @param {object} [logger] - Pino logger
 * @returns {import('node:http').RequestListener}
 */
export function createHandler(router, globalMiddlewares = [], logger) {
  return async function requestHandler(req, res) {
    const ctx = buildCtx(req, res, logger);

    // Populate cookies early so middlewares have them
    ctx.cookies = parseCookies(req);

    try {
      // Run global middlewares first
      const globalFn = compose(globalMiddlewares);
      await globalFn(ctx);

      // If global middleware already sent a response (e.g. OPTIONS preflight), stop here
      if (res.writableEnded) return;

      // Route matching
      const matched = router.match(ctx.method, ctx.path);

      if (matched === null) {
        throw new NotFoundError(`Route ${ctx.method} ${ctx.path} not found`);
      }

      if (matched.status === 405) {
        res.setHeader('Allow', matched.allowed.join(', '));
        throw new ApiError(405, 'METHOD_NOT_ALLOWED', `Method ${ctx.method} not allowed`);
      }

      // Assign params from matched route
      ctx.params = matched.params;

      // Run route-specific handlers (middlewares + controller)
      const routeFn = compose(matched.handlers);
      await routeFn(ctx);

      // If no response was sent, the handler forgot to call ctx.json
      if (!res.writableEnded) {
        throw new Error('Handler did not send a response');
      }
    } catch (err) {
      if (!res.headersSent) {
        errorHandler(err, ctx);
      }
    }
  };
}
