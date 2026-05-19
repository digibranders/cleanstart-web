import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

/**
 * Webflow's `resources-type` is an Option-type field — the value
 * stored on each row is the option ID (a 32-char hex string), not
 * the human name. The id→Payload-value map below was captured from
 * the live collection schema on 2026-05-18. Display names are kept
 * as a fallback for synthetic fixtures.
 */
const TYPE_ID_MAP: Record<string, string> = {
  '695c0b6a9062adedcaf9ffa1f56a753e': 'whitepaper',
  '62720c005906424cc130710f33c7232c': 'ebook',
  '5c1c9ab9b75179659cc7efd0e1306b53': 'datasheet',
  dde1f824dcc3baa4cfabdf9aa522db49: 'architecture-insights',
  '5d0a408470a716902fc0c10711eca118': 'report',
};

const TYPE_NAME_MAP: Record<string, string> = {
  whitepaper: 'whitepaper',
  ebook: 'ebook',
  'e-book': 'ebook',
  datasheet: 'datasheet',
  'architecture insights': 'architecture-insights',
  'architecture-insights': 'architecture-insights',
  report: 'report',
};

const normalizeType = (raw: unknown): string | null => {
  const s = asString(raw);
  if (!s) return null;
  return TYPE_ID_MAP[s] ?? TYPE_NAME_MAP[s.toLowerCase()] ?? null;
};

export const transformResource = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(title);
  const summary = asString(row['resource-detail']) ?? asString(row.description);
  const bodyHtml = asString(row['resource-detail']);
  const type = normalizeType(row['resources-type']) ?? normalizeType(row['resource-type']);
  const publishedAt = asString(row['publish-date']) ?? asString(row['publishedAt']);
  const ctaButtonText = asString(row['button-text']);

  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title,
    slug,
    type: type ?? undefined,
    summary,
    body: bodyHtml ? htmlToLexical(bodyHtml) : undefined,
    publishedAt,
    ctaButtonText,
    gated: false,
    accessLevel: 'public',
    _rawAsset: row['pdf-url'] ?? row['download-url'] ?? null,
    _rawHeroImage: row['feature-image'] ?? row.image ?? null,
  };
};
