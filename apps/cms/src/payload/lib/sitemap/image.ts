import { absoluteUrl } from '../jsonld/url';
import { collectionUrlFromDoc } from '../route-prefixes';
import type { SitemapPayload } from './collect';
import type { ImageSitemapEntry } from './xml';

export type { ImageSitemapEntry } from './xml';

/**
 * Collections whose published docs carry a primary image worth
 * announcing in the image sitemap. Authors have a `photo` field;
 * everything else uses `heroImage`. Pages are intentionally omitted —
 * page-level imagery lives inside Lexical blocks and needs body-walk
 * extraction (a separate pass).
 */
const IMAGE_COLLECTIONS: ReadonlyArray<{
  collection: string;
  imageField: 'heroImage' | 'photo';
}> = [
  { collection: 'blogs', imageField: 'heroImage' },
  { collection: 'news', imageField: 'heroImage' },
  { collection: 'guides', imageField: 'heroImage' },
  { collection: 'knowledgeBase', imageField: 'heroImage' },
  { collection: 'resources', imageField: 'heroImage' },
  { collection: 'events', imageField: 'heroImage' },
  { collection: 'webinars', imageField: 'heroImage' },
  { collection: 'authors', imageField: 'photo' },
];

const PER_PAGE = 100;
const MAX_PAGES = 100;

interface ResolvedImage {
  url?: string | null;
  alt?: string | null;
}

interface DocWithImage {
  slug?: string | null;
  path?: string | null;
  title?: string | null;
  name?: string | null;
  _status?: string | null;
  seo?: { indexable?: string | null } | null;
  heroImage?: ResolvedImage | number | null;
  photo?: ResolvedImage | number | null;
}

const isIndexable = (doc: DocWithImage): boolean => {
  const indexable = doc.seo?.indexable;
  if (indexable == null) return true;
  return indexable !== 'noindex' && indexable !== 'noindex,nofollow';
};

const readImage = (
  doc: DocWithImage,
  field: 'heroImage' | 'photo',
): ResolvedImage | null => {
  const value = doc[field];
  if (!value || typeof value === 'number') return null;
  if (typeof value.url !== 'string' || value.url.length === 0) return null;
  return value;
};

/**
 * Resolve an image's absolute URL. R2-served images already come back
 * absolute (`https://...`); local-dev or path-only urls get glued onto
 * `baseUrl`.
 */
const absoluteImageUrl = (baseUrl: string, raw: string): string => {
  if (/^https?:\/\//i.test(raw)) return raw;
  return absoluteUrl(baseUrl, raw.startsWith('/') ? raw : `/${raw}`);
};

/**
 * Walk image-bearing collections and return one image-sitemap entry
 * per published, indexable doc that has a hero / photo. Each entry
 * carries one image today; the schema supports many per page so the
 * shape leaves room for future Lexical body-image extraction.
 */
export const collectImageSitemapEntries = async (
  payload: SitemapPayload,
  baseUrl: string,
): Promise<ImageSitemapEntry[]> => {
  const entries: ImageSitemapEntry[] = [];

  for (const { collection, imageField } of IMAGE_COLLECTIONS) {
    let page = 1;
    while (page <= MAX_PAGES) {
      const result = await payload.find({
        collection,
        limit: PER_PAGE,
        page,
        sort: '-updatedAt',
        // depth=1 resolves heroImage / photo to a Media row with `url`.
        depth: 1,
        overrideAccess: false,
        draft: false,
      });
      const docs = result.docs as DocWithImage[];
      for (const doc of docs) {
        if (!isIndexable(doc)) continue;
        if (doc._status != null && doc._status !== 'published') continue;
        const image = readImage(doc, imageField);
        if (!image || !image.url) continue;
        const path = collectionUrlFromDoc(collection, doc);
        if (!path) continue;
        entries.push({
          loc: absoluteUrl(baseUrl, path),
          images: [
            {
              loc: absoluteImageUrl(baseUrl, image.url),
              caption: image.alt ?? null,
              title: doc.title ?? doc.name ?? null,
            },
          ],
        });
      }
      if (!result.hasNextPage) break;
      page += 1;
    }
  }

  return entries;
};
