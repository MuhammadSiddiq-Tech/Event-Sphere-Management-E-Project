/**
 * @module core/compress
 * Optional gzip/brotli compression for JSON responses above a size threshold.
 */
import { gzipSync, brotliCompressSync } from 'node:zlib';

const COMPRESS_THRESHOLD = 1024; // bytes

/**
 * Optionally compress a JSON response body based on Accept-Encoding.
 * Sets Content-Encoding and Vary headers if compression is applied.
 *
 * @param {import('./context.js').Ctx} ctx
 * @param {string} data  - The JSON string to potentially compress
 * @returns {Buffer}     - Compressed or uncompressed buffer
 */
export function compressResponse(ctx, data) {
  const accept = (ctx.req.headers['accept-encoding'] ?? '').toLowerCase();
  const buf = Buffer.from(data, 'utf8');

  if (buf.length <= COMPRESS_THRESHOLD) return buf;

  if (accept.includes('br')) {
    const compressed = brotliCompressSync(buf);
    ctx.res.setHeader('Content-Encoding', 'br');
    ctx.res.setHeader('Vary', 'Accept-Encoding');
    return compressed;
  }

  if (accept.includes('gzip')) {
    const compressed = gzipSync(buf);
    ctx.res.setHeader('Content-Encoding', 'gzip');
    ctx.res.setHeader('Vary', 'Accept-Encoding');
    return compressed;
  }

  return buf;
}
