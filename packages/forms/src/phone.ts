/**
 * E.164 is the wire format for every phone number the site collects. The
 * browser composes it from the country dial code plus the digits typed; the
 * lead-intake API re-checks the shape before the number reaches the leads
 * table or HubSpot.
 *
 * Shape only. Whether a given number is actually assignable in its country is
 * checked in the browser with libphonenumber-js, which carries the per-country
 * metadata; re-shipping that metadata to the API to re-derive the same answer
 * would buy nothing a shape check does not already guarantee.
 */

/**
 * ITU-T E.164: a country code starting 1-9, then up to 14 more digits.
 * The floor of 8 total digits rejects the truncated entries that dominate
 * junk submissions without excluding short national plans such as +689.
 */
const E164_RE = /^\+[1-9]\d{7,14}$/u;

export const isE164 = (value: string | null | undefined): boolean =>
  typeof value === 'string' && E164_RE.test(value);

/**
 * Strip everything a visitor might paste around a number (spaces, brackets,
 * dashes, a leading 00 trunk prefix) and return E.164, or null when what is
 * left cannot be one.
 */
export const normalizeE164 = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const digits = trimmed.replace(/[^\d+]/gu, '');
  const candidate = digits.startsWith('+')
    ? `+${digits.slice(1).replace(/\D/gu, '')}`
    : digits.startsWith('00')
      ? `+${digits.slice(2)}`
      : `+${digits}`;
  return isE164(candidate) ? candidate : null;
};

/** ISO 3166-1 alpha-2, as produced by the country selector and Vercel's geo header. */
export const isCountryCode = (value: string | null | undefined): boolean =>
  typeof value === 'string' && /^[A-Z]{2}$/u.test(value);
