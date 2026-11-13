import { describe, expect, it } from 'vitest';
import { CLIENT_IP_HEADER, clientIp, clientIpFromForwardedFor, parseTrustedProxyHops, UNKNOWN_IP_BUCKET } from './client-ip';

describe('parseTrustedProxyHops', () => {
  it('defaults to no trusted proxy, and treats anything that is not a small whole number as none', () => {
    for (const value of [undefined, '', '0', 'one', '-1', '1.5', '99', '1 ']) expect(parseTrustedProxyHops(value)).toBe(0);
  });

  it('reads 1 to 5', () => {
    expect(parseTrustedProxyHops('1')).toBe(1);
    expect(parseTrustedProxyHops('3')).toBe(3);
  });
});

describe('clientIpFromForwardedFor', () => {
  it('trusts nothing when no proxy is configured, however the header looks', () => {
    expect(clientIpFromForwardedFor('203.0.113.9', 0)).toBeNull();
    expect(clientIpFromForwardedFor('1.2.3.4, 203.0.113.9', 0)).toBeNull();
  });

  it('takes the address the one trusted proxy saw: the last entry, never the first a client can write', () => {
    expect(clientIpFromForwardedFor('203.0.113.9', 1)).toBe('203.0.113.9');
    expect(clientIpFromForwardedFor('6.6.6.6, 7.7.7.7, 203.0.113.9', 1)).toBe('203.0.113.9');
  });

  it('skips as many entries from the right as there are trusted proxies', () => {
    expect(clientIpFromForwardedFor('6.6.6.6, 203.0.113.9, 10.0.0.2', 2)).toBe('203.0.113.9');
  });

  it('gives up when the chain is shorter than the trusted hops, or the entry is not an address', () => {
    expect(clientIpFromForwardedFor('203.0.113.9', 2)).toBeNull();
    expect(clientIpFromForwardedFor('not-an-ip', 1)).toBeNull();
    expect(clientIpFromForwardedFor('', 1)).toBeNull();
    expect(clientIpFromForwardedFor(null, 1)).toBeNull();
  });

  it('accepts IPv6', () => {
    expect(clientIpFromForwardedFor('2001:db8::1', 1)).toBe('2001:db8::1');
  });
});

describe('clientIp', () => {
  it('reads only the header the proxy writes, never x-forwarded-for', () => {
    expect(clientIp(new Headers({ [CLIENT_IP_HEADER]: '203.0.113.9' }))).toBe('203.0.113.9');
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.9' }))).toBeNull();
    expect(clientIp(new Headers({ [CLIENT_IP_HEADER]: 'garbage' }))).toBeNull();
    expect(clientIp(new Headers())).toBeNull();
  });

  it('names a shared bucket for an unknown address, so a limit is never skipped', () => {
    expect(UNKNOWN_IP_BUCKET).toBe('unknown');
  });
});
