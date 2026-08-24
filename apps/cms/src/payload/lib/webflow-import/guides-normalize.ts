/**
 * Webflow's CMS field-count limit (60 per collection) forced every
 * variable-length list on the Guides collection to be flattened into
 * numbered slot fields:
 *
 *   - Q1 / Ans1 … Q5 / Ans5         (5 FAQs max)
 *   - Article About 1 … Article About 8  (8 sections max)
 *   - Article keyword 1 … Article keyword 10  (10 keywords)
 *   - Article Mentions 1 … Article Mentions 10  (10 citations)
 *
 * Payload uses proper `array` fields with no slot ceiling. These
 * pure functions take the slot-shaped Webflow row and return the
 * Payload-shaped arrays. Empty / whitespace-only slots are dropped;
 * order is preserved.
 */

const isFilled = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Walk `${prefix}${i}` for i = 1..count. Each prefix is tried in
 * order — the first one that returns a filled string wins. This is
 * how we accept both the live Webflow slug (e.g. `article-keyword-`)
 * and the legacy fixture slug (`Article keyword `) without two
 * separate helpers.
 */
const collectSlots = (
  row: Record<string, unknown>,
  prefixes: readonly string[],
  count: number,
): string[] => {
  const out: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    for (const prefix of prefixes) {
      const value = row[`${prefix}${i}`];
      if (isFilled(value)) {
        out.push(value.trim());
        break;
      }
    }
  }
  return out;
};

// ─── FAQs (Q1/Ans1 … Q5/Ans5) ───────────────────────────────────

// `faqs[].answer` is a Lexical `richText` field (see `fields/faqs.ts`),
// not a plain string. This mirrors the minimal node shape Payload's
// FAQ bulk-paste UI writes into the same field (`FaqBulkPaste.tsx`'s
// `paragraphsToLexical`) — kept local rather than imported from
// `apps/cms` runtime code so this ETL package stays decoupled from it.
interface LexicalTextNode {
  readonly type: 'text';
  readonly text: string;
  readonly format: 0;
  readonly detail: 0;
  readonly mode: 'normal';
  readonly style: '';
  readonly version: 1;
}

interface LexicalParagraphNode {
  readonly type: 'paragraph';
  readonly children: readonly [LexicalTextNode];
  readonly direction: null;
  readonly format: '';
  readonly indent: 0;
  readonly version: 1;
}

export interface LexicalRichTextValue {
  readonly root: {
    readonly type: 'root';
    readonly children: readonly LexicalParagraphNode[];
    readonly direction: null;
    readonly format: '';
    readonly indent: 0;
    readonly version: 1;
  };
}

const lexicalParagraphNode = (text: string): LexicalParagraphNode => ({
  type: 'paragraph',
  children: [
    { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
  ],
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

/**
 * Webflow's `Ans1`…`Ans5` slots are plain text where a blank line marks a
 * paragraph break — the same boundary `parseFaqBulk` uses for the FAQ
 * bulk-paste UI on this identical field. Lines within a paragraph join
 * with a single space so text wrapped at a column width still arrives
 * as one paragraph. A blank/whitespace-only answer still yields one
 * empty-text paragraph: Payload's Lexical field crashes on render if
 * `root.children` is empty.
 */
const answerToLexical = (raw: string): LexicalRichTextValue => {
  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(' '),
    )
    .filter((paragraph) => paragraph.length > 0);
  const children = (paragraphs.length > 0 ? paragraphs : ['']).map(lexicalParagraphNode);
  return {
    root: {
      type: 'root',
      children,
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  };
};

export interface FaqEntry {
  readonly question: string;
  readonly answer: LexicalRichTextValue;
}

/**
 * Walk Q1/Ans1 through Q5/Ans5 and return only the pairs where BOTH
 * question and answer are filled. A Q without an A (or vice-versa)
 * is dropped — Payload's `faqs[]` requires both.
 */
export const collapseGuideFaqs = (
  row: Record<string, unknown>,
  maxSlots = 5,
): FaqEntry[] => {
  const out: FaqEntry[] = [];
  for (let i = 1; i <= maxSlots; i += 1) {
    // Webflow's actual API slugs are kebab-singular lowercase
    // (`q1` / `ans-1`); the upper-cased forms are accepted as a
    // fallback for synthetic test fixtures and pre-Webflow shapes.
    const q = row[`q${i}`] ?? row[`Q${i}`];
    const a = row[`ans-${i}`] ?? row[`Ans${i}`];
    if (isFilled(q) && isFilled(a)) {
      out.push({ question: q.trim(), answer: answerToLexical(a) });
    }
  }
  return out;
};

// ─── Keywords (Article keyword 1 … 10) ──────────────────────────

/**
 * Webflow's `Article keyword N` slots → a flat `string[]` for the
 * consolidated `seo.keywords` field.
 */
export const collapseKeywords = (
  row: Record<string, unknown>,
  maxSlots = 10,
): string[] => collectSlots(row, ['article-keyword-', 'Article keyword '], maxSlots);

// ─── Citations (Article Mentions 1 … 10) ────────────────────────

export interface CitationEntry {
  readonly label: string;
  readonly source?: string | null;
  readonly url?: string | null;
}

const URL_PATTERN = /^https?:\/\/\S+$/i;
const HEAD_TAIL_URL = /^(.+?)\s*[-–—]\s*(https?:\/\/\S+)\s*$/;

/**
 * Webflow's `Article Mentions N` slots were free-text. Editors
 * inconsistently formatted them as one of:
 *
 *   1. `Just a label`
 *   2. `https://example.com/article` (raw URL)
 *   3. `Label - https://example.com/article` (label + URL)
 *   4. `Label (Source)` (label + publisher)
 *
 * We detect each shape and split into `{label, url?, source?}`.
 * Payload's `citations[]` requires `label`; everything else is
 * optional and editors enrich post-migration.
 */
export const collapseCitations = (
  row: Record<string, unknown>,
  maxSlots = 10,
): CitationEntry[] =>
  collectSlots(row, ['article-mentions-', 'Article Mentions '], maxSlots).map((raw) => {
    // Shape 2: bare URL.
    if (URL_PATTERN.test(raw)) {
      try {
        const host = new URL(raw).host.replace(/^www\./, '');
        return { label: host, url: raw, source: host };
      } catch {
        return { label: raw, url: raw };
      }
    }
    // Shape 3: `Label - URL`.
    const dashMatch = raw.match(HEAD_TAIL_URL);
    if (dashMatch?.[1] && dashMatch[2]) {
      const label = dashMatch[1].trim();
      const url = dashMatch[2].trim();
      let source: string | null = null;
      try {
        source = new URL(url).host.replace(/^www\./, '');
      } catch {
        // ignore
      }
      return source ? { label, url, source } : { label, url };
    }
    // Shape 4: `Label (Source)`.
    const parenMatch = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (parenMatch?.[1] && parenMatch[2]) {
      return { label: parenMatch[1].trim(), source: parenMatch[2].trim() };
    }
    // Shape 1: bare label.
    return { label: raw };
  });

// ─── Bulk wrapper ───────────────────────────────────────────────

export interface NormalizedGuide {
  readonly faqs: readonly FaqEntry[];
  readonly keywords: readonly string[];
  readonly citations: readonly CitationEntry[];
}

export const normalizeWebflowGuide = (
  row: Record<string, unknown>,
): NormalizedGuide => ({
  faqs: collapseGuideFaqs(row),
  keywords: collapseKeywords(row),
  citations: collapseCitations(row),
});
