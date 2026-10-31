/**
 * @module core/body
 * Parse JSON and multipart request bodies. Sets ctx.body and ctx.files.
 */
import busboy from 'busboy';
import { ApiError } from './errors.js';

const JSON_LIMIT = 1 * 1024 * 1024; // 1 MB
const FILE_LIMIT = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES = 10;

/**
 * Read the raw body buffer from the request stream.
 * Rejects if the body exceeds `limit` bytes.
 * @param {import('node:http').IncomingMessage} req
 * @param {number} limit
 * @returns {Promise<Buffer>}
 */
function readRawBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let rejected = false;

    req.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > limit) {
        rejected = true;
        req.destroy();
        reject(new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds limit'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!rejected) resolve(Buffer.concat(chunks));
    });
    req.on('error', (err) => {
      if (!rejected) reject(err);
    });
  });
}

/**
 * Parse the request body into ctx.body and ctx.files.
 * No-op for GET/HEAD or requests without a content-type.
 *
 * @param {import('./context.js').Ctx} ctx
 * @returns {Promise<void>}
 */
export async function parseBody(ctx) {
  const { req } = ctx;
  const contentType = (req.headers['content-type'] ?? '').toLowerCase();
  const method = ctx.method;

  // GET/HEAD never have a body
  if (['GET', 'HEAD'].includes(method)) return;

  if (!contentType) return;

  if (contentType.startsWith('application/json')) {
    const buf = await readRawBody(req, JSON_LIMIT);
    if (buf.length === 0) return;
    try {
      ctx.body = JSON.parse(buf.toString('utf8'));
    } catch {
      throw new ApiError(400, 'PARSE_ERROR', 'Malformed JSON');
    }
    return;
  }

  if (contentType.startsWith('multipart/form-data')) {
    await new Promise((resolve, reject) => {
      const fields = {};
      const files = [];
      let limitHit = false;

      const bb = busboy({
        headers: req.headers,
        limits: { fileSize: FILE_LIMIT, files: MAX_FILES },
      });

      bb.on('field', (name, val) => {
        fields[name] = val;
      });

      bb.on('file', (fieldname, stream, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        let size = 0;

        stream.on('data', (chunk) => {
          size += chunk.length;
          chunks.push(chunk);
        });

        stream.on('limit', () => {
          if (!limitHit) {
            limitHit = true;
            reject(
              new ApiError(
                413,
                'FILE_TOO_LARGE',
                `File "${filename}" exceeds ${FILE_LIMIT / 1024 / 1024} MB limit`
              )
            );
          }
        });

        stream.on('end', () => {
          if (!limitHit) {
            files.push({ fieldname, filename, mimeType, size, buffer: Buffer.concat(chunks) });
          }
        });
      });

      bb.on('finish', () => {
        if (!limitHit) {
          ctx.body = fields;
          ctx.files = files;
          resolve();
        }
      });

      bb.on('error', (err) => {
        if (!limitHit) reject(err);
      });

      req.pipe(bb);
    });
    return;
  }

  // POST/PUT/PATCH with unrecognised content-type and non-empty body → 415
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const cl = parseInt(req.headers['content-length'] ?? '0', 10);
    if (cl > 0) {
      throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type not supported');
    }
  }
}
