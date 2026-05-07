import type { Field } from 'payload';

/**
 * Shared `publishedAt` field for content collections that go through
 * the draft → published versioning flow.
 *
 * Lifecycle:
 *  - **First publish**: `firstPublishHook` stamps `now()`.
 *  - **Legacy rows**: same hook backfills with `createdAt` on the
 *    first save after the hook landed.
 *  - **Direct edits**: locked. The field is `admin.readOnly: true` and
 *    `access.update: () => false` so accidental backdating from the
 *    UI is impossible. Server-side hooks bypass field-level access
 *    and continue to populate it.
 *
 * If a legacy import genuinely needs backdating (e.g. surfacing a
 * 2020 article), use the Payload Local API or a one-off script that
 * calls `payload.update({ collection, id, data: { publishedAt: ... } })`
 * with `overrideAccess: true` — that's the documented escape hatch.
 *
 * Required for valid Schema.org Article / NewsArticle / TechArticle
 * `datePublished`. The JSON-LD dispatcher reads this field via
 * `readPublishedAt` and emits `datePublished` only when non-null.
 *
 * News uses its own `publicationDate` field (editor-set, points at
 * the news event time rather than first-publish time) — the dispatcher
 * prefers `publicationDate` over `publishedAt` so News continues to
 * work as before.
 */
export const publishedAtField: Field = {
  name: 'publishedAt',
  type: 'date',
  access: {
    update: () => false,
  },
  admin: {
    readOnly: true,
    description:
      'Auto-set on first publish. Read-only — backdating is intentionally locked. Use the Payload Local API with overrideAccess for legacy imports.',
    date: { pickerAppearance: 'dayAndTime' },
    position: 'sidebar',
  },
};
