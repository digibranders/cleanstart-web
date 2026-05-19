/**
 * H4.5 — Build asset → context map
 *
 * Pre-pass that attributes every Webflow CDN URL to its strongest
 * referencing document so `upload-assets.ts` can write R2 keys using
 * a human-meaningful slug instead of the SHA-256 hash. Without this
 * step every migrated image lands at `media/webflow-migration/<sha>.png`
 * which carries zero SEO/debugging signal.
 *
 * Output: migrations/webflow-export/.asset-context.json
 *
 * Conflict resolution when a single asset appears in multiple rows:
 *   1. Field-role refs (_rawHeroImage, _rawIcon, …) beat inline body refs.
 *   2. Field-role refs ranked by `ROLE_PRIORITY` (hero > photo > icon > image > asset > pdf > inline).
 *   3. Collections ranked by `COLLECTION_PRIORITY` (authors > blogs > news > …).
 *   4. Final tie: lexicographic doc slug.
 *
 * Usage:
 *   tsx migrations/webflow-import/build-asset-context-map.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const TRANSFORMED_DIR = path.resolve('migrations/webflow-export/transformed');
const CONTEXT_FILE = path.resolve('migrations/webflow-export/.asset-context.json');

const WEBFLOW_CDN_RE =
  /https:\/\/(?:cdn\.prod\.website-files\.com|uploads(?:-ssl)?\.webflow\.com)\/[^\s"<>]+/g;

const cleanseUrl = (url: string): string => url.replace(/[.,;]+$/, '');

export type AssetRole = 'hero' | 'photo' | 'icon' | 'image' | 'asset' | 'pdf' | 'inline';

const ROLE_BY_RAW_KEY: Record<string, AssetRole> = {
  _rawHeroImage: 'hero',
  _rawIcon: 'icon',
  _rawPhoto: 'photo',
  _rawImage: 'image',
  _rawAsset: 'asset',
  _rawPdf: 'pdf',
  _rawGallery: 'image',
};

const ROLE_PRIORITY: Record<AssetRole, number> = {
  hero: 1,
  photo: 2,
  icon: 3,
  image: 4,
  asset: 5,
  pdf: 6,
  inline: 99,
};

const COLLECTION_PRIORITY: Record<string, number> = {
  authors: 1,
  blogs: 2,
  news: 3,
  guides: 4,
  resources: 5,
  events: 6,
  webinars: 7,
  jobs: 8,
  aboutGalleries: 9,
  pages: 10,
  categories: 11,
  newsCategories: 12,
  jobLocations: 13,
};

const collectionPriority = (collection: string): number =>
  COLLECTION_PRIORITY[collection] ?? 100;

export interface AssetContextPrimary {
  collection: string;
  docSlug: string;
  role: AssetRole;
  altHint?: string;
}

export interface AssetContext {
  webflowUrl: string;
  primary: AssetContextPrimary;
  otherRefs: number;
}

interface Candidate extends AssetContextPrimary {
  webflowUrl: string;
}

const stronger = (a: Candidate, b: Candidate): Candidate => {
  if (ROLE_PRIORITY[a.role] !== ROLE_PRIORITY[b.role]) {
    return ROLE_PRIORITY[a.role] < ROLE_PRIORITY[b.role] ? a : b;
  }
  if (collectionPriority(a.collection) !== collectionPriority(b.collection)) {
    return collectionPriority(a.collection) < collectionPriority(b.collection) ? a : b;
  }
  return a.docSlug <= b.docSlug ? a : b;
};

const collectUrlsFromValue = (value: unknown, out: Set<string>): void => {
  if (value == null) return;
  if (typeof value === 'string') {
    for (const match of value.matchAll(WEBFLOW_CDN_RE)) out.add(cleanseUrl(match[0]));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrlsFromValue(item, out);
    return;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectUrlsFromValue(v, out);
    }
  }
};

const extractAltHint = (bodyHtml: string, url: string): string | undefined => {
  // Pull alt attribute from <img> tags that reference this URL. Match
  // both alt-before-src and src-before-alt orderings. Stop at the
  // first match — Webflow rarely uses the same image twice in one body.
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<img[^>]*alt="([^"]*)"[^>]*src="${escaped}"`, 'i'),
    new RegExp(`<img[^>]*src="${escaped}"[^>]*alt="([^"]*)"`, 'i'),
  ];
  for (const re of patterns) {
    const m = bodyHtml.match(re);
    if (m && m[1] && m[1].trim().length > 0) return m[1].trim();
  }
  return undefined;
};

const stringifyForAltScan = (row: Record<string, unknown>): string => {
  // Cheap path: serialise the whole row and let extractAltHint regex
  // do the work. Inline body HTML lives in lexical state JSON post-
  // transform, but Webflow's raw HTML may also live in other string
  // fields — JSON.stringify covers both.
  try {
    return JSON.stringify(row);
  } catch {
    return '';
  }
};

const processRow = (
  collection: string,
  row: Record<string, unknown>,
  candidates: Map<string, Candidate[]>,
  refCounts: Map<string, number>,
): void => {
  const docSlug =
    typeof row.slug === 'string' && row.slug.trim().length > 0
      ? row.slug.trim()
      : typeof row._webflowId === 'string'
        ? row._webflowId
        : 'unknown';

  const rowJson = stringifyForAltScan(row);

  // Field-role candidates.
  for (const [rawKey, role] of Object.entries(ROLE_BY_RAW_KEY)) {
    if (!(rawKey in row)) continue;
    const urls = new Set<string>();
    collectUrlsFromValue(row[rawKey], urls);
    for (const url of urls) {
      const candidate: Candidate = {
        webflowUrl: url,
        collection,
        docSlug,
        role,
        altHint: extractAltHint(rowJson, url),
      };
      const list = candidates.get(url) ?? [];
      list.push(candidate);
      candidates.set(url, list);
      refCounts.set(url, (refCounts.get(url) ?? 0) + 1);
    }
  }

  // Inline body / generic-string candidates — every URL the row
  // mentions that wasn't already a field-role ref.
  const inlineUrls = new Set<string>();
  collectUrlsFromValue(row, inlineUrls);
  for (const url of inlineUrls) {
    refCounts.set(url, (refCounts.get(url) ?? 0) + 1);
    const list = candidates.get(url);
    // Skip if this row already contributed a field-role candidate
    // for the same URL — inline shouldn't win against same-doc hero.
    if (list && list.some((c) => c.docSlug === docSlug && c.collection === collection)) {
      continue;
    }
    const candidate: Candidate = {
      webflowUrl: url,
      collection,
      docSlug,
      role: 'inline',
      altHint: extractAltHint(rowJson, url),
    };
    const next = candidates.get(url) ?? [];
    next.push(candidate);
    candidates.set(url, next);
  }
};

const run = async (): Promise<void> => {
  if (!fs.existsSync(TRANSFORMED_DIR)) {
    console.error(
      '[asset-context] Transformed dir not found. Run transform/index.ts first.',
    );
    process.exit(1);
  }

  const candidates = new Map<string, Candidate[]>();
  const refCounts = new Map<string, number>();

  const files = fs.readdirSync(TRANSFORMED_DIR).filter((f) => f.endsWith('.jsonl'));
  for (const file of files) {
    const collection = path.basename(file, '.jsonl');
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(TRANSFORMED_DIR, file)),
    });
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        processRow(collection, row, candidates, refCounts);
      } catch {
        /* skip malformed line */
      }
    }
  }

  const out: AssetContext[] = [];
  for (const [url, list] of candidates) {
    const winner = list.reduce<Candidate>((a, b) => stronger(a, b), list[0] as Candidate);
    const total = refCounts.get(url) ?? list.length;
    out.push({
      webflowUrl: url,
      primary: {
        collection: winner.collection,
        docSlug: winner.docSlug,
        role: winner.role,
        altHint: winner.altHint,
      },
      otherRefs: Math.max(0, total - 1),
    });
  }

  fs.mkdirSync(path.dirname(CONTEXT_FILE), { recursive: true });
  fs.writeFileSync(CONTEXT_FILE, JSON.stringify(out, null, 2));
  console.log(`[asset-context] Wrote ${out.length} entries → ${CONTEXT_FILE}`);
};

run().catch((err) => {
  console.error('[asset-context] Fatal:', err);
  process.exit(1);
});
