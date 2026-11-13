import { isIP } from 'node:net';

/**
 * The one header that carries the client address inside the app. src/proxy.ts deletes whatever the client sent under
 * this name and writes the address it resolved from x-forwarded-for (or nothing), so everything downstream (Better
 * Auth's limiter and session record, `ctx.ip`, the accept-invite page) trusts one decision made at the edge.
 */
export const CLIENT_IP_HEADER = 'x-portal-client-ip';

/** Rate limit key used when the client address is unknown, so a limit is applied to everyone together, never skipped. */
export const UNKNOWN_IP_BUCKET = 'unknown';

/**
 * PORTAL_TRUSTED_PROXY_HOPS: how many reverse proxies sit in front of the app and write x-forwarded-for. Production
 * is Cloudflare then Caddy, and the Caddy block overwrites x-forwarded-for with the visitor's address, so it is 1.
 * Development has no proxy: 0, which trusts no forwarded header at all. Anything that is not a whole number from 1 to
 * 5 is 0, the safe choice (an unknown client, one shared bucket).
 */
export function parseTrustedProxyHops(value: string | undefined): number {
  return value !== undefined && /^[1-5]$/.test(value) ? Number(value) : 0;
}

/**
 * The client address from an x-forwarded-for value, counting `hops` trusted proxies from the right. The leftmost
 * entry is whatever the client wrote and is never used on its own: with one hop the answer is the last entry, the
 * address the trusted proxy itself saw (or wrote, when it overwrites the header). Null when no proxy is trusted, the
 * chain is shorter than the trusted hops, or the entry is not an IP address.
 * shortcut: IPv6 clients are keyed by full address, not by /64; a client with a whole /64 can rotate through it.
 */
export function clientIpFromForwardedFor(header: string | null, hops: number): string | null {
  if (hops < 1 || !header) return null;
  const entries = header.split(',').map((entry) => entry.trim());
  const entry = entries[entries.length - hops];
  return entry && isIP(entry) !== 0 ? entry : null;
}

/** The address the proxy resolved for this request, or null (a shared bucket for rate limits). */
export function clientIp(headers: Headers): string | null {
  const value = headers.get(CLIENT_IP_HEADER);
  return value && isIP(value) !== 0 ? value : null;
}
