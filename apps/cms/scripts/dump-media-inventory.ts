#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Dump a per-collection, per-document media inventory (READ-ONLY).
 *
 * For every content collection, fetch all docs at depth:1 — which
 * populates each doc's OWN upload fields (hero image, SEO og/twitter,
 * galleries, block images) and its inline rich-text `upload` nodes,
 * while leaving media that belongs to *related* docs (e.g. an author's
 * photo on a blog) as a bare id (depth exhausted), so it is not
 * mis-attributed. Then walk each doc, collect every populated media
 * object (deduped per doc), and write a JSON inventory.
 *
 * Output: ./media-inventory.json (in the cwd, apps/cms).
 *
 * Run inside the prod cms container (env already present):
 *   docker exec cleanstart-cms-1 node --no-warnings \
 *     --experimental-strip-types apps/cms/scripts/dump-media-inventory.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

// System / PII collections with no website media to inventory.
const SKIP = new Set<string>([
  'media',
  'users',
  'forms',
  'leads',
  'careerApplications',
  'career-applications',
  'partnerInquiries',
  'partner-inquiries',
  'consentLog',
  'consent-log',
  'webhookDeadLetter',
  'webhook-dead-letter',
  'searchLog',
  'search-log',
  'redirects',
  'integrations',
  'payload-locked-documents',
  'payload-preferences',
  'payload-migrations',
  'payload-jobs',
]);

interface MediaRow {
  role: string;
  id: number | string;
  filename: string;
  mimeType: string;
  filesize: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  url: string | null;
}

interface DocRow {
  docId: number | string;
  title: string;
  slug: string | null;
  status: string | null;
  images: MediaRow[];
}

const isMedia = (v: unknown): v is Record<string, unknown> =>
  !!v &&
  typeof v === 'object' &&
  typeof (v as { url?: unknown }).url === 'string' &&
  typeof (v as { filename?: unknown }).filename === 'string' &&
  typeof (v as { mimeType?: unknown }).mimeType === 'string';

const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

const walk = (
  node: unknown,
  path: string,
  acc: MediaRow[],
  seen: Set<number | string>,
): void => {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, path, acc, seen);
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (isMedia(node)) {
    const id = node.id as number | string;
    if (!seen.has(id)) {
      seen.add(id);
      acc.push({
        role: path || 'image',
        id,
        filename: String(node.filename),
        mimeType: String(node.mimeType),
        filesize: num(node.filesize),
        width: num(node.width),
        height: num(node.height),
        alt: str(node.alt),
        url: str(node.url),
      });
    }
    return; // don't descend into media internals (sizes/derivatives)
  }

  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    // skip noisy lexical bookkeeping keys to keep the role path readable
    if (k === 'root' || k === 'children') {
      walk(v, path || 'body', acc, seen);
      continue;
    }
    walk(v, path ? `${path}.${k}` : k, acc, seen);
  }
};

const titleOf = (doc: Record<string, unknown>): string => {
  for (const key of ['title', 'name', 'heading', 'question', 'slug']) {
    const v = doc[key];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return `#${String(doc.id)}`;
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  const slugs = payload.config.collections
    .map((c) => c.slug)
    .filter((s) => !SKIP.has(s));

  const out: Record<string, DocRow[]> = {};

  for (const slug of slugs) {
    const rows: DocRow[] = [];
    let page = 1;
    for (;;) {
      let res: Awaited<ReturnType<typeof payload.find>>;
      try {
        res = await payload.find({
          collection: slug as never,
          depth: 1,
          limit: 100,
          page,
          overrideAccess: true,
          draft: false,
        });
      } catch (err) {
        payload.logger.warn(`skip ${slug}: ${err instanceof Error ? err.message : String(err)}`);
        break;
      }
      for (const raw of res.docs) {
        const doc = raw as Record<string, unknown>;
        const images: MediaRow[] = [];
        walk(doc, '', images, new Set());
        if (images.length === 0) continue;
        rows.push({
          docId: doc.id as number | string,
          title: titleOf(doc),
          slug: str(doc.slug),
          status: str(doc._status),
          images,
        });
      }
      if (!res.hasNextPage) break;
      page += 1;
    }
    if (rows.length > 0) {
      out[slug] = rows;
      payload.logger.info(`${slug}: ${rows.length} docs with images`);
    }
  }

  const fs = await import('node:fs');
  fs.writeFileSync('/tmp/media-inventory.json', `${JSON.stringify(out, null, 2)}\n`);
  payload.logger.info(
    `Wrote /tmp/media-inventory.json (${Object.keys(out).length} collections).`,
  );
  process.exit(0);
};

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
