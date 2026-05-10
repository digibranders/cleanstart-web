'use client';

import { DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

type Props = {
  readonly save?: ReactNode;
  readonly saveDraft?: ReactNode;
  readonly publish?: ReactNode;
  readonly unpublish?: ReactNode;
};

/**
 * Custom publish split-button. Renders Payload's primary action slot
 * (Publish for drafts-enabled collections, Save otherwise) inline,
 * with a chevron that opens our DropdownMenu containing the remaining
 * stock action slots (Save Draft, Unpublish).
 *
 * We render Payload's nodes verbatim so the underlying click handlers
 * (autosave-aware, version-aware) stay intact — we own the layout, not
 * the action.
 */
export const PublishMenu = (props: Props): ReactElement | null => {
  const { save, saveDraft, publish, unpublish } = props;

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const primary = publish ?? save ?? null;
  if (!primary) return null;

  const items = useMemo<DropdownMenuItem[]>(() => {
    const arr: DropdownMenuItem[] = [];
    if (saveDraft !== undefined && saveDraft !== null) {
      arr.push({
        kind: 'item',
        id: 'save-draft',
        label: <span className="cs-edit__menu-slot">{saveDraft}</span>,
        onSelect: () => {},
      });
    }
    if (publish !== undefined && publish !== null && save !== undefined && save !== null) {
      arr.push({
        kind: 'item',
        id: 'save',
        label: <span className="cs-edit__menu-slot">{save}</span>,
        onSelect: () => {},
      });
    }
    if (unpublish !== undefined && unpublish !== null) {
      if (arr.length > 0) arr.push({ kind: 'separator', id: 'sep' });
      arr.push({
        kind: 'item',
        id: 'unpublish',
        tone: 'danger',
        label: <span className="cs-edit__menu-slot">{unpublish}</span>,
        onSelect: () => {},
      });
    }
    return arr;
  }, [save, saveDraft, publish, unpublish]);

  return (
    <div className="cs-publish-menu">
      <span className="cs-publish-menu__primary">{primary}</span>
      {items.length > 0 ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            className="cs-publish-menu__chevron"
            aria-label="More publish actions"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M3 4.5l3 3 3-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <DropdownMenu
            open={open}
            onClose={() => setOpen(false)}
            anchorRef={triggerRef}
            items={items}
            placement="bottom-end"
            ariaLabel="Publish actions"
          />
        </>
      ) : null}
    </div>
  );
};
