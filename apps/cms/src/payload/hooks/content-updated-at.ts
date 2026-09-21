import { isDeepStrictEqual } from 'node:util';

import type { CollectionBeforeChangeHook } from 'payload';

/**
 * `req.context` flag for writes that are not editorial: backfills, imports,
 * normalisation passes. Pass it on `payload.update({ context: { ... } })` so a
 * script that rewrites every body does not claim every article was edited.
 */
export const SKIP_CONTENT_TIMESTAMP = 'skipContentTimestamp';

const FIELD = 'contentUpdatedAt';

/** Reader-visible fields. SEO meta, media, taxonomy and stats are not content. */
const DEFAULT_TRACKED_FIELDS: readonly string[] = ['title', 'body', 'abstract', 'summary', 'faqs'];

export type ContentUpdatedAtHookOptions = {
  trackedFields?: readonly string[];
};

/**
 * Stamps `contentUpdatedAt` only when reader-visible content changes.
 *
 * Payload's own `updatedAt` moves on every write, including bulk scripts: two
 * three-minute backfills (2026-06-09, 2026-08-12) re-dated 368 documents, and
 * the site published that as sitemap `lastmod`, JSON-LD `dateModified` and the
 * "Updated" byline. Google only trusts `lastmod` when it is consistently
 * accurate, so the public "modified" date needs its own field.
 *
 * Comparison is structural, not `JSON.stringify`: Postgres `jsonb` reorders
 * object keys, so a body re-sent unchanged by the admin form is not
 * byte-identical to the stored one.
 *
 * On an unchanged save the stored value is written back over whatever the form
 * sent. The field is read-only in the admin, and a stale form value must not
 * clear it.
 *
 * Register after `normalizeLexicalHook` so the incoming body is compared in the
 * same normalised shape it is stored in.
 */
export const contentUpdatedAtHook = (
  options: ContentUpdatedAtHookOptions = {},
): CollectionBeforeChangeHook => {
  const trackedFields = options.trackedFields ?? DEFAULT_TRACKED_FIELDS;
  return ({ data, originalDoc, operation, req }) => {
    if (!data) return data;
    if (operation !== 'create' && operation !== 'update') return data;

    const next = data as Record<string, unknown>;
    const previous = (originalDoc ?? {}) as Record<string, unknown>;
    const isSystemWrite = req?.context?.[SKIP_CONTENT_TIMESTAMP] === true;

    const changed = trackedFields.some((field) => {
      if (!(field in next)) return false;
      if (operation === 'create') return next[field] != null;
      return !isDeepStrictEqual(next[field] ?? null, previous[field] ?? null);
    });

    if (changed && !isSystemWrite) {
      next[FIELD] = new Date().toISOString();
      return next;
    }

    if (operation === 'update') {
      next[FIELD] = previous[FIELD] ?? null;
    }
    return next;
  };
};
