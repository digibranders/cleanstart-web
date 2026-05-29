'use client';

import { ConfirmDialog } from '@cleanstart/ui';
import { useConfig, useSelection } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { showToast } from '../../ToastBus';

type Props = {
  readonly collectionSlug: string;
  readonly hasDeletePermission?: boolean;
  readonly disableBulkDelete?: boolean;
  readonly disableBulkEdit?: boolean;
};

type DeleteResult = {
  readonly errors?: ReadonlyArray<{ message?: string }>;
};

const callBulkDelete = async (
  apiBase: string,
  collectionSlug: string,
  ids: ReadonlyArray<number | string>,
): Promise<{ ok: boolean; errors: string[] }> => {
  const url = new URL(`${apiBase}/${collectionSlug}`, window.location.origin);
  url.searchParams.set('where[id][in]', ids.join(','));
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return { ok: false, errors: [err instanceof Error ? err.message : 'Network error'] };
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === 'string') msg = body.message;
    } catch {
      // ignore parse errors — the status code is the signal
    }
    return { ok: false, errors: [msg] };
  }
  let data: DeleteResult = {};
  try {
    data = (await res.json()) as DeleteResult;
  } catch {
    // if we can't parse the body but status was ok, treat as success
  }
  const errors = (data.errors ?? [])
    .map((e) => e.message ?? 'Unknown error')
    .filter((m) => m.length > 0);
  return { ok: errors.length === 0, errors };
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
      const result = await callBulkDelete(apiBase, collectionSlug, ids);
      if (!result.ok || result.errors.length > 0) {
        const msg =
          result.errors.length > 0
            ? result.errors.join(' · ')
            : 'Delete failed. Please try again.';
        showToast({ message: msg, type: 'error' });
        return;
      }
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
