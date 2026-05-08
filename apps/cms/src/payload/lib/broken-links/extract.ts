/**
 * Walk a Lexical body + adjacent doc fields (heroImage, asset) and
 * return a deduplicated set of every external + internal URL the
 * editor referenced. Used by the nightly broken-link scanner.
 *
 * We deliberately don't follow internal-doc relationships — the
 * `slugChangeRedirectHook` already keeps those resolvable. The
 * scanner cares about typed URL fields and rich-text href anchors.
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
  children?: LexicalNode[];
}

const isLinkNode = (node: LexicalNode): boolean =>
  node.type === 'link' || node.type === 'autolink';

/**
 * Walk a Lexical body and yield every URL referenced. Internal
 * relationships (`linkType === 'internal'`, `doc != null`) are
 * skipped — those resolve via Payload's relationship surface and
 * are kept consistent by the slug-change hook.
 */
export const extractLinksFromLexical = (body: unknown): string[] => {
  if (!body || typeof body !== 'object') return [];
  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) return [];
  const urls = new Set<string>();
  const walk = (node: LexicalNode): void => {
    if (isLinkNode(node)) {
      const linkType = node.fields?.linkType;
      const doc = node.fields?.doc;
      const url = node.fields?.url ?? node.url ?? '';
      // Skip internal-doc relationships — Payload manages them.
      if (linkType !== 'internal' && doc == null && url.length > 0) {
        urls.add(url);
      }
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };
  for (const child of root.children) walk(child);
  return [...urls];
};

const isProbablyHttpUrl = (raw: string): boolean =>
  /^https?:\/\//i.test(raw);

/**
 * Top-level extractor — handles a doc's body PLUS the most-common
 * URL-bearing typed fields (canonical override, applyUrl, atsUrl,
 * registrationUrl, recordingUrl, slidesUrl, News Link, Resources
 * PDF Url). Returns absolute http(s) URLs only — site-relative paths
 * stay out of the broken-link detector (they round-trip through the
 * Pages / route-prefix layer which already enforces resolution).
 */
export const extractAllLinks = (
  doc: Record<string, unknown>,
): string[] => {
  const urls = new Set<string>();

  for (const url of extractLinksFromLexical(doc.body)) {
    if (isProbablyHttpUrl(url)) urls.add(url);
  }

  const SCALAR_URL_FIELDS = [
    'applyUrl',
    'atsUrl',
    'registrationUrl',
    'recordingUrl',
    'slidesUrl',
    'newsLink',
  ] as const;
  for (const key of SCALAR_URL_FIELDS) {
    const value = doc[key];
    if (typeof value === 'string' && isProbablyHttpUrl(value)) urls.add(value);
  }

  // Nested SEO override.
  const seo = doc.seo as { canonicalOverride?: string } | undefined;
  if (seo && typeof seo.canonicalOverride === 'string' && isProbablyHttpUrl(seo.canonicalOverride)) {
    urls.add(seo.canonicalOverride);
  }

  return [...urls];
};
