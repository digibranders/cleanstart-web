/**
 * Transport encoding for the `x-media-context-hint` request header.
 *
 * The hint carries a human-readable document title (see
 * `MediaField.tsx`), which routinely contains typographic characters:
 * curly apostrophes (U+2019) pasted from Word or Google Docs, em
 * dashes, ellipses, accented letters. HTTP header values are limited to
 * ISO-8859-1, and both `XMLHttpRequest.setRequestHeader` and `fetch`
 * throw a `TypeError` on anything outside that range.
 *
 * That throw happens while the request is being *assembled*, before it
 * is sent, so the failure mode is silent and confusing: the upload
 * never reaches the network, no response arrives, no timeout fires, and
 * the progress bar sits at 0% forever with nothing in the Network tab.
 *
 * Percent-encoding keeps the wire value pure ASCII while preserving the
 * title verbatim for the server-side slug fallback in
 * `lib/media-filename.ts#pickSlugSource`.
 */
export const encodeMediaContextHint = (raw: string | null | undefined): string => {
  const trimmed = raw?.trim() ?? '';
  return trimmed ? encodeURIComponent(trimmed) : '';
};

/**
 * Inverse of `encodeMediaContextHint`, applied at the single read site
 * in `collections/Media.ts`.
 *
 * Falls back to the raw header value when it is not valid
 * percent-encoding. Two real cases reach this branch: an admin bundle
 * cached from before the encode landed still sends the title
 * unencoded, and a bare `%` in such a title (`"50% faster builds"`)
 * makes `decodeURIComponent` throw. Both should degrade to the
 * best-effort raw hint rather than fail the upload — the value only
 * feeds a filename slug.
 */
export const decodeMediaContextHint = (headerValue: string | null | undefined): string => {
  const raw = headerValue ?? '';
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
};
