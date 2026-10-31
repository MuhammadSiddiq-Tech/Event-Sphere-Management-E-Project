/**
 * @module core/router
 * Path-matching router that compiles :param patterns to RegExps.
 */

/**
 * Compile a path pattern like '/expos/:id/booths' into a RegExp.
 * @param {string} pattern
 * @returns {{ regex: RegExp, paramNames: string[] }}
 */
function compilePath(pattern) {
  const paramNames = [];
  const regexStr = pattern
    .replace(/\//g, '\\/')
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return '([^\\/]+)';
    });
  // Case-sensitive to match HTTP spec; trailing slash optional
  return { regex: new RegExp(`^${regexStr}\\/?$`), paramNames };
}

export class Router {
  constructor() {
    /**
     * @type {Array<{method:string, regex:RegExp, paramNames:string[], handlers:Function[], path:string}>}
     */
    this._routes = [];
  }

  /**
   * @param {string} method
   * @param {string} path
   * @param {Function[]} handlers
   */
  _add(method, path, handlers) {
    const { regex, paramNames } = compilePath(path);
    this._routes.push({ method: method.toUpperCase(), regex, paramNames, handlers, path });
    return this;
  }

  /** @param {string} path @param {...Function} handlers */
  get(path, ...handlers) {
    return this._add('GET', path, handlers);
  }

  /** @param {string} path @param {...Function} handlers */
  post(path, ...handlers) {
    return this._add('POST', path, handlers);
  }

  /** @param {string} path @param {...Function} handlers */
  put(path, ...handlers) {
    return this._add('PUT', path, handlers);
  }

  /** @param {string} path @param {...Function} handlers */
  patch(path, ...handlers) {
    return this._add('PATCH', path, handlers);
  }

  /** @param {string} path @param {...Function} handlers */
  delete(path, ...handlers) {
    return this._add('DELETE', path, handlers);
  }

  /**
   * Prefix-group routes.
   * @param {string} prefix
   * @param {(r: Router) => void} fn
   * @returns {Router}
   */
  group(prefix, fn) {
    const sub = new Router();
    fn(sub);
    for (const route of sub._routes) {
      const fullPath = prefix + route.path;
      const { regex, paramNames } = compilePath(fullPath);
      this._routes.push({
        method: route.method,
        regex,
        paramNames,
        handlers: route.handlers,
        path: fullPath,
      });
    }
    return this;
  }

  /**
   * Match a request against registered routes.
   * @param {string} method
   * @param {string} path
   * @returns {{ handlers: Function[], params: Record<string,string> }
   *          | { status: 405, allowed: string[] }
   *          | null}
   */
  match(method, path) {
    const allowed = new Set();
    for (const route of this._routes) {
      const m = route.regex.exec(path);
      if (!m) continue;
      // Path matches
      if (route.method === method.toUpperCase()) {
        const params = Object.fromEntries(
          route.paramNames.map((name, i) => {
            let val = m[i + 1];
            try {
              val = decodeURIComponent(val);
            } catch {
              // keep raw value on malformed encoding
            }
            return [name, val];
          })
        );
        return { handlers: route.handlers, params };
      }
      allowed.add(route.method);
    }
    if (allowed.size > 0) return { status: 405, allowed: [...allowed] };
    return null;
  }
}

export const router = new Router();
export default router;
