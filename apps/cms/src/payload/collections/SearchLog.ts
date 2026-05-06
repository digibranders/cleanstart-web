import type { CollectionConfig } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';

/**
 * Append-only log of public-site search queries with their hit
 * counts. The high-leverage signal is the `zero-result` sub-stream:
 * editors can scan it weekly to spot content gaps (queries the
 * audience expects to find something for, but doesn't).
 *
 * Per arch doc §search-analytics, write access is granted only via
 * the public `/api/search/analytics` endpoint (`update` / `delete`
 * locked to admin so the editor can't accidentally tamper with the
 * stream).
 *
 * Retention: handled by a Phase G cron — 90-day window per arch
 * doc §retention. Not enforced at the collection level so the
 * admin can keep / discard manually when needed.
 */
export const SearchLog: CollectionConfig = {
  slug: 'searchLog',
  labels: { singular: 'Search log entry', plural: 'Search log' },
  admin: {
    useAsTitle: 'query',
    defaultColumns: ['query', 'resultsCount', 'locale', 'createdAt'],
    group: 'System',
    description:
      'Public-site search queries logged via /api/search/analytics. Filter resultsCount=0 to find content gaps.',
  },
  access: {
    read: isAdminOrEditor,
    // create is granted to anonymous via the endpoint (overrideAccess: true) —
    // direct REST POSTs to /api/searchLog still require admin.
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'query', type: 'text', required: true },
    {
      name: 'resultsCount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Number of hits the search returned. Zero = content gap signal.',
      },
    },
    {
      name: 'locale',
      type: 'text',
      admin: { description: 'Optional locale tag (e.g. en-US). Used to filter analytics later.' },
    },
    {
      name: 'ip',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Client IP — used for abuse detection. Auto-purged at the same cadence as leads.',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: { readOnly: true, description: 'User-Agent header. Trimmed at 200 chars.' },
    },
  ],
  timestamps: true,
};
