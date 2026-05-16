import type { CollectionConfig, CustomComponent } from 'payload';

import { publishGateHook } from '../hooks/publish-gate';

const BANNER_PATH =
  '@/payload/admin/components/PublishChecklistBanner.tsx#PublishChecklistBanner';
const OVERRIDE_GUARD_PATH =
  '@/payload/admin/components/PublishOverrideGuard.tsx#PublishOverrideGuard';

/**
 * Collections that need the publish-gate beforeChange check.
 * Taxonomy/system/media collections are excluded — they don't have
 * the SEO/slug fields the gate inspects.
 */
const GATED_SLUGS = new Set([
  'blogs',
  'news',
  'guides',
  'resources',
  'knowledgeBase',
  'events',
  'webinars',
  'jobs',
  'pages',
]);

type EditConfig = NonNullable<
  NonNullable<NonNullable<CollectionConfig['admin']>['components']>['edit']
>;

/**
 * Injects `publishGateHook` as the first `beforeChange` handler and
 * adds `PublishChecklistBanner` to `beforeDocumentControls` for every
 * gated collection. Non-gated collections pass through unchanged.
 */
export const wirePublishGate = (collection: CollectionConfig): CollectionConfig => {
  if (!GATED_SLUGS.has(collection.slug)) return collection;

  const existingHooks = collection.hooks?.beforeChange ?? [];

  const adminCfg = collection.admin ?? {};
  const components = adminCfg.components ?? {};
  const editCfg = (components.edit ?? {}) as EditConfig;
  const existingBeforeDocControls =
    (editCfg as { beforeDocumentControls?: CustomComponent[] }).beforeDocumentControls ?? [];

  const updatedEdit: EditConfig = {
    ...editCfg,
    beforeDocumentControls: [
      ...existingBeforeDocControls,
      { path: BANNER_PATH } as CustomComponent,
      { path: OVERRIDE_GUARD_PATH } as CustomComponent,
    ],
  };

  return {
    ...collection,
    admin: {
      ...adminCfg,
      components: {
        ...components,
        edit: updatedEdit,
      },
    },
    hooks: {
      ...collection.hooks,
      beforeChange: [publishGateHook(collection.slug), ...existingHooks],
    },
  };
};
