import { type HeadersLike, clientIpFromHeaders } from './client-ip';

/**
 * Per-request metadata captured for audit-log entries (DSAR / GDPR
 * Art. 15 defensibility). The proxy chain length is the parsed length
 * of the X-Forwarded-For header at the moment the request arrived —
 * useful for spotting requests that took an unexpected path through
 * the edge.
 *
 * Header values are truncated at MAX_HEADER_LEN to keep audit-log rows
 * bounded; an attacker spamming a multi-MB User-Agent shouldn't be
 * able to bloat audit storage.
 */
export type RequestMeta = {
  ip: string;
  userAgent: string | undefined;
  acceptLanguage: string | undefined;
  proxyChainLength: number;
};

const MAX_HEADER_LEN = 512;

const truncate = (raw: string | null): string | undefined => {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.length > MAX_HEADER_LEN ? trimmed.slice(0, MAX_HEADER_LEN) : trimmed;
};

const parseProxyChainLength = (xff: string | null): number => {
  if (xff == null || xff.trim().length === 0) return 0;
  return xff.split(',').filter((p) => p.trim().length > 0).length;
};

export const extractRequestMeta = (headers: HeadersLike): RequestMeta => ({
  ip: clientIpFromHeaders(headers),
  userAgent: truncate(headers.get('user-agent')),
  acceptLanguage: truncate(headers.get('accept-language')),
  proxyChainLength: parseProxyChainLength(headers.get('x-forwarded-for')),
});
