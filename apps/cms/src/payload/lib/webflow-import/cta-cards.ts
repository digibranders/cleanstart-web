/**
 * Inline CTA card detection + conversion for body Lexical content.
 *
 * Webflow stored inline CTAs as `<div class="artcileCtaBox"><h3>prompt
 * <a>label</a></h3></div>`. The HTML→Lexical import flattened the wrapper,
 * leaving a plain `heading` node whose children are `text* link text*`. This
 * module recognises that shape and rewrites it into an `inlineCta` block node
 * (the same block registered in `editor-config.ts` and rendered by the web
 * `renderLexical`), so existing imported guides render as real cards.
 *
 * Pure + framework-free so it can be unit-tested and reused by both the
 * one-shot DB migration (`scripts/migrate-guide-cta-cards.ts`) and the import
 * transform.
 */

interface LexicalUnknownNode {
  readonly type: string;
  readonly children?: readonly LexicalUnknownNode[];
  readonly [key: string]: unknown;
}

interface LexicalRootLike {
  readonly root?: {
    readonly children?: readonly LexicalUnknownNode[];
    readonly [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

export interface InlineCtaFields {
  readonly blockType: 'inlineCta';
  readonly blockName: string;
  readonly id: string;
  readonly heading: string;
  readonly buttonLabel: string;
  readonly buttonUrl: string;
  readonly variant: 'soft' | 'solid';
}

export interface InlineCtaBlockNode {
  readonly type: 'block';
  readonly version: 2;
  readonly format: '';
  readonly fields: InlineCtaFields;
}

export interface CtaConversionResult {
  /** New body with CTA headings replaced by `inlineCta` blocks. */
  readonly body: unknown;
  /** Cards successfully converted. */
  readonly converted: number;
  /** Mid-sentence-link headings that WERE converted (only when
   *  `includeMidSentence` is set) — the heading text reads reworded and is
   *  worth an editor glance. */
  readonly review: readonly string[];
  /** Mid-sentence-link headings left untouched (the default) — the prompt and
   *  the button fragment don't split cleanly, so these are deferred for manual
   *  handling rather than auto-mangled. */
  readonly deferred: readonly string[];
  /** Headings skipped (e.g. link-only, no prompt text). */
  readonly skipped: readonly string[];
}

export interface ConvertBodyCtasOptions {
  /** Convert mid-sentence-link CTAs too (default false — they are deferred). */
  readonly includeMidSentence?: boolean;
}

const isObject = (v: unknown): v is LexicalUnknownNode =>
  typeof v === 'object' && v !== null && typeof (v as { type?: unknown }).type === 'string';

const isLink = (node: LexicalUnknownNode): boolean =>
  node.type === 'link' || node.type === 'autolink';

/** Concatenated plain text of an inline run (recursing into nested marks). */
const inlineText = (nodes: readonly LexicalUnknownNode[] | undefined): string => {
  if (!nodes) return '';
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text' && typeof n.text === 'string') out += n.text;
    else if (Array.isArray(n.children)) out += inlineText(n.children);
  }
  return out;
};

const linkUrl = (node: LexicalUnknownNode): string => {
  if (typeof node.url === 'string' && node.url) return node.url;
  const fields = node.fields as { url?: unknown } | undefined;
  if (fields && typeof fields.url === 'string') return fields.url;
  return '';
};

const collapse = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** A heading node that contains at least one link child is a flattened CTA. */
export const isCtaHeading = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'heading') return false;
  const children = node.children ?? [];
  return children.some((c) => isObject(c) && isLink(c));
};

interface ExtractedCta {
  readonly heading: string;
  readonly buttonLabel: string;
  readonly buttonUrl: string;
  /** True when prose follows the link (mid-sentence link → reworded heading). */
  readonly midSentence: boolean;
}

/** Pull heading prompt + button from a CTA heading node, or null if unusable. */
export const extractCtaFromHeading = (node: unknown): ExtractedCta | null => {
  if (!isObject(node) || node.type !== 'heading') return null;
  const children = node.children ?? [];
  const linkIdx = children.findIndex((c) => isObject(c) && isLink(c));
  if (linkIdx === -1) return null;

  const link = children[linkIdx];
  const buttonLabel = collapse(inlineText(link?.children));
  const buttonUrl = link ? linkUrl(link) : '';
  if (!buttonLabel || !buttonUrl) return null;

  const before = collapse(inlineText(children.slice(0, linkIdx)));
  const after = collapse(inlineText(children.slice(linkIdx + 1)));
  // Only prose after the link (a word char, not a lone ".") makes it
  // mid-sentence — a trailing period is just punctuation, still a clean CTA.
  const midSentence = /[A-Za-z0-9]/.test(after);
  const heading = midSentence ? collapse(`${before} ${after}`) : before;
  if (!heading) return null; // link-only heading — no prompt to anchor a card

  return { heading, buttonLabel, buttonUrl, midSentence };
};

const makeId = (): string => {
  // ObjectId-shaped 24-hex id, matching Payload's row-id format. Uses Web Crypto
  // (available in Node 22 + the browser) so this stays framework-free.
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const makeInlineCtaBlock = (
  fields: Omit<InlineCtaFields, 'blockType' | 'blockName' | 'id' | 'variant'> &
    Partial<Pick<InlineCtaFields, 'variant' | 'id'>>,
): InlineCtaBlockNode => ({
  type: 'block',
  version: 2,
  format: '',
  fields: {
    blockType: 'inlineCta',
    blockName: '',
    id: fields.id ?? makeId(),
    heading: fields.heading,
    buttonLabel: fields.buttonLabel,
    buttonUrl: fields.buttonUrl,
    variant: fields.variant ?? 'soft',
  },
});

/**
 * Walk a body Lexical root and replace each top-level CTA heading with an
 * `inlineCta` block. Returns a new object; the input is not mutated. Idempotent
 * — once a heading is a block it is no longer matched.
 */
export const convertBodyCtas = (
  body: unknown,
  options: ConvertBodyCtasOptions = {},
): CtaConversionResult => {
  const { includeMidSentence = false } = options;
  const review: string[] = [];
  const deferred: string[] = [];
  const skipped: string[] = [];
  const unchanged: CtaConversionResult = { body, converted: 0, review, deferred, skipped };

  if (!body || typeof body !== 'object') return unchanged;
  const root = (body as LexicalRootLike).root;
  if (!root || !Array.isArray(root.children)) return unchanged;

  let converted = 0;
  const nextChildren = root.children.map((child) => {
    if (!isCtaHeading(child)) return child;
    const extracted = extractCtaFromHeading(child);
    if (!extracted) {
      skipped.push(collapse(inlineText((child as LexicalUnknownNode).children)) || '(empty heading)');
      return child;
    }
    if (extracted.midSentence && !includeMidSentence) {
      deferred.push(extracted.heading);
      return child;
    }
    converted += 1;
    if (extracted.midSentence) review.push(extracted.heading);
    return makeInlineCtaBlock({
      heading: extracted.heading,
      buttonLabel: extracted.buttonLabel,
      buttonUrl: extracted.buttonUrl,
    });
  });

  if (converted === 0) return unchanged;

  return {
    body: { ...(body as object), root: { ...root, children: nextChildren } },
    converted,
    review,
    deferred,
    skipped,
  };
};
