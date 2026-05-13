import type { CollectionConfig, Field } from 'payload';

/**
 * Mount the per-document Analytics tab (Phase J2 L2) onto each
 * collection whose documents have a public URL. The tab is a single
 * `ui` field that fetches data via `/api/dashboards/*` endpoints.
 *
 * Why a wrapper rather than touching each collection file: the field
 * is identical across all eight collections and we want one place to
 * change the mount path or visibility logic. Same pattern as
 * `wireCustomFields` / `wirePublishGate`.
 */

const COLLECTIONS_WITH_ANALYTICS = new Set([
  'pages',
  'blogs',
  'news',
  'guides',
  'resources',
  'knowledgeBase',
  'webinars',
  'events',
]);

const analyticsTabField: Field = {
  name: 'analyticsTab',
  type: 'ui',
  admin: {
    components: {
      Field: {
        path: '@/payload/admin/components/integrations/AnalyticsTab.tsx#AnalyticsTab',
      },
    },
  },
};

export const wireAnalyticsTab = (collection: CollectionConfig): CollectionConfig => {
  if (!COLLECTIONS_WITH_ANALYTICS.has(collection.slug)) return collection;
  // Skip if already present (idempotent for HMR + repeat init).
  const alreadyHas = collection.fields.some(
    (f) => f.type !== 'tabs' && 'name' in f && f.name === 'analyticsTab',
  );
  if (alreadyHas) return collection;
  return {
    ...collection,
    fields: [...collection.fields, analyticsTabField],
  };
};
