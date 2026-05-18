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

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
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
      out.push({ question: q.trim(), answer: a.trim() });
    }
  }
  return out;
};

// ─── Article sections (Article About 1 … 8) ─────────────────────

export interface ArticleSection {
  readonly heading: string;
  readonly body: string;
}

/**
 * Webflow's `Article About N` slots were free-text — editors used the
 * first sentence as a heading and the remainder as the body. We split
 * on the first `:` or sentence break, fall back to using the whole
 * value as both heading + body when no split is found.
 *
 * For the most common case where editors copied a heading + a
 * one-line summary, the split produces clean structured rows.
 */
export const collapseArticleSections = (
  row: Record<string, unknown>,
  maxSlots = 8,
): ArticleSection[] => {
  const slots = collectSlots(row, ['article-about-', 'Article About '], maxSlots);
  return slots.map((raw) => {
    // Try `Heading: body text` first.
    const colon = raw.indexOf(':');
    if (colon > 0 && colon < 80) {
      const heading = raw.slice(0, colon).trim();
      const body = raw.slice(colon + 1).trim();
      if (heading.length > 0 && body.length > 0) return { heading, body };
    }
    // Fall back to first-sentence split.
    const sentenceEnd = raw.search(/[.!?]\s/);
    if (sentenceEnd > 0 && sentenceEnd < 120) {
      const heading = raw.slice(0, sentenceEnd + 1).trim();
      const body = raw.slice(sentenceEnd + 1).trim();
      if (heading.length > 0 && body.length > 0) return { heading, body };
    }
    // No usable split — heading and body both repeat the value so the
    // structured row at least carries the prose. Editor will tidy.
    return { heading: raw.slice(0, 80), body: raw };
  });
};

// ─── Keywords (Article keyword 1 … 10) ──────────────────────────

export interface KeywordEntry {
  readonly keyword: string;
}

export const collapseKeywords = (
  row: Record<string, unknown>,
  maxSlots = 10,
): KeywordEntry[] =>
  collectSlots(row, ['article-keyword-', 'Article keyword '], maxSlots).map((keyword) => ({
    keyword,
  }));

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
  readonly articleSections: readonly ArticleSection[];
  readonly keywords: readonly KeywordEntry[];
  readonly citations: readonly CitationEntry[];
}

export const normalizeWebflowGuide = (
  row: Record<string, unknown>,
): NormalizedGuide => ({
  faqs: collapseGuideFaqs(row),
  articleSections: collapseArticleSections(row),
  keywords: collapseKeywords(row),
  citations: collapseCitations(row),
});
