import type { Field } from 'payload';

/**
 * When reader-visible content last changed. System-managed by
 * `contentUpdatedAtHook`; this is what the site publishes as sitemap `lastmod`,
 * JSON-LD `dateModified` and the "Updated" byline. `updatedAt` is not used for
 * that because every write moves it, bulk scripts included.
 *
 * Empty means "no verified edit since publication": the site then falls back to
 * the publish date, which is the honest answer.
 *
 * `beforeDuplicate` clears it so a copy does not inherit the source's history.
 */
export const contentUpdatedAtField: Field = {
  name: 'contentUpdatedAt',
  type: 'date',
  admin: {
    position: 'sidebar',
    readOnly: true,
    date: { pickerAppearance: 'dayAndTime' },
    description:
      'Set automatically when the title, body, summary or FAQs change. Shown publicly as the "Updated" date.',
  },
  hooks: {
    beforeDuplicate: [() => null],
  },
};
