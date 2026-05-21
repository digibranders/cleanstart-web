'use client';

import { ConfirmDialog } from '@cleanstart/ui';
import {
  PopupList,
  useConfig,
  useDocumentInfo,
  useForm,
  useFormModified,
} from '@payloadcms/ui';
import { hasAutosaveEnabled } from 'payload/shared';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { showToast } from './ToastBus';

/**
 * Items mounted into the native document-controls kebab dropdown via
 * `admin.components.edit.editMenuItems`. Replaces the dedicated tab
 * strip — Versions and API URL are now one-click from the same menu
 * that already hosts Duplicate / Delete / Restore.
 *
 * Adds a "Discard changes" item that reverts the form to the most
 * recent saved revision in the DB. Hidden for unsaved docs and for
 * autosave-enabled collections (where every keystroke is the saved
 * state). Disabled — with a tooltip — when the form is not modified.
 * Destructive operations always pass through a ConfirmDialog.
 */
export const DocKebabExtras = (): ReactElement | null => {
  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const { config, getEntityConfig } = useConfig();
  const { reset } = useForm();
  const modified = useFormModified();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const adminRoute = config?.routes?.admin ?? '/admin';
  const apiRoute = config?.routes?.api ?? '/api';

  const entityConfig = useMemo(() => {
    if (collectionSlug) return getEntityConfig({ collectionSlug });
    if (globalSlug) return getEntityConfig({ globalSlug });
    return undefined;
  }, [collectionSlug, globalSlug, getEntityConfig]);

  const autosave = entityConfig ? hasAutosaveEnabled(entityConfig) : false;

  const handleDiscard = useCallback(async (): Promise<void> => {
    if (!collectionSlug || id == null) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${apiRoute}/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(id))}?draft=true&depth=0`,
        { credentials: 'include' },
      );
      if (!res.ok) {
        showToast({ message: 'Could not load the saved version.', type: 'error' });
        return;
      }
      const data = (await res.json()) as Record<string, unknown>;
      await reset(data);
      showToast({ message: 'Reverted to last saved version.', type: 'success' });
      setConfirmOpen(false);
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to discard changes.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  }, [apiRoute, collectionSlug, id, reset]);

  if (!collectionSlug || id == null) return null;

  const versionsHref = `${adminRoute}/collections/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(id))}/versions`;
  const apiHref = `${adminRoute}/collections/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(id))}/api`;

  return (
    <>
      {!autosave ? (
        <PopupList.Button
          disabled={!modified || busy}
          onClick={() => setConfirmOpen(true)}
        >
          Discard changes
        </PopupList.Button>
      ) : null}
      <PopupList.Button href={versionsHref}>Versions</PopupList.Button>
      <PopupList.Button href={apiHref}>API URL</PopupList.Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => (busy ? undefined : setConfirmOpen(false))}
        onConfirm={() => void handleDiscard()}
        title="Discard your unsaved edits?"
        description="The form will reset to the last saved version. Anything you have changed since the last save will be lost — this cannot be undone."
        confirmLabel={busy ? 'Discarding…' : 'Discard changes'}
        cancelLabel="Keep editing"
        tone="danger"
        busy={busy}
      />
    </>
  );
};

export default DocKebabExtras;
