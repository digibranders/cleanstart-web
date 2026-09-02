import { resolveSiteUrl } from '../site-url';
import { isSafePublicHttpUrl } from '../url-safety/ssrf-guard';

/**
 * Walk a Lexical body + adjacent doc fields and return every external
 * URL the editor referenced, with the visible anchor text and a
 * human-readable location. Used by the nightly broken-link scanner.
 *
 * Internal-doc *relationships* (`linkType === 'internal'`, `doc != null`)
 * are skipped — Payload's slug-change hook keeps those resolvable.
 *
 * Hand-typed site-relative paths are NOT skipped. They carry no relationship
 * for the slug-change hook to follow, so nothing else in the system validates
 * them: `/guide/orchestration` and `/images/redis/details` both shipped in
 * published bodies as 404s and went unnoticed until a manual crawl. They are
 * resolved against the public origin so the scanner HEAD-checks them like any
 * other link.
 *
 * SSRF defence: every emitted URL passes `isSafePublicHttpUrl`.
 */

interface LinkAttrs {
  type?: string;
  url?: string;
  linkType?: string;
  doc?: unknown;
}

interface LexicalNode {
  type?: string;
  fields?: LinkAttrs;
  url?: string;
  text?: string;
  children?: LexicalNode[];
}

export interface LexicalLink {
  url: string;
  anchorText: string | null;
}

export interface ExtractedLink {
  url: string;
  anchorText: string | null;
  location: string;
}

const isLinkNode = (node: LexicalNode): boolean =>
  node.type === 'link' || node.type === 'autolink';

const collectText = (node: LexicalNode): string => {
  if (typeof node.text === 'string') return node.text;
  if (node.children) return node.children.map(collectText).join('');
  return '';
};

export const extractLinksFromLexical = (body: unknown): LexicalLink[] => {
  if (!body || typeof body !== 'object') return [];
  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) return [];
  const byUrl = new Map<string, LexicalLink>();
  const walk = (node: LexicalNode): void => {
    if (isLinkNode(node)) {
      const linkType = node.fields?.linkType;
      const doc = node.fields?.doc;
      const url = node.fields?.url ?? node.url ?? '';
      if (linkType !== 'internal' && doc == null && url.length > 0 && !byUrl.has(url)) {
        const text = collectText(node).trim();
        byUrl.set(url, { url, anchorText: text.length > 0 ? text : null });
      }
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };
  for (const child of root.children) walk(child);
  return [...byUrl.values()];
};

const isFetchSafeHttpUrl = (raw: string): boolean => isSafePublicHttpUrl(raw).ok;

/**
 * Resolve a root-relative editor link against the public origin.
 *
 * Only `/path` is rewritten. `//host/path` is protocol-relative and points at
 * another origin, so prefixing it would silently retarget the link; anything
 * else (absolute URLs, `#anchor`, `mailto:`, `tel:`) is returned untouched and
 * falls to the SSRF guard to accept or drop.
 */
const absolutiseInternal = (raw: string, origin: string): string =>
  raw.startsWith('/') && !raw.startsWith('//') ? `${origin}${raw}` : raw;

const SCALAR_URL_FIELDS: ReadonlyArray<readonly [key: string, label: string]> = [
  ['applyUrl', 'Apply URL'],
  ['atsUrl', 'ATS URL'],
  ['registrationUrl', 'Registration URL'],
  ['recordingUrl', 'Recording URL'],
  ['slidesUrl', 'Slides URL'],
  ['newsLink', 'News link'],
];

/**
 * Top-level extractor — body rich-text links (location "Body") plus the
 * common typed URL fields and the nested SEO canonical override (located
 * by field label). Returns absolute http(s) URLs that pass the SSRF
 * guard; first occurrence of a URL wins (body before typed fields).
 */
export const extractAllLinks = (
  doc: Record<string, unknown>,
  siteOrigin: string = resolveSiteUrl(),
): ExtractedLink[] => {
  const byUrl = new Map<string, ExtractedLink>();
  const add = (raw: string, anchorText: string | null, location: string): void => {
    // Dedupe on the resolved URL so `/x` and `https://site/x` collapse to one check.
    const url = absolutiseInternal(raw, siteOrigin);
    if (isFetchSafeHttpUrl(url) && !byUrl.has(url)) {
      byUrl.set(url, { url, anchorText, location });
    }
  };

  for (const link of extractLinksFromLexical(doc.body)) {
    add(link.url, link.anchorText, 'Body');
  }

  for (const [key, label] of SCALAR_URL_FIELDS) {
    const value = doc[key];
    if (typeof value === 'string') add(value, null, label);
  }

  const seo = doc.seo as { canonicalOverride?: string } | undefined;
  if (seo && typeof seo.canonicalOverride === 'string') {
    add(seo.canonicalOverride, null, 'Canonical override');
  }

  return [...byUrl.values()];
};
