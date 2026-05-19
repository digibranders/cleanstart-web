/**
 * Strip HTML tags and decode entities for Webflow-exported strings that
 * land in Payload plain-text fields (`text`, `textarea`, SEO description,
 * etc.). Webflow's rich-text fields export as HTML — if the destination
 * Payload field is not a Lexical rich-text field, the raw HTML leaks
 * through to the rendered page as literal `<p>...</p>` text.
 *
 * Block-level tags become single spaces so adjacent paragraphs/list-items
 * don't run together. `<br>` becomes a newline. Whitespace is collapsed
 * to single spaces (newlines are preserved as `\n`).
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  reg: '®',
  trade: '™',
};

const decodeEntities = (s: string): string =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? match;
  });

const BLOCK_TAG = /<\/?(p|div|section|article|header|footer|aside|nav|main|li|ul|ol|dl|dd|dt|table|thead|tbody|tfoot|tr|td|th|h[1-6]|blockquote|pre|figure|figcaption|hr)\b[^>]*>/gi;
const BR_TAG = /<br\s*\/?>/gi;

export const htmlToPlainText = (input: string): string => {
  if (!input) return '';
  let s = input;
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(BR_TAG, '\n');
  s = s.replace(BLOCK_TAG, ' ');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  s = s.replace(/[ \t\f\v]+/g, ' ');
  s = s.replace(/ *\n */g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
};

/**
 * Quick predicate — does the string look like it contains HTML markup?
 * Used by the backfill script to skip rows that are already clean.
 */
export const looksLikeHtml = (input: unknown): boolean => {
  if (typeof input !== 'string') return false;
  return /<[a-z!\/][^>]*>/i.test(input) || /&(?:#x?[0-9a-f]+|[a-z]+);/i.test(input);
};
