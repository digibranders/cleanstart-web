const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
// Site-relative path. Rejects protocol-relative URLs ("//evil.com") which
// would otherwise navigate off-site as the current protocol's host.
const PATH_PATTERN = /^\/(?:[^\/\s][^\s]*)?$/;
const MAILTO_PATTERN = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const TEL_PATTERN = /^tel:\+?[0-9 ()-]+$/i;

export type UrlShape = 'url' | 'path' | 'mailto' | 'tel' | 'invalid';

export const classifyUrlShape = (raw: string | null | undefined): UrlShape => {
  if (typeof raw !== 'string') return 'invalid';
  const value = raw.trim();
  if (value.length === 0) return 'invalid';
  if (URL_PATTERN.test(value)) return 'url';
  if (MAILTO_PATTERN.test(value)) return 'mailto';
  if (TEL_PATTERN.test(value)) return 'tel';
  if (PATH_PATTERN.test(value)) return 'path';
  return 'invalid';
};

export const isValidExternalLink = (raw: string | null | undefined): boolean => {
  const shape = classifyUrlShape(raw);
  return shape !== 'invalid';
};

/**
 * Reusable Payload field `validate` for any free-text URL slot. Allows
 * blank values when the field is optional; rejects malformed URLs and
 * the protocol-relative `//evil.com` open-redirect vector.
 */
export const validateOptionalUrl = (
  value: string | string[] | null | undefined,
): true | string => {
  if (value == null) return true;
  if (typeof value !== 'string' || value.trim().length === 0) return true;
  if (!isValidExternalLink(value)) {
    return 'Must be https?://, /path, mailto:, or tel:.';
  }
  return true;
};
