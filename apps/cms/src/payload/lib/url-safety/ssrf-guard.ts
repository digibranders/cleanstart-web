/**
 * Synchronous host-safety check for any URL the CMS server is about
 * to fetch on behalf of an editor or a cron-extracted body link.
 *
 * Rejects:
 *   - literal IPv4 in loopback (127/8), private (10/8, 172.16/12,
 *     192.168/16), link-local / cloud-metadata (169.254/16),
 *     unspecified (0/8), broadcast (255.255.255.255).
 *   - literal IPv6 loopback (::1), unique-local (fc00::/7),
 *     link-local (fe80::/10), unspecified (::), and IPv4-mapped
 *     forms (::ffff:127.0.0.1).
 *   - reserved hostnames `localhost`, `*.localhost`, `*.local`,
 *     `*.internal`, `*.lan`, `*.intranet`.
 *
 * Synchronous on purpose — does NOT do DNS. A defense in depth would
 * resolve the host and re-check, but DNS lookup is async + gives an
 * attacker a TOCTOU window between check and fetch. We keep the
 * guard cheap and pair it with `redirect: 'manual'` at the fetch
 * site so a 3xx into an internal IP can't bypass us either.
 */

const PRIVATE_IPV4 = [
  /^127\./, // loopback
  /^10\./, // RFC1918
  /^192\.168\./, // RFC1918
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC1918
  /^169\.254\./, // link-local + cloud metadata
  /^0\./, // unspecified
  /^255\.255\.255\.255$/, // broadcast
] as const;

const PRIVATE_IPV6_PREFIXES = [
  '::1', // loopback
  '::', // unspecified (and a bare 0:0:0:0:0:0:0:0)
] as const;

const SUSPICIOUS_HOSTNAME_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.intranet',
] as const;

const SUSPICIOUS_HOSTNAMES = ['localhost'] as const;

const isLiteralIPv4 = (host: string): boolean => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);

const isPrivateIPv4 = (host: string): boolean =>
  PRIVATE_IPV4.some((rx) => rx.test(host));

const stripIPv6Brackets = (host: string): string =>
  host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;

const isLiteralIPv6 = (host: string): boolean => host.includes(':');

const normalizeIPv6 = (host: string): string =>
  host.toLowerCase().replace(/^\[+|\]+$/g, '');

const isPrivateIPv6 = (raw: string): boolean => {
  const host = normalizeIPv6(stripIPv6Brackets(raw));
  if (PRIVATE_IPV6_PREFIXES.includes(host as (typeof PRIVATE_IPV6_PREFIXES)[number])) {
    return true;
  }
  // unique-local fc00::/7 → first byte 0xfc or 0xfd
  if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return true;
  // link-local fe80::/10 → fe80–febf
  if (/^fe[89ab][0-9a-f]?:/.test(host)) return true;

  // IPv4-mapped (::ffff:a.b.c.d) — recurse the IPv4 portion. Node's
  // URL serialiser may also compress to the 16-bit-hex pair form
  // (`::ffff:7f00:1` ≡ `::ffff:127.0.0.1`); decode both shapes.
  const mappedDotted = host.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mappedDotted?.[1] && isPrivateIPv4(mappedDotted[1])) return true;
  const mappedHex = host.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex?.[1] && mappedHex[2]) {
    const hi = Number.parseInt(mappedHex[1], 16);
    const lo = Number.parseInt(mappedHex[2], 16);
    if (Number.isFinite(hi) && Number.isFinite(lo)) {
      const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      if (isPrivateIPv4(ipv4)) return true;
    }
  }
  return false;
};

const isSuspiciousHostname = (host: string): boolean => {
  const lower = host.toLowerCase();
  if (SUSPICIOUS_HOSTNAMES.includes(lower as (typeof SUSPICIOUS_HOSTNAMES)[number])) {
    return true;
  }
  return SUSPICIOUS_HOSTNAME_SUFFIXES.some((suffix) => lower.endsWith(suffix));
};

export type SsrfRejectReason =
  | 'invalid-url'
  | 'non-http-protocol'
  | 'literal-private-ipv4'
  | 'literal-private-ipv6'
  | 'reserved-hostname';

export type SsrfCheckResult =
  | { readonly ok: true; readonly host: string }
  | { readonly ok: false; readonly reason: SsrfRejectReason };

/**
 * Decide whether a URL is safe to fetch from the CMS server. Caller
 * should treat anything other than `ok: true` as a hard reject.
 */
export const isSafePublicHttpUrl = (raw: string): SsrfCheckResult => {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid-url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'non-http-protocol' };
  }
  const host = parsed.hostname;
  if (host.length === 0) return { ok: false, reason: 'invalid-url' };

  if (isLiteralIPv4(host)) {
    if (isPrivateIPv4(host)) return { ok: false, reason: 'literal-private-ipv4' };
    return { ok: true, host };
  }
  if (isLiteralIPv6(host)) {
    if (isPrivateIPv6(host)) return { ok: false, reason: 'literal-private-ipv6' };
    return { ok: true, host };
  }
  if (isSuspiciousHostname(host)) {
    return { ok: false, reason: 'reserved-hostname' };
  }
  return { ok: true, host };
};
