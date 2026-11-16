import { describe, expect, it } from 'vitest';
import { assertSecureAppUrl, isHttpsOrLoopback, usesSecureCookies } from './app-url';

describe('assertSecureAppUrl', () => {
  it('refuses a plain http public origin in production, because cookies, invite links and reset links would travel in the clear', () => {
    expect(() => assertSecureAppUrl('production', 'http://partners.cleanstart.com')).toThrow(/APP_URL must be https/);
  });

  it('accepts https in production, and anything in development and test', () => {
    expect(() => assertSecureAppUrl('production', 'https://partners.cleanstart.com')).not.toThrow();
    expect(() => assertSecureAppUrl('development', 'http://localhost:3204')).not.toThrow();
    expect(() => assertSecureAppUrl('test', 'http://localhost:3004')).not.toThrow();
  });

  it('lets a production build run on this machine over http, for a local smoke test', () => {
    expect(() => assertSecureAppUrl('production', 'http://localhost:3004')).not.toThrow();
    expect(() => assertSecureAppUrl('production', 'http://127.0.0.1:3004')).not.toThrow();
  });
});

describe('isHttpsOrLoopback', () => {
  it.each(['http://localhost.evil.com', 'http://localhost@evil.com', 'http://127.0.0.1.evil.com', 'http://0.0.0.0', 'http://evil.com/localhost'])(
    'rejects the look-alike host %s',
    (appUrl) => {
      expect(isHttpsOrLoopback(appUrl)).toBe(false);
      expect(() => assertSecureAppUrl('production', appUrl)).toThrow(/APP_URL must be https/);
    },
  );

  it('rejects a string that is not a URL', () => {
    expect(isHttpsOrLoopback('not a url')).toBe(false);
  });

  it('accepts loopback hosts and https, whatever the case of the scheme', () => {
    expect(isHttpsOrLoopback('http://[::1]:3004')).toBe(true);
    expect(isHttpsOrLoopback('HTTPS://partners.cleanstart.com')).toBe(true);
  });
});

describe('usesSecureCookies', () => {
  it('agrees with the parsed URL: an uppercase scheme or surrounding spaces still get Secure cookies', () => {
    expect(usesSecureCookies('production', 'HTTPS://partners.cleanstart.com')).toBe(true);
    expect(usesSecureCookies('production', '  https://partners.cleanstart.com  ')).toBe(true);
    expect(usesSecureCookies('production', '  http://localhost:3004 ')).toBe(false);
    expect(usesSecureCookies('production', 'not a url')).toBe(false);
  });

  it('is on for https in production only', () => {
    expect(usesSecureCookies('production', 'https://partners.cleanstart.com')).toBe(true);
    expect(usesSecureCookies('production', 'http://localhost:3004')).toBe(false);
    expect(usesSecureCookies('development', 'https://x.example')).toBe(false);
  });
});
