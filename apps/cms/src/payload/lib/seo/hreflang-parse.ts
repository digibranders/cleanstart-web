/**
 * Parse pasted `<link rel="alternate" hreflang="…" href="…">` markup
 * into structured `{ hreflang, href }` rows. Designed for editors who
 * copy hreflang clusters out of Eventus / Search Console / page source
 * and want them imported into Payload as individual rows.
 *
 * Robust to:
 *  - Single-quoted, double-quoted, or unquoted attribute values.
 *  - Self-closing (`/>`) and HTML5-ish (`>`) terminators.
 *  - Mixed attribute order (rel/hreflang/href in any sequence).
 *  - Extra whitespace, newlines between tags, attribute-line wrapping.
 *  - Stray non-alternate `<link>` tags (only `rel="alternate"` matches).
 *  - Repeated identical lines (dedupes by `${hreflang}|${href}`).
 *
 * Returns parse rows AND any unparseable input so the UI can surface
 * "we kept N rows; M lines couldn't be read" feedback. Pure: no DOM,
 * no fetch — runs server-side too if ever needed.
 */

export interface HreflangRow {
  readonly hreflang: string;
  readonly href: string;
}

export interface HreflangParseResult {
  readonly rows: HreflangRow[];
  /**
   * Lines we attempted to parse as `<link rel="alternate">` but
   * couldn't extract both `hreflang` and `href` from. Useful to show
   * editors which paste lines were dropped.
   */
  readonly unparsed: string[];
}

const LINK_TAG_RE = /<\s*link\b[^>]*?\/?\s*>/gi;
const ATTR_RE = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

const parseAttrs = (tag: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic regex iteration
  while ((m = ATTR_RE.exec(tag))) {
    const key = m[1]?.toLowerCase();
    if (!key) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[key] = value;
  }
  return attrs;
};

export const parseHreflangPaste = (input: string | null | undefined): HreflangParseResult => {
  const rows: HreflangRow[] = [];
  const unparsed: string[] = [];
  const seen = new Set<string>();

  if (typeof input !== 'string' || input.trim().length === 0) {
    return { rows, unparsed };
  }

  LINK_TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic regex iteration
  while ((match = LINK_TAG_RE.exec(input))) {
    const tag = match[0];
    const attrs = parseAttrs(tag);
    if (attrs.rel?.toLowerCase() !== 'alternate') {
      // Not an alternate link — silently skip.
      continue;
    }
    const hreflang = (attrs.hreflang ?? '').trim();
    const href = (attrs.href ?? '').trim();
    if (!hreflang || !href) {
      unparsed.push(tag.trim());
      continue;
    }
    const key = `${hreflang.toLowerCase()}|${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ hreflang, href });
  }

  return { rows, unparsed };
};
