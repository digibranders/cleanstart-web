import type { CollectionConfig, GlobalConfig } from 'payload';

const CMS_EDIT_VIEW = '@/payload/admin/components/views/edit/CmsEditView.tsx#CmsEditView';
const CMS_VERSIONS_VIEW =
  '@/payload/admin/components/views/versions/CmsVersionsView.tsx#CmsVersionsView';

/**
 * Stamp the CleanStart custom edit view onto every collection + global
 * that doesn't already declare its own. Mirrors the shape of
 * `wireCustomFields` and `wireCustomListView` so collection + global
 * definitions stay declarative.
 *
 * Per-entity overrides win — if an author has set
 * `admin.components.views.edit.default`, we don't touch it. This only
 * stamps the `default` sub-view; `versions` / `version` rebuilds land
 * in Wave 4 part 2.
 */
export const wireCustomEditView = <T extends CollectionConfig | GlobalConfig>(
  entity: T,
): T => {
  const adminCfg = (entity.admin ?? {}) as Record<string, unknown>;
  const components = (adminCfg.components ?? {}) as Record<string, unknown>;
  const views = (components.views ?? {}) as Record<string, unknown>;
  const edit = (views.edit ?? {}) as Record<string, unknown>;
  if (edit.default || edit.Component) return entity;

  return {
    ...entity,
    admin: {
      ...adminCfg,
      components: {
        ...components,
        views: {
          ...views,
          edit: {
            ...edit,
            default: { Component: CMS_EDIT_VIEW },
            ...(edit.versions
              ? {}
              : { versions: { Component: CMS_VERSIONS_VIEW } }),
          },
        },
      },
    },
  } as T;
};
