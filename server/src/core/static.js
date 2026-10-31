/**
 * @module core/static
 * Traversal-safe static file serving middleware for uploaded files.
 */
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import { join, resolve, extname, sep } from 'node:path';
import { ApiError } from './errors.js';

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain; charset=utf-8',
};

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

/**
 * Create a static file serving middleware for the /uploads prefix.
 *
 * @param {string} rootDir - Absolute or relative path to the uploads directory
 * @returns {(ctx: object, next: () => Promise<void>) => Promise<void>}
 */
export function serveStatic(rootDir) {
  const absRoot = resolve(rootDir);

  return async function staticMiddleware(ctx, next) {
    // Only handle /uploads/* paths
    if (!ctx.path.startsWith('/uploads/')) return next();

    const relativePath = ctx.path.slice('/uploads/'.length);

    // Reject empty paths
    if (!relativePath) return next();

    const filePath = join(absRoot, relativePath);

    // Resolve real path and verify it's under absRoot (prevent traversal)
    let realFilePath;
    try {
      realFilePath = await realpath(filePath);
    } catch {
      // File does not exist — let router handle 404
      return next();
    }

    // Ensure the resolved path is within absRoot (handles both / and \ separators)
    const rootWithSep = absRoot.endsWith(sep) ? absRoot : absRoot + sep;
    if (!realFilePath.startsWith(rootWithSep) && realFilePath !== absRoot) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    }

    let fileStat;
    try {
      fileStat = await stat(realFilePath);
    } catch {
      return next();
    }

    if (!fileStat.isFile()) return next();

    const ext = extname(realFilePath).toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';
    const disposition = IMAGE_EXTS.has(ext) ? 'inline' : 'attachment';
    const filename = relativePath.split('/').pop() ?? relativePath;

    ctx.res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileStat.size,
      'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });

    createReadStream(realFilePath).pipe(ctx.res);
  };
}
