'use client';

import { ConfirmDialog } from '@cleanstart/ui';
import { useConfig, useSelection } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

type Props = {
  readonly collectionSlug: string;
  readonly hasDeletePermission?: boolean;
  readonly disableBulkDelete?: boolean;
  readonly disableBulkEdit?: boolean;
};

const callBulkDelete = async (
  apiBase: string,
  collectionSlug: string,
  ids: ReadonlyArray<number | string>,
): Promise<void> => {
  const url = new URL(`${apiBase}/${collectionSlug}`, window.location.origin);
  url.searchParams.set('where[id][in]', ids.join(','));
  await fetch(url.toString(), {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
  });
};

/**
 * Sticky bulk-action bar. Visible when at least one row is selected.
 * Counts come from Payload's `useSelection` so the same selection state
 * powers our chrome and any inline cells.
 *
 * "Edit many" wires through to Payload's existing edit-many drawer in
 * Wave 6 — until then we deep-link to the route.
 */
export const BulkActionBar = (props: Props): ReactElement | null => {
  const { collectionSlug, hasDeletePermission, disableBulkDelete, disableBulkEdit } = props;
  const { selected, count, totalDocs, toggleAll } = useSelection();
  const { config } = useConfig();
  const apiBase = `${config.serverURL ?? ''}${config.routes?.api ?? '/api'}`;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (count <= 0) return null;

  const ids = Array.from(selected.entries())
    .filter(([, on]) => on)
    .map(([id]) => id);

  const onDeleteConfirm = async (): Promise<void> => {
    setBusy(true);
    try {
      await callBulkDelete(apiBase, collectionSlug, ids);
      toggleAll(false);
      window.location.reload();
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <section className="cs-bulk-bar" aria-label="Bulk actions">
        <div className="cs-bulk-bar__count">
          <strong>{count}</strong>
          <span>&nbsp;of {totalDocs} selected</span>
        </div>
        <div className="cs-bulk-bar__actions">
          <button
            type="button"
            className="cs-btn cs-btn--subtle"
            onClick={() => toggleAll(false)}
          >
            Clear
          </button>
          {!disableBulkEdit ? (
            <button
              type="button"
              className="cs-btn cs-btn--subtle"
              onClick={() => {
                const url = new URL(
                  `/admin/collections/${collectionSlug}`,
                  window.location.origin,
                );
                for (const id of ids) url.searchParams.append('selected', String(id));
                window.location.href = `${url.toString()}#edit-many`;
              }}
            >
              Edit
            </button>
          ) : null}
          {!disableBulkDelete && hasDeletePermission ? (
            <button
              type="button"
              className="cs-btn cs-btn--danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          ) : null}
        </div>
      </section>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDeleteConfirm}
        title={`Delete ${count} ${count === 1 ? 'item' : 'items'}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
      />
    </>
  );
};
