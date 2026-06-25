import { isSafePublicHttpUrl } from '../url-safety/ssrf-guard';

/**
 * Walk a Lexical body + adjacent doc fields and return every external
 * URL the editor referenced, with the visible anchor text and a
 * human-readable location. Used by the nightly broken-link scanner.
 *
 * Internal-doc relationships (`linkType === 'internal'`, `doc != null`)
 * are skipped — Payload's slug-change hook keeps those resolvable.
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
export const extractAllLinks = (doc: Record<string, unknown>): ExtractedLink[] => {
  const byUrl = new Map<string, ExtractedLink>();
  const add = (url: string, anchorText: string | null, location: string): void => {
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
