import { describe, expect, it } from 'vitest';
import { buildCsp, createNonce, originsFromEnv } from './csp';

const directive = (csp: string, name: string): string[] =>
  (csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '').split(' ').slice(1);

describe('buildCsp', () => {
  const prod = buildCsp({ nonce: 'abc123', isDev: false, connectOrigins: ['https://acct.r2.cloudflarestorage.com'] });

  it('allows scripts only by nonce and strict-dynamic, and never unsafe-inline or unsafe-eval in production', () => {
    const scripts = directive(prod, 'script-src');
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it('allows inline style attributes but not inline style elements', () => {
    expect(directive(prod, 'style-src')).toEqual(["'self'", "'nonce-abc123'"]);
    expect(directive(prod, 'style-src-attr')).toEqual(["'unsafe-inline'"]);
  });

  it('blocks framing, plugins and base tag tricks, and keeps forms on our own origin', () => {
    expect(directive(prod, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(prod, 'object-src')).toEqual(["'none'"]);
    expect(directive(prod, 'base-uri')).toEqual(["'self'"]);
    expect(directive(prod, 'form-action')).toEqual(["'self'"]);
    expect(directive(prod, 'default-src')).toEqual(["'self'"]);
  });

  it('lists Turnstile for scripts, frames and connections, and the document bucket for connections', () => {
    expect(directive(prod, 'script-src')).toContain('https://challenges.cloudflare.com');
    expect(directive(prod, 'frame-src')).toEqual(['https://challenges.cloudflare.com', "'self'", 'https://acct.r2.cloudflarestorage.com']);
    expect(directive(prod, 'img-src')).toEqual(["'self'", 'data:', 'blob:', 'https://acct.r2.cloudflarestorage.com']);
    expect(directive(prod, 'media-src')).toEqual(["'self'", 'https://acct.r2.cloudflarestorage.com']);
    expect(directive(prod, 'connect-src')).toEqual(["'self'", 'https://challenges.cloudflare.com', 'https://acct.r2.cloudflarestorage.com']);
  });

  it('upgrades insecure requests in production only', () => {
    expect(prod).toContain('upgrade-insecure-requests');
    expect(buildCsp({ nonce: 'n', isDev: true, connectOrigins: [] })).not.toContain('upgrade-insecure-requests');
  });

  it('adds unsafe-eval, inline styles and the dev socket in development only', () => {
    const dev = buildCsp({ nonce: 'n', isDev: true, connectOrigins: [] });
    expect(directive(dev, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(dev, 'style-src')).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directive(prod, 'style-src')).not.toContain("'unsafe-inline'");
    expect(directive(dev, 'connect-src')).toContain('ws://localhost:*');
    expect(directive(prod, 'connect-src')).not.toContain('ws://localhost:*');
  });
});

describe('originsFromEnv', () => {
  it('keeps the origin of the R2 endpoint and of the Sentry DSN, and drops anything unset or malformed', () => {
    expect(
      originsFromEnv({ R2_ENDPOINT: 'https://acct.r2.cloudflarestorage.com/bucket', SENTRY_DSN: 'https://key@o1.ingest.sentry.io/42' }),
    ).toEqual(['https://acct.r2.cloudflarestorage.com', 'https://o1.ingest.sentry.io']);
    expect(originsFromEnv({ R2_ENDPOINT: 'not a url' })).toEqual([]);
    expect(originsFromEnv({})).toEqual([]);
  });
});

describe('createNonce', () => {
  it('is unpredictable and different every time', () => {
    const nonces = new Set(Array.from({ length: 50 }, () => createNonce()));
    expect(nonces.size).toBe(50);
    expect([...nonces][0]).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});
