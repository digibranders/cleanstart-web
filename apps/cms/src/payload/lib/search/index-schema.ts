import { mergeKeywordSources } from '../seo/keywords';
import { absoluteUrl } from '../jsonld/url';
import { collectionUrlFromDoc } from '../route-prefixes';
import type { IndexSettings, SearchDocument } from './client';

/** Soft cap on indexed body text — Meilisearch handles bigger payloads
 * but throughput drops noticeably past ~50 KB / doc and most prose is
 * well below that anyway.
 */
const BODY_CHAR_CAP = 50_000;

interface LexicalNode {
  type?: string;
  text?: string;
  children?: LexicalNode[];
}

/**
 * Walk a Lexical JSON tree and pull every text leaf, joined by a
 * space. Truncates at BODY_CHAR_CAP to bound the wire payload.
 * Inline-run aware (bold / italic spans inside a paragraph
 * concatenate without inserting a space, the same way the rendered
 * paragraph does — same logic as the body-stats hook).
 */
const lexicalToPlainText = (body: unknown): string => {
  if (!body || typeof body !== 'object') return '';
  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) return '';

  const out: string[] = [];
  let chars = 0;

  const collectInline = (node: LexicalNode): string => {
    if (typeof node.text === 'string') return node.text;
    if (!node.children) return '';
    return node.children.map(collectInline).join('');
  };

  const walk = (node: LexicalNode): void => {
    if (chars >= BODY_CHAR_CAP) return;
    if (typeof node.text === 'string' && (!node.children || node.children.length === 0)) {
      out.push(node.text);
      chars += node.text.length;
      return;
    }
    if (node.children && node.children.length > 0) {
      // Block-level node — gather all descendant inline runs as one
      // span, push, then move on so we don't double-walk.
      const inline = collectInline(node);
      if (inline.length > 0) {
        out.push(inline);
        chars += inline.length;
      }
      return;
    }
  };

  for (const child of root.children) walk(child);
  const joined = out.join(' ');
  return joined.length > BODY_CHAR_CAP ? joined.slice(0, BODY_CHAR_CAP) : joined;
};

/**
 * Single cross-collection search index. Per arch doc §search,
 * editors and the public site both want a "search anywhere" UX —
 * one index keyed by a `collection` discriminator is simpler than
 * fanning a query across N per-collection indexes.
 */
export const INDEX_UID = 'content';

/**
 * Per-collection priority weights. Multi-collection ranking is hard
 * to tune across the board; this gives blogs / news the largest
 * boost (high editorial cadence) and authors / categories the
 * smallest (they're usually nav targets, not search subjects).
 */
const COLLECTION_WEIGHT: Record<string, number> = {
  blogs: 100,
  news: 95,
  guides: 90,
  knowledgeBase: 90,
  resources: 80,
  events: 70,
  webinars: 70,
  jobs: 70,
  podcastEpisodes: 70,
  pages: 60,
  authors: 30,
  categories: 20,
  newsCategories: 20,
  knowledgeCategories: 20,
};

/**
 * Collections that participate in the cross-collection index.
 * Mirrors the sitemap's coverage list (per arch doc §sitemap.xml)
 * minus pure system collections (media / leads / users / etc.).
 */
export const SEARCH_INDEXED_COLLECTIONS: ReadonlyArray<string> = [
  'blogs',
  'news',
  'guides',
  'knowledgeBase',
  'resources',
  'events',
  'webinars',
  'jobs',
  'podcastEpisodes',
  'authors',
  'pages',
];

export const isSearchIndexedCollection = (slug: string): boolean =>
  SEARCH_INDEXED_COLLECTIONS.includes(slug);

/**
 * Index settings pushed once at boot (idempotent on Meilisearch's
 * side). Searchable order matters — earlier attributes outweigh
 * later ones for relevance; we put `title` first so a query that
 * matches the title beats one that only matches the body.
 */
export const INDEX_SETTINGS: IndexSettings = {
  primaryKey: 'id',
  searchableAttributes: ['title', 'description', 'body', 'authors', 'categories', 'keywords'],
  filterableAttributes: ['collection', 'categories', 'keywords', 'isPublished'],
  sortableAttributes: ['publishedAt', 'updatedAt', 'collectionWeight'],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
    'collectionWeight:desc',
  ],
  stopWords: ['a', 'an', 'and', 'or', 'the', 'is', 'are', 'of', 'to', 'in', 'on'],
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
  },
};

interface AuthorLite {
  readonly slug?: string | null;
  readonly name?: string | null;
}

interface CategoryLite {
  readonly slug?: string | null;
  readonly name?: string | null;
}

interface IndexableDoc {
  id?: number | string;
  slug?: string | null;
  path?: string | null;
  title?: string | null;
  name?: string | null;
  abstract?: string | null;
  description?: string | null;
  bioShort?: string | null;
  body?: unknown;
  bioLong?: unknown;
  publishedAt?: string | null;
  publicationDate?: string | null;
  updatedAt?: string | null;
  _status?: string | null;
  authors?: readonly (AuthorLite | number | null | undefined)[] | null;
  categories?: readonly (CategoryLite | number | null | undefined)[] | null;
  newsCategories?: readonly (CategoryLite | number | null | undefined)[] | null;
  category?: CategoryLite | number | null;
  keywords?: readonly { keyword?: string | null }[] | null;
  seo?: { indexable?: string | null; keywords?: unknown } | null;
}

const onlyResolvedNamed = (
  list: readonly (AuthorLite | CategoryLite | number | null | undefined)[] | null | undefined,
): string[] => {
  // Payload returns an array for `hasMany` relationships, but a non-iterable
  // shape can slip through (a single related object, or a partially-resolved
  // value); guard with Array.isArray so indexing never throws on one doc.
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const entry of list) {
    if (entry == null || typeof entry === 'number') continue;
    const name = (entry as { name?: string | null }).name;
    if (typeof name === 'string' && name.length > 0) out.push(name);
  }
  return out;
};

const readDescription = (doc: IndexableDoc): string => {
  if (typeof doc.abstract === 'string' && doc.abstract.length > 0) return doc.abstract;
  if (typeof doc.description === 'string' && doc.description.length > 0) return doc.description;
  if (typeof doc.bioShort === 'string' && doc.bioShort.length > 0) return doc.bioShort;
  return '';
};

const readPublishedAt = (doc: IndexableDoc): string | null => {
  if (typeof doc.publicationDate === 'string') return doc.publicationDate;
  if (typeof doc.publishedAt === 'string') return doc.publishedAt;
  return null;
};

/**
 * True when the doc is index-eligible: published (or unversioned) +
 * not noindex. Caller decides whether to upsert or remove based on
 * this; both flows are handled by the sync layer.
 */
export const isIndexable = (doc: IndexableDoc): boolean => {
  if (doc._status != null && doc._status !== 'published') return false;
  const indexable = doc.seo?.indexable;
  if (indexable === 'noindex' || indexable === 'noindex,nofollow') return false;
  return true;
};

const collectCategoryNames = (doc: IndexableDoc): string[] => {
  const names: string[] = [];
  names.push(...onlyResolvedNamed(doc.categories));
  names.push(...onlyResolvedNamed(doc.newsCategories));
  if (doc.category != null && typeof doc.category !== 'number') {
    const name = (doc.category as CategoryLite).name;
    if (typeof name === 'string' && name.length > 0) names.push(name);
  }
  return names;
};

const collectKeywords = (doc: IndexableDoc): string[] => {
  const legacy = Array.isArray(doc.keywords)
    ? doc.keywords
        .map((k) => k?.keyword ?? '')
        .filter((s): s is string => s.length > 0)
    : [];
  return mergeKeywordSources(doc.seo?.keywords, legacy);
};

/**
 * Reduce a Payload-resolved doc into the flat document shape we
 * store in Meilisearch. Empty / null fields are dropped so the
 * payload stays tight on the wire.
 */
export const buildSearchDocument = (
  baseUrl: string,
  collection: string,
  doc: IndexableDoc,
): SearchDocument | null => {
  if (doc.id == null) return null;
  const title = doc.title ?? doc.name ?? '';
  if (title.length === 0) return null;

  const path = collectionUrlFromDoc(collection, {
    slug: doc.slug ?? null,
    path: doc.path ?? null,
  });
  const url = path ? absoluteUrl(baseUrl, path) : null;

  const body = lexicalToPlainText(doc.body) || lexicalToPlainText(doc.bioLong);

  const authors = onlyResolvedNamed(doc.authors);
  const categories = collectCategoryNames(doc);

  const out: Record<string, unknown> = {
    id: buildSearchDocumentId(collection, doc.id),
    collection,
    collectionWeight: COLLECTION_WEIGHT[collection] ?? 50,
    title,
    description: readDescription(doc),
    body,
    isPublished: doc._status == null || doc._status === 'published',
  };

  if (url) out.url = url;
  if (typeof doc.slug === 'string' && doc.slug.length > 0) out.slug = doc.slug;

  const publishedAt = readPublishedAt(doc);
  if (publishedAt) out.publishedAt = publishedAt;
  if (typeof doc.updatedAt === 'string') out.updatedAt = doc.updatedAt;

  if (authors.length > 0) out.authors = authors;
  if (categories.length > 0) out.categories = categories;

  const keywords = collectKeywords(doc);
  if (keywords.length > 0) out.keywords = keywords;

  return out as SearchDocument;
};

/**
 * The search-document ID format we use throughout the system,
 * `<collection>_<docId>`.
 *
 * Meilisearch only accepts document ids composed of `[a-zA-Z0-9_-]` — a
 * colon makes every `documentAdditionOrUpdate` task fail and silently
 * leaves the index empty. Collection slugs are alphanumeric (no
 * underscore), so `_` joins safely and unambiguously. `collection` is
 * also stored as its own field, so the id is never parsed back.
 */
export const buildSearchDocumentId = (
  collection: string,
  id: number | string,
): string => `${collection}_${id}`;
