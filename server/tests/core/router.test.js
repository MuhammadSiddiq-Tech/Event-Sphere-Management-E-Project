import { describe, it, expect } from '@jest/globals';
import { Router } from '../../src/core/router.js';

function noop() {}

describe('Router', () => {
  it('matches GET /users', () => {
    const r = new Router();
    r.get('/users', noop);
    const result = r.match('GET', '/users');
    expect(result).not.toBeNull();
    expect(result.handlers).toEqual([noop]);
    expect(result.params).toEqual({});
  });

  it('matches POST /users with multiple handlers', () => {
    const r = new Router();
    const h1 = () => {};
    const h2 = () => {};
    r.post('/users', h1, h2);
    const result = r.match('POST', '/users');
    expect(result.handlers).toEqual([h1, h2]);
  });

  it('returns null for unknown path', () => {
    const r = new Router();
    r.get('/users', noop);
    expect(r.match('GET', '/unknown')).toBeNull();
  });

  it('returns 405 for known path with wrong method', () => {
    const r = new Router();
    r.get('/users', noop);
    const result = r.match('POST', '/users');
    expect(result).toEqual({ status: 405, allowed: ['GET'] });
  });

  it('extracts :id param', () => {
    const r = new Router();
    r.get('/users/:id', noop);
    const result = r.match('GET', '/users/abc123');
    expect(result.params).toEqual({ id: 'abc123' });
  });

  it('extracts multiple params', () => {
    const r = new Router();
    r.get('/expos/:expoId/booths/:boothId', noop);
    const result = r.match('GET', '/expos/1/booths/2');
    expect(result.params).toEqual({ expoId: '1', boothId: '2' });
  });

  it('matches with trailing slash', () => {
    const r = new Router();
    r.get('/users', noop);
    const result = r.match('GET', '/users/');
    expect(result).not.toBeNull();
    expect(result.params).toEqual({});
  });

  it('group() prepends prefix to routes', () => {
    const r = new Router();
    r.group('/api/v1', (sub) => {
      sub.get('/users', noop);
      sub.post('/users', noop);
    });
    expect(r.match('GET', '/api/v1/users')).not.toBeNull();
    expect(r.match('POST', '/api/v1/users')).not.toBeNull();
    expect(r.match('GET', '/users')).toBeNull();
  });

  it('supports DELETE and PATCH methods', () => {
    const r = new Router();
    r.delete('/items/:id', noop);
    r.patch('/items/:id', noop);
    expect(r.match('DELETE', '/items/5').params).toEqual({ id: '5' });
    expect(r.match('PATCH', '/items/5').params).toEqual({ id: '5' });
  });

  it('collects all allowed methods for 405', () => {
    const r = new Router();
    r.get('/x', noop);
    r.post('/x', noop);
    const result = r.match('DELETE', '/x');
    expect(result.status).toBe(405);
    expect(result.allowed).toContain('GET');
    expect(result.allowed).toContain('POST');
  });
});
