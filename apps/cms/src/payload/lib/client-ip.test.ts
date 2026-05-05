import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clientIpFromHeaders } from './client-ip';

const headersOf = (entries: Record<string, string>) => ({
  get: (name: string): string | null => entries[name.toLowerCase()] ?? null,
});

beforeEach(() => {
  vi.stubEnv('TRUSTED_PROXY_HOPS', '0');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('clientIpFromHeaders', () => {
  it('prefers CF-Connecting-IP when present', () => {
    const ip = clientIpFromHeaders(
      headersOf({
        'cf-connecting-ip': '203.0.113.10',
        'x-real-ip': '198.51.100.5',
        'x-forwarded-for': '1.2.3.4',
      }),
    );
    expect(ip).toBe('203.0.113.10');
  });

  it('falls back to X-Real-IP when CF header is absent', () => {
    const ip = clientIpFromHeaders(
      headersOf({
        'x-real-ip': '198.51.100.5',
        'x-forwarded-for': '1.2.3.4',
      }),
    );
    expect(ip).toBe('198.51.100.5');
  });

  it('ignores X-Forwarded-For when TRUSTED_PROXY_HOPS=0 (default)', () => {
    const ip = clientIpFromHeaders(headersOf({ 'x-forwarded-for': '1.2.3.4' }));
    expect(ip).toBe('unknown');
  });

  it('ignores X-Forwarded-For when env unset (defaults to 0 hops)', () => {
    vi.unstubAllEnvs();
    const ip = clientIpFromHeaders(headersOf({ 'x-forwarded-for': '1.2.3.4' }));
    expect(ip).toBe('unknown');
  });

  it('honours the (length - hops) entry of XFF when TRUSTED_PROXY_HOPS=1', () => {
    vi.stubEnv('TRUSTED_PROXY_HOPS', '1');
    const ip = clientIpFromHeaders(
      headersOf({ 'x-forwarded-for': '203.0.113.10, 198.51.100.5' }),
    );
    // Trusted hop (rightmost) is the proxy. The client is the entry before it.
    expect(ip).toBe('203.0.113.10');
  });

  it('skips private/reserved IPs in XFF and picks the first public one', () => {
    vi.stubEnv('TRUSTED_PROXY_HOPS', '1');
    const ip = clientIpFromHeaders(
      headersOf({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1, 198.51.100.5' }),
    );
    expect(ip).toBe('203.0.113.10');
  });

  it('returns "unknown" when no usable header is present', () => {
    expect(clientIpFromHeaders(headersOf({}))).toBe('unknown');
  });

  it('cannot be spoofed by direct attackers (XFF without trusted hops)', () => {
    // The exact attack pattern: drop a forged XFF header on a direct hit.
    // Without TRUSTED_PROXY_HOPS configured, the helper must NOT trust it.
    const ip = clientIpFromHeaders(
      headersOf({ 'x-forwarded-for': '127.0.0.1, evil-spoof' }),
    );
    expect(ip).toBe('unknown');
  });
});
