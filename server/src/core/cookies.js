/**
 * @module core/cookies
 * Parse incoming Cookie headers and serialise Set-Cookie header strings.
 */

/**
 * Parse the Cookie header into a plain object.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Record<string, string>}
 */
export function parseCookies(req) {
  const header = req.headers['cookie'];
  if (!header) return {};

  return Object.fromEntries(
    header.split(';').map((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return [pair.trim(), ''];
      const name = pair.slice(0, idx).trim();
      const rawVal = pair.slice(idx + 1).trim();
      let value = rawVal;
      try {
        value = decodeURIComponent(rawVal);
      } catch {
        // Malformed percent-encoding — return raw value
        value = rawVal;
      }
      return [name, value];
    })
  );
}

/**
 * @typedef {Object} CookieOptions
 * @property {boolean} [httpOnly]
 * @property {boolean} [secure]
 * @property {'Strict'|'Lax'|'None'} [sameSite]
 * @property {string} [path='/']
 * @property {number} [maxAge]   - Seconds
 * @property {string} [domain]
 */

/**
 * Serialise a cookie into a Set-Cookie header string.
 * @param {string} name
 * @param {string} value
 * @param {CookieOptions} [options]
 * @returns {string}
 */
export function serialiseCookie(name, value, options = {}) {
  let str = `${name}=${encodeURIComponent(value)}`;
  const path = options.path ?? '/';
  str += `; Path=${path}`;
  if (options.maxAge !== undefined) str += `; Max-Age=${options.maxAge}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  return str;
}
