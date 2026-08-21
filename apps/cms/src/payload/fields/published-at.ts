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
 *
 * `beforeDuplicate` clears the value. Payload's duplicate action
 * otherwise carries the source doc's `publishedAt` into the new draft,
 * and `firstPublishHook`'s "never overwrite an existing value" guard
 * then treats that copied value as an intentional prior stamp — so a
 * duplicated-then-published post silently keeps the *source* post's
 * publish date instead of getting its own.
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
    // Surfaced in the document edit-view's top status bar via
    // DocStatusBar (mounted as `admin.components.edit.beforeDocumentControls`),
    // which reads this value through `useField`. Hidden here so the form
    // doesn't render a duplicate read-only date input.
    hidden: true,
  },
  hooks: {
    beforeDuplicate: [() => null],
  },
};
