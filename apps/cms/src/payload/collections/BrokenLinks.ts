import type { CollectionConfig } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';

/**
 * Shadow collection populated by the nightly `checkBrokenLinks` cron.
 * One row per (sourceCollection, sourceDocId, url) — same URL on
 * different docs gets one row each so editors can fix in-place.
 *
 * Read by editors via the admin list view (filter by `status=broken`
 * for the actionable subset). Written exclusively by the cron with
 * overrideAccess; admin UI is read-only. Create/update are denied in
 * access AND every field is `admin.readOnly` — collection-level
 * `update: () => false` blocks the save but does NOT disable the form
 * inputs, so the per-field flag is what actually prevents hand-editing a
 * cron-detected row. Fix a broken link on its source doc and re-publish;
 * the next cron run clears the row.
 */
export const BrokenLinks: CollectionConfig = {
  slug: 'brokenLinks',
  labels: { singular: 'Broken link', plural: 'Broken links' },
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'status', 'sourceCollection', 'sourceDocId', 'lastChecked'],
    // System/ops group — cron-written, admin-read-only monitoring table; not an
    // editorial SEO surface (Redirects + Pages (Schema) remain under SEO).
    group: 'System',
    description:
      'Auto-populated by the nightly link-check cron. Read-only — fix the URL on the source doc and re-publish, the next cron run clears the row.',
  },
  access: {
    read: isAdminOrEditor,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: 'url', type: 'text', required: true, index: true, admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      admin: { readOnly: true },
      options: [
        { label: 'OK (2xx)', value: 'ok' },
        { label: 'Broken (4xx / 5xx)', value: 'broken' },
        { label: 'Redirect', value: 'redirect' },
        { label: 'Network error / timeout', value: 'network' },
      ],
      index: true,
    },
    {
      name: 'httpStatus',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Last observed HTTP status. 0 when the request failed before a response.',
      },
    },
    { name: 'sourceCollection', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceDocId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceDocSlug', type: 'text', admin: { readOnly: true } },
    { name: 'firstSeenAt', type: 'date', admin: { readOnly: true } },
    { name: 'lastChecked', type: 'date', admin: { readOnly: true } },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        readOnly: true,
        description:
          'Optional human note (e.g. "publisher confirmed page taken down — replace with archive.org snapshot").',
      },
    },
  ],
  timestamps: true,
};
