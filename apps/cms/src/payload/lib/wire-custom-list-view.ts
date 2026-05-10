import type { CollectionConfig } from 'payload';

const CMS_LIST_VIEW = '@/payload/admin/components/views/list/CmsListView.tsx#CmsListView';

/**
 * Stamp the CleanStart custom list view onto every collection that
 * doesn't already declare its own. Mirrors the shape of `wireCustomFields`
 * so collection definitions stay declarative.
 *
 * Per-collection overrides win — if a collection author has set
 * `admin.components.views.list`, we don't touch it.
 */
export const wireCustomListView = (collection: CollectionConfig): CollectionConfig => {
  const adminCfg = collection.admin ?? {};
  const components = adminCfg.components ?? {};
  const views = (components as { views?: Record<string, unknown> }).views ?? {};
  const existingList = (views as { list?: unknown }).list;
  if (existingList) return collection;

  return {
    ...collection,
    admin: {
      ...adminCfg,
      components: {
        ...components,
        views: {
          ...views,
          list: {
            Component: CMS_LIST_VIEW,
          },
        },
      },
    },
  } as CollectionConfig;
};
