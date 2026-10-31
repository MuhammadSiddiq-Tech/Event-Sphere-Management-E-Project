import { describe, it, expect } from '@jest/globals';
import { parseCookies, serialiseCookie } from '../../src/core/cookies.js';

describe('parseCookies', () => {
  it('parses simple key=value pairs', () => {
    const req = { headers: { cookie: 'a=1; b=2' } };
    expect(parseCookies(req)).toEqual({ a: '1', b: '2' });
  });

  it('returns empty object when cookie header is absent', () => {
    expect(parseCookies({ headers: {} })).toEqual({});
  });

  it('returns empty object when cookie header is empty string', () => {
    expect(parseCookies({ headers: { cookie: '' } })).toEqual({});
  });

  it('handles percent-encoded values', () => {
    const req = { headers: { cookie: 'token=hello%20world' } };
    expect(parseCookies(req)).toEqual({ token: 'hello world' });
  });

  it('handles cookie with no value', () => {
    const req = { headers: { cookie: 'flag' } };
    const result = parseCookies(req);
    expect(result.flag).toBe('');
  });

  it('handles malformed percent-encoding gracefully', () => {
    const req = { headers: { cookie: 'bad=%' } };
    // Should not throw; returns raw value
    expect(() => parseCookies(req)).not.toThrow();
  });
});

describe('serialiseCookie', () => {
  it('includes HttpOnly when set', () => {
    const s = serialiseCookie('token', 'abc', { httpOnly: true });
    expect(s).toContain('HttpOnly');
  });

  it('includes SameSite=Strict', () => {
    const s = serialiseCookie('token', 'abc', { sameSite: 'Strict' });
    expect(s).toContain('SameSite=Strict');
  });

  it('includes Path=/', () => {
    const s = serialiseCookie('token', 'abc', { path: '/' });
    expect(s).toContain('Path=/');
  });

  it('defaults path to /', () => {
    const s = serialiseCookie('x', 'y');
    expect(s).toContain('Path=/');
  });

  it('includes Max-Age=0 when clearing', () => {
    const s = serialiseCookie('token', '', { maxAge: 0 });
    expect(s).toContain('Max-Age=0');
  });

  it('includes Secure flag', () => {
    const s = serialiseCookie('token', 'v', { secure: true });
    expect(s).toContain('Secure');
  });

  it('percent-encodes values with spaces', () => {
    const s = serialiseCookie('x', 'a b');
    expect(s).toContain('a%20b');
  });

  it('builds a full cookie string', () => {
    const s = serialiseCookie('refresh', 'tok', {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 604800,
    });
    expect(s).toContain('refresh=');
    expect(s).toContain('HttpOnly');
    expect(s).toContain('Secure');
    expect(s).toContain('SameSite=Strict');
    expect(s).toContain('Max-Age=604800');
  });
});
