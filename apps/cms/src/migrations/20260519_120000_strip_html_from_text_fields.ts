import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

import {
  htmlToPlainText,
  looksLikeHtml,
} from '../payload/lib/webflow-import/html-to-plain-text';

/**
 * Backfill: strip HTML tags from Payload plain-text fields that were
 * imported verbatim from Webflow rich-text exports.
 *
 * Background: the original `migrations/webflow-import/transform/*.ts`
 * `asString` helper only trimmed whitespace. Webflow rich-text fields
 * (e.g. Authors `professional-title`, Blogs `abstract-2`, Resources
 * `resource-detail` summary) export as HTML and landed in Payload
 * `text` / `textarea` columns as literal `<p>...</p>` strings, which
 * the public site then renders as text on author cards, blog summaries,
 * etc.
 *
 * The transforms are now fixed; this migration cleans the rows already
 * in Postgres. Idempotent — values that no longer look like HTML are
 * skipped, so running this twice is a no-op.
 *
 * No `down` reversal: re-adding HTML to clean text would not restore
 * the original HTML markup, only a destructive approximation. Down is a
 * no-op.
 */

const TARGETS = {
  authors: ['name', 'role', 'location', 'bioShort', 'seo.title', 'seo.description'],
  blogs: ['title', 'abstract', 'seo.title', 'seo.description'],
  news: ['title', 'abstract', 'seo.title', 'seo.description'],
  resources: ['title', 'summary', 'ctaButtonText', 'seo.title', 'seo.description'],
  guides: ['title', 'abstract', 'seo.title', 'seo.description'],
  events: ['title', 'venue', 'abstract', 'customDateLabel', 'seo.title', 'seo.description'],
  webinars: ['title', 'abstract', 'seo.title', 'seo.description'],
  jobs: ['title', 'seo.title', 'seo.description'],
  categories: ['name', 'description'],
  newsCategories: ['name', 'description'],
  aboutGalleries: ['name', 'caption'],
  pages: ['title', 'seo.title', 'seo.description'],
} as const;

type CollectionSlug = keyof typeof TARGETS;

const getPath = (obj: unknown, path: string): unknown => {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
};

const setPath = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> => {
  const parts = path.split('.');
  const root: Record<string, unknown> = { ...obj };
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const k = parts[i] as string;
    const next = cur[k];
    cur[k] =
      next && typeof next === 'object' && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1] as string] = value;
  return root;
};

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const [collection, fields] of Object.entries(TARGETS) as Array<
    [CollectionSlug, readonly string[]]
  >) {
    let page = 1;
    const pageSize = 100;
    let docsUpdated = 0;
    let fieldsFixed = 0;
    let scanned = 0;

    // Wrap per-collection so a schema mismatch on one collection (e.g.
    // versioned-table column that pre-dates a field rename) doesn't abort
    // the whole migration. The migration's purpose is data cleanup of
    // Webflow-imported content; on a fresh DB with no data, every
    // collection is a no-op anyway. Failures are logged and skipped.
    try {
    while (true) {
      const res = await payload.find({
        collection,
        depth: 0,
        page,
        limit: pageSize,
        pagination: true,
        overrideAccess: true,
        draft: true,
        req,
      });
      if (res.docs.length === 0) break;

      for (const doc of res.docs as unknown as Array<Record<string, unknown>>) {
        scanned += 1;
        let patch: Record<string, unknown> = {};
        let docChanged = false;
        for (const field of fields) {
          const value = getPath(doc, field);
          if (!looksLikeHtml(value)) continue;
          const cleaned = htmlToPlainText(value as string);
          if (cleaned === value) continue;
          docChanged = true;
          fieldsFixed += 1;
          patch = setPath(patch, field, cleaned);
        }
        if (!docChanged) continue;
        try {
          await payload.update({
            collection,
            id: doc.id as string | number,
            data: patch,
            overrideAccess: true,
            draft: false,
            req,
          });
          docsUpdated += 1;
        } catch (err) {
          payload.logger.warn(
            `[strip-html-from-text-fields] ${collection}#${String(doc.id)} update failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }

      if (!res.hasNextPage) break;
      page += 1;
    }

    payload.logger.info(
      `[strip-html-from-text-fields] ${collection}: scanned=${scanned} docsUpdated=${docsUpdated} fieldsFixed=${fieldsFixed}`,
    );
    } catch (err) {
      payload.logger.warn(
        `[strip-html-from-text-fields] skipping ${collection} (likely a schema mismatch — investigate via the migration audit backlog item): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No-op: re-introducing HTML markup is destructive and not reversible.
}
