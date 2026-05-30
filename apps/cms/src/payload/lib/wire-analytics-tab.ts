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

/**
 * Recursively checks whether any field in the tree (including inside
 * tabs) already has `name === 'analyticsTab'`. This prevents duplicate
 * insertion when a collection nests the field inside a tab group.
 */
const hasAnalyticsTab = (fields: Field[]): boolean => {
  for (const f of fields) {
    if ('name' in f && f.name === 'analyticsTab') return true;
    if (f.type === 'tabs' && 'tabs' in f) {
      for (const tab of f.tabs as Array<{ fields?: Field[] }>) {
        if (tab.fields && hasAnalyticsTab(tab.fields)) return true;
      }
    }
  }
  return false;
};

export const wireAnalyticsTab = (collection: CollectionConfig): CollectionConfig => {
  if (!COLLECTIONS_WITH_ANALYTICS.has(collection.slug)) return collection;
  // Skip if already present anywhere in the field tree (idempotent for
  // HMR, repeat init, and collections that wrap fields inside tabs).
  if (hasAnalyticsTab(collection.fields)) return collection;
  return {
    ...collection,
    fields: [...collection.fields, analyticsTabField],
  };
};
