import type { CollectionConfig, CustomComponent, LivePreviewConfig } from 'payload';

import { isPreviewableCollection, previewPathForDoc } from './preview/paths';

const COPY_BUTTON_PATH = '@/payload/admin/components/CopyPreviewLink.tsx#CopyPreviewLink';

type EditConfig = NonNullable<
  NonNullable<NonNullable<CollectionConfig['admin']>['components']>['edit']
>;

const BREAKPOINTS: LivePreviewConfig['breakpoints'] = [
  { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
  { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
  { label: 'Laptop', name: 'laptop', width: 1280, height: 800 },
  { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
];

const getEnv = (): { webBaseUrl: string } => ({
  webBaseUrl: (process.env.WEB_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, ''),
});

/**
 * For every preview-able collection (per `PREVIEWABLE_COLLECTIONS`):
 *
 * 1. Adds `admin.livePreview` so Payload renders the iframe tab.
 * 2. Adds `admin.preview` so the toolbar Preview button gets a URL.
 * 3. Appends `CopyPreviewLink` to `beforeDocumentControls` so the
 *    "Copy preview link" button sits alongside Publish.
 *
 * Skips collections not in the previewable allowlist (e.g. system
 * tables like searchLog, auditLog, integrations).
 */
export const wirePreviewControls = (collection: CollectionConfig): CollectionConfig => {
  if (!isPreviewableCollection(collection.slug)) return collection;

  const adminCfg = collection.admin ?? {};
  const components = adminCfg.components ?? {};
  const editCfg = (components.edit ?? {}) as EditConfig;
  const existingBeforeDocControls =
    (editCfg as { beforeDocumentControls?: CustomComponent[] }).beforeDocumentControls ?? [];

  // The Live Preview iframe (and its "Open in new tab" button) both load
  // this URL. Point at the same CMS-side redirect endpoint as the toolbar
  // Preview button so editors get a consistent `/preview/<coll>/<slug>?token=...`
  // URL across all three entry points. The endpoint mints a 24h token using
  // the editor's admin session, then 302s to the web app.
  //
  // A fresh token is minted on every iframe mount — that's an extra audit
  // row per edit session, deliberately accepted to keep the URL shape
  // consistent. The auto-row label ("auto · Preview button") lets editors
  // filter the audit view to manual shares only.
  const livePreviewResolver: LivePreviewConfig = {
    url: ({ data }) => {
      const id = (data as { id?: string | number | null } | null | undefined)?.id;
      if (id == null) return getEnv().webBaseUrl;
      return `/api/preview/redirect?collection=${encodeURIComponent(collection.slug)}&docId=${encodeURIComponent(String(id))}`;
    },
    breakpoints: BREAKPOINTS,
  };

  const updatedEdit: EditConfig = {
    ...editCfg,
    beforeDocumentControls: [
      ...existingBeforeDocControls,
      { path: COPY_BUTTON_PATH } as CustomComponent,
    ],
  };

  return {
    ...collection,
    admin: {
      ...adminCfg,
      livePreview: livePreviewResolver,
      // The toolbar "Preview" button (opens in a new tab). Points at the
      // CMS-side redirect endpoint — it mints a 24h token using the
      // editor's session, then 302s to `${WEB}/preview/<collection>/<slug>?token=...`.
      // Relative URL works because the admin and the REST API share an origin.
      preview: (data) => {
        const id = (data as { id?: string | number | null } | null | undefined)?.id;
        if (id == null) return null;
        return `/api/preview/redirect?collection=${encodeURIComponent(collection.slug)}&docId=${encodeURIComponent(String(id))}`;
      },
      components: {
        ...components,
        edit: updatedEdit,
      },
    },
  };
};

// Re-export so callers can compute a public path without importing from /lib/preview.
export { previewPathForDoc };
