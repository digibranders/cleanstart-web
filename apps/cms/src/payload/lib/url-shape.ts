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
 *
 * NB: pair with `normalizeOptionalUrl` as a `beforeValidate` field hook
 * so editor input like `cleanstart.com` auto-prepends `https://` before
 * hitting this validator. Otherwise typing a bare domain produces a
 * blocking error, which is hostile UX for a field that is itself
 * optional.
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

// Bare domain: `example.com`, `www.foo.co.uk`, `acme.dev:8080`, etc.
// Requires at least one dot, no whitespace, no scheme prefix. The TLD
// must be 2+ letters (rules out half-typed garbage like `foo.c`).
const BARE_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?$/i;

/**
 * Normalise a free-text URL value before it's stored. Used as a
 * `beforeValidate` field hook so the validator (and the public site's
 * `<a href>`) see a usable URL.
 *
 *  - `''` or whitespace → `null` (Payload-idiomatic "not set")
 *  - already-valid `https://…`, `http://…`, `mailto:…`, `tel:…`, `/path`
 *    → trimmed, untouched
 *  - bare domain like `cleanstart.com` → `https://cleanstart.com`
 *  - anything else → trimmed, passed through (validator will reject)
 *
 * Returning `null` for blanks (rather than `''`) keeps stored data
 * consistent with how Payload represents unset fields. Without this,
 * the field would oscillate between `''` and `null` depending on path.
 */
export const normalizeOptionalUrl = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (/^(?:https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
  if (BARE_DOMAIN_PATTERN.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};

/**
 * Payload field hook: normalise an optional-URL value before validation.
 *
 * Use alongside `validateOptionalUrl`:
 *
 *   {
 *     name: 'website',
 *     type: 'text',
 *     hooks: { beforeValidate: [normalizeOptionalUrlHook] },
 *     validate: validateOptionalUrl,
 *   }
 */
export const normalizeOptionalUrlHook = ({ value }: { value?: unknown }): unknown =>
  normalizeOptionalUrl(value);
