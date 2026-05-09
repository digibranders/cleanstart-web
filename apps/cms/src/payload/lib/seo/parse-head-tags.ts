/**
 * Universal `<head>`-tag parser. Editors paste arbitrary markup —
 * `<link rel="alternate">`, `<meta name>`, `<meta property>`, HTML
 * comments — and the parser sorts each tag into the right bucket so
 * the card UI can distribute rows to the correct field state with one
 * click ("Add").
 *
 * Why one parser: non-technical editors don't think in terms of
 * "hreflang vs custom tags". They paste whatever they copied. We
 * sort. Comments are tolerated and counted (so we can tell the
 * editor what was ignored without scaring them with errors).
 *
 * Pure: no DOM, no fetch.
 */

export interface ParsedAlternate {
  readonly hreflang: string;
  readonly href: string;
}

export interface ParsedMetaTag {
  readonly kind: 'meta-name' | 'meta-property';
  readonly key: string;
  readonly content: string;
}

export interface ParsedHeadTags {
  /** `<link rel="alternate" hreflang="…" href="…">` rows. */
  readonly alternates: ParsedAlternate[];
  /** `<meta name="…" content="…">` and `<meta property="…" content="…">` rows. */
  readonly metaTags: ParsedMetaTag[];
  /** Count of `<!-- … -->` comments seen — informational. */
  readonly commentCount: number;
  /** Lines we attempted to parse but couldn't sort. Editor gets a friendly message. */
  readonly unrecognised: string[];
}

const ATTR_RE = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const TAG_RE = /<\s*(link|meta)\b[^>]*?\/?\s*>/gi;

const parseAttrs = (tag: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic regex iteration
  while ((m = ATTR_RE.exec(tag))) {
    const key = m[1]?.toLowerCase();
    if (!key) continue;
    attrs[key] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
};

export const parseHeadTags = (input: string | null | undefined): ParsedHeadTags => {
  const result: ParsedHeadTags = {
    alternates: [],
    metaTags: [],
    commentCount: 0,
    unrecognised: [],
  };

  if (typeof input !== 'string' || input.trim().length === 0) {
    return result;
  }

  // Count comments and strip them so they don't interfere with tag matching.
  let stripped = input;
  COMMENT_RE.lastIndex = 0;
  const comments = input.match(COMMENT_RE) ?? [];
  // biome-ignore lint/suspicious/noExplicitAny: typed write below
  (result as any).commentCount = comments.length;
  stripped = input.replace(COMMENT_RE, '');

  const seenAlt = new Set<string>();
  const seenMeta = new Set<string>();

  TAG_RE.lastIndex = 0;
  let tagMatch: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic regex iteration
  while ((tagMatch = TAG_RE.exec(stripped))) {
    const raw = tagMatch[0];
    const tagName = (tagMatch[1] ?? '').toLowerCase();
    const attrs = parseAttrs(raw);

    if (tagName === 'link') {
      if (attrs.rel?.toLowerCase() !== 'alternate') {
        result.unrecognised.push(raw.trim());
        continue;
      }
      const hreflang = (attrs.hreflang ?? '').trim();
      const href = (attrs.href ?? '').trim();
      if (!hreflang || !href) {
        result.unrecognised.push(raw.trim());
        continue;
      }
      const key = `${hreflang.toLowerCase()}|${href}`;
      if (seenAlt.has(key)) continue;
      seenAlt.add(key);
      result.alternates.push({ hreflang, href });
      continue;
    }

    if (tagName === 'meta') {
      const name = (attrs.name ?? '').trim();
      const property = (attrs.property ?? '').trim();
      const content = (attrs.content ?? '').trim();
      if (!content) {
        result.unrecognised.push(raw.trim());
        continue;
      }
      if (name) {
        const key = `name|${name.toLowerCase()}|${content}`;
        if (seenMeta.has(key)) continue;
        seenMeta.add(key);
        result.metaTags.push({ kind: 'meta-name', key: name, content });
        continue;
      }
      if (property) {
        const key = `property|${property.toLowerCase()}|${content}`;
        if (seenMeta.has(key)) continue;
        seenMeta.add(key);
        result.metaTags.push({ kind: 'meta-property', key: property, content });
        continue;
      }
      result.unrecognised.push(raw.trim());
    }
  }

  return result;
};

/**
 * Build a friendly one-line summary of a parse result, suitable for
 * showing under the paste box. Examples:
 *   "Added 3 language versions and 2 meta tags."
 *   "Added 2 language versions. (1 comment ignored.)"
 *   "Nothing to add."
 */
export const summariseParse = (
  parsed: ParsedHeadTags,
  args: { addedAlternates: number; addedMetaTags: number },
): string => {
  const bits: string[] = [];
  if (args.addedAlternates > 0) {
    bits.push(
      `${args.addedAlternates} language version${args.addedAlternates === 1 ? '' : 's'}`,
    );
  }
  if (args.addedMetaTags > 0) {
    bits.push(`${args.addedMetaTags} meta tag${args.addedMetaTags === 1 ? '' : 's'}`);
  }
  let main = bits.length === 0 ? 'Nothing to add' : `Added ${bits.join(' and ')}`;

  const tail: string[] = [];
  if (parsed.commentCount > 0) {
    tail.push(`${parsed.commentCount} comment${parsed.commentCount === 1 ? '' : 's'} ignored`);
  }
  if (parsed.unrecognised.length > 0) {
    tail.push(
      `${parsed.unrecognised.length} line${parsed.unrecognised.length === 1 ? '' : 's'} couldn't be read`,
    );
  }
  if (tail.length > 0) main += ` (${tail.join(', ')})`;
  return `${main}.`;
};
