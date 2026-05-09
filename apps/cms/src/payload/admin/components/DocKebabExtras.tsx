'use client';

import { PopupList, useConfig, useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';

/**
 * Items mounted into the native document-controls kebab dropdown via
 * `admin.components.edit.editMenuItems`. Replaces the dedicated tab
 * strip — Versions and API URL are now one-click from the same menu
 * that already hosts Duplicate / Delete / Restore.
 *
 * The Edit tab is gone (we are already on the edit view) and Versions
 * / API tabs are hidden in the SCSS — keeping a single, predictable
 * affordance surface for secondary doc actions.
 */
export const DocKebabExtras = (): ReactElement | null => {
  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();
  const adminRoute = config?.routes?.admin ?? '/admin';

  if (!collectionSlug || id == null) return null;

  const versionsHref = `${adminRoute}/collections/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(id))}/versions`;
  const apiHref = `${adminRoute}/collections/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(id))}/api`;

  return (
    <>
      <PopupList.Button href={versionsHref}>Versions</PopupList.Button>
      <PopupList.Button href={apiHref}>API URL</PopupList.Button>
    </>
  );
};

export default DocKebabExtras;
