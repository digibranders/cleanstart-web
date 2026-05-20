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
};
