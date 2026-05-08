import { describe, expect, it } from 'vitest';

import { isSafePublicHttpUrl } from './ssrf-guard';

describe('isSafePublicHttpUrl', () => {
  it('accepts well-formed public https URLs', () => {
    expect(isSafePublicHttpUrl('https://example.com/foo')).toEqual({
      ok: true,
      host: 'example.com',
    });
    expect(isSafePublicHttpUrl('http://www.example.org/x?y=1#z')).toMatchObject({
      ok: true,
    });
  });

  it('rejects non-http(s) schemes', () => {
    expect(isSafePublicHttpUrl('ftp://example.com')).toMatchObject({
      ok: false,
      reason: 'non-http-protocol',
    });
    expect(isSafePublicHttpUrl('file:///etc/passwd')).toMatchObject({
      ok: false,
      reason: 'non-http-protocol',
    });
    expect(isSafePublicHttpUrl('javascript:alert(1)')).toMatchObject({
      ok: false,
      reason: 'non-http-protocol',
    });
  });

  it('rejects garbage / non-URL strings', () => {
    expect(isSafePublicHttpUrl('')).toMatchObject({ ok: false, reason: 'invalid-url' });
    expect(isSafePublicHttpUrl('not a url')).toMatchObject({
      ok: false,
      reason: 'invalid-url',
    });
  });

  it('rejects reserved hostnames', () => {
    expect(isSafePublicHttpUrl('http://localhost/x')).toMatchObject({
      ok: false,
      reason: 'reserved-hostname',
    });
    expect(isSafePublicHttpUrl('http://api.localhost/x')).toMatchObject({
      ok: false,
      reason: 'reserved-hostname',
    });
    expect(isSafePublicHttpUrl('http://server.local/')).toMatchObject({
      ok: false,
      reason: 'reserved-hostname',
    });
    expect(isSafePublicHttpUrl('http://app.internal/')).toMatchObject({
      ok: false,
      reason: 'reserved-hostname',
    });
  });

  it('rejects literal IPv4 in private / loopback / link-local / metadata ranges', () => {
    const cases = [
      'http://127.0.0.1/',
      'http://127.255.0.5/',
      'http://10.0.0.1/',
      'http://172.16.0.5/',
      'http://172.31.255.255/',
      'http://192.168.1.1/',
      'http://169.254.169.254/latest/meta-data/', // AWS / GCP / Azure metadata
      'http://0.0.0.0/',
      'http://255.255.255.255/',
    ];
    for (const url of cases) {
      const result = isSafePublicHttpUrl(url);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('literal-private-ipv4');
      }
    }
  });

  it('accepts public literal IPv4 addresses', () => {
    expect(isSafePublicHttpUrl('http://8.8.8.8/')).toMatchObject({ ok: true });
    expect(isSafePublicHttpUrl('http://1.1.1.1/x')).toMatchObject({ ok: true });
  });

  it('rejects literal IPv6 loopback / unique-local / link-local / mapped private', () => {
    const cases = [
      'http://[::1]/',
      'http://[fc00::1]/',
      'http://[fd00::1]/',
      'http://[fe80::1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://[::ffff:169.254.169.254]/',
    ];
    for (const url of cases) {
      const result = isSafePublicHttpUrl(url);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('literal-private-ipv6');
      }
    }
  });

  it('accepts public IPv6 addresses', () => {
    expect(isSafePublicHttpUrl('http://[2606:4700:4700::1111]/')).toMatchObject({
      ok: true,
    });
  });
});
