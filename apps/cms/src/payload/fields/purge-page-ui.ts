import type { Field } from 'payload';

/**
 * Sidebar "Purge this page" button. Spread into the `fields` array of every
 * collection in PURGEABLE_COLLECTIONS (web-pages.ts). A `ui` field renders no
 * data — it only mounts the PurgePageButton client component, which calls the
 * same-origin /api/cache-purge endpoint for this doc.
 */
export const purgePageUiField: Field = {
  name: 'purgeCache',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: {
      Field: '@/payload/admin/components/cache/PurgePageButton.tsx#PurgePageButton',
    },
  },
};
