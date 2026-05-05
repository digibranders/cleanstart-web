/**
 * Trusted source for the client IP behind the planned proxy chain
 * (Cloudflare → Caddy → Payload).
 *
 * Header preference, in order:
 *   1. CF-Connecting-IP        — set by Cloudflare; cannot be spoofed
 *                                end-to-end when the origin only accepts
 *                                Cloudflare egress IPs (firewall layer).
 *   2. X-Real-IP               — set by Caddy when configured.
 *   3. X-Forwarded-For         — only honoured when TRUSTED_PROXY_HOPS > 0,
 *                                in which case we read the (Nth-from-the-right)
 *                                public IP. Defaults to ignoring XFF — an
 *                                attacker hitting the droplet directly cannot
 *                                spoof the rate-limit key.
 *   4. 'unknown' (a literal string used as the per-IP rate-limit bucket).
 */

const PRIVATE_RANGES = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^127\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const isPrivate = (ip: string): boolean => PRIVATE_RANGES.some((re) => re.test(ip));

const trim = (raw: string | null | undefined): string | undefined =>
  typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;

export type HeadersLike = {
  get(name: string): string | null;
};

export const clientIpFromHeaders = (headers: HeadersLike): string => {
  const cf = trim(headers.get('cf-connecting-ip'));
  if (cf) return cf;

  const real = trim(headers.get('x-real-ip'));
  if (real) return real;

  const trustedHopsRaw = process.env.TRUSTED_PROXY_HOPS;
  const trustedHops = trustedHopsRaw ? Number.parseInt(trustedHopsRaw, 10) : 0;
  if (Number.isFinite(trustedHops) && trustedHops > 0) {
    const xff = trim(headers.get('x-forwarded-for'));
    if (xff) {
      const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
      // Skip the rightmost `trustedHops` entries (those are our trusted
      // proxy chain) and take the next non-private IP as the client.
      const candidates = parts.slice(0, Math.max(0, parts.length - trustedHops)).reverse();
      const firstPublic = candidates.find((ip) => !isPrivate(ip));
      if (firstPublic) return firstPublic;
      const firstAny = candidates[0];
      if (firstAny) return firstAny;
    }
  }

  return 'unknown';
};
