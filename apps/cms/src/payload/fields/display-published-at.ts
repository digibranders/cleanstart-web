import type { Field } from 'payload';

/**
 * Editor-controlled "display publish date" — the timestamp shown to
 * Google (JSON-LD `datePublished`) and to public-page bylines. Sits
 * next to the locked `publishedAt` (system "first went live" stamp).
 *
 * Lifecycle:
 *  - **Empty by default.** A sibling beforeChange hook
 *    (`displayPublishedAtBackfillHook`) stamps it on first publish to
 *    match `publishedAt`, so editors who never touch the picker get
 *    sensible behaviour.
 *  - **Editor-set** values are preserved — the backfill hook only
 *    fires when the field is still null.
 *  - **Backdates >24h** from `publishedAt` (or `now()` if the doc has
 *    never been published) are audit-logged via
 *    `displayPublishedAtAuditHook` for compliance.
 *
 * Read precedence (jsonld/dispatch.ts, sitemap, byline helpers):
 *   publicationDate > displayPublishedAt > publishedAt > createdAt
 *
 * News intentionally does NOT get this field — its `publicationDate`
 * is semantically equivalent and already wins the precedence check.
 *
 * `beforeDuplicate` clears the value for the same reason as
 * `publishedAtField`: Payload's duplicate action copies it from the
 * source doc, and `displayPublishedAtBackfillHook`'s "already set"
 * check only inspects the incoming save data — so a copied value
 * looks editor-set and is never re-stamped on the duplicate's actual
 * publish, leaving it (and therefore the public listing sort) anchored
 * to the source post's date.
 */
export const displayPublishedAtField: Field = {
  name: 'displayPublishedAt',
  type: 'date',
  index: true,
  admin: {
    position: 'sidebar',
    date: { pickerAppearance: 'dayAndTime' },
    description:
      'The date Google sees as the original publish date. Defaults to publish time. Backdating beyond 30 days can trigger spam-policy flags.',
    components: {
      Field:
        '@/payload/admin/components/DisplayPublishedAtField.tsx#DisplayPublishedAtField',
    },
  },
  hooks: {
    beforeDuplicate: [() => null],
  },
};
