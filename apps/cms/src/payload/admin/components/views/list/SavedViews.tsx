'use client';

import { Dialog, DialogBody, DialogFooter, DialogHeader, DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import { useAuth, useListQuery } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getSavedViews,
  newSavedView,
  persistSavedViews,
  type SavedView,
} from '../../../lib/saved-views';

type Props = {
  readonly collectionSlug: string;
};

/**
 * Wave 3 part 2 — saved-views chip.
 *
 * Reads the current editor's `users.preferences.savedViews[<slug>]`
 * via useAuth(), renders a small "Views" trigger that opens a
 * DropdownMenu listing saved views + a "Save current view…" item.
 *
 * Selecting a view rewrites the URL via useListQuery's
 * refineListData so the table immediately reflects the saved
 * search / where / sort / limit. Saving captures the current query
 * and PATCHes /api/users/{id}.
 */
export const SavedViews = (props: Props): ReactElement | null => {
  const { collectionSlug } = props;
  const { user } = useAuth();
  const { query, refineListData } = useListQuery();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  // Local copy of the saved-views slot so we can render optimistically
  // after a save without waiting for the auth provider to refresh.
  const initial = user
    ? getSavedViews((user as unknown as { preferences?: unknown }).preferences, collectionSlug)
    : {};
  const [state, setState] = useState(initial);

  useEffect(() => {
    if (!user) return;
    setState(
      getSavedViews((user as unknown as { preferences?: unknown }).preferences, collectionSlug),
    );
  }, [user, collectionSlug]);

  const views = state.views ?? [];

  const items: DropdownMenuItem[] = useMemo(() => {
    const arr: DropdownMenuItem[] = [];
    if (views.length === 0) {
      arr.push({ kind: 'label', id: 'empty', label: 'No saved views yet' });
    } else {
      arr.push({ kind: 'label', id: 'saved', label: 'Saved views' });
      for (const v of views) {
        arr.push({
          kind: 'item',
          id: `view-${v.id}`,
          label: v.name,
          onSelect: () => {
            void refineListData({
              ...(v.where !== undefined ? { where: v.where } : {}),
              ...(v.sort !== undefined ? { sort: v.sort } : {}),
              ...(v.limit !== undefined ? { limit: v.limit } : {}),
              page: 1,
            });
          },
        });
      }
    }
    arr.push({ kind: 'separator', id: 'sep' });
    arr.push({
      kind: 'item',
      id: 'save',
      label: 'Save current view…',
      onSelect: () => setSaveOpen(true),
    });
    return arr;
  }, [views, refineListData]);

  if (!user) return null;

  const onSave = async (): Promise<void> => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const next: SavedView = newSavedView({
        name: name.trim(),
        ...(query.where ? { where: query.where } : {}),
        ...(query.sort ? { sort: String(query.sort) } : {}),
        ...(query.limit != null
          ? { limit: typeof query.limit === 'number' ? query.limit : Number(query.limit) }
          : {}),
      });
      const updated = { ...state, views: [...views, next] };
      setState(updated);
      await persistSavedViews(
        (user as unknown as { id: number | string }).id,
        (user as unknown as { preferences?: unknown }).preferences,
        collectionSlug,
        updated,
      );
      setName('');
      setSaveOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="cs-btn cs-btn--subtle cs-saved-views__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
      >
        Views {views.length > 0 ? <span className="cs-saved-views__count">({views.length})</span> : null}
      </button>
      <DropdownMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        items={items}
        ariaLabel="Saved views"
      />
      <Dialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        ariaLabel="Save view"
        size="sm"
      >
        <DialogHeader title="Save current view" onClose={() => setSaveOpen(false)} />
        <DialogBody>
          <label className="cs-saved-views__field">
            <span>Name</span>
            <input
              type="text"
              className="cs-text-field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </label>
        </DialogBody>
        <DialogFooter>
          <button
            type="button"
            className="cs-btn cs-btn--subtle"
            onClick={() => setSaveOpen(false)}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cs-btn cs-btn--primary"
            onClick={() => void onSave()}
            disabled={busy || !name.trim()}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </DialogFooter>
      </Dialog>
    </>
  );
};
