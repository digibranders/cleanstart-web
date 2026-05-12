'use client';

import { DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import { SchedulePublishDialog } from '../../SchedulePublishDialog';

type Props = {
  readonly save?: ReactNode;
  readonly saveDraft?: ReactNode;
  readonly publish?: ReactNode;
  readonly unpublish?: ReactNode;
};

const CalendarIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.25" />
    <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <circle cx="4.5" cy="8.5" r=".75" fill="currentColor" />
    <circle cx="7" cy="8.5" r=".75" fill="currentColor" />
    <circle cx="9.5" cy="8.5" r=".75" fill="currentColor" />
  </svg>
);

/**
 * Custom publish split-button. Renders Payload's primary action slot
 * (Publish for drafts-enabled collections, Save otherwise) inline,
 * with a chevron that opens our DropdownMenu containing:
 *   - Save Draft
 *   - Schedule publish… (drafts collections only; disabled for unsaved docs)
 *   - --- separator ---
 *   - Unpublish (danger)
 *
 * We render Payload's nodes verbatim so the underlying click handlers
 * (autosave-aware, version-aware) stay intact — we own the layout, not
 * the action. "Schedule publish…" is the only item we own directly;
 * it opens SchedulePublishDialog in controlled mode.
 */
export const PublishMenu = (props: Props): ReactElement | null => {
  const { save, saveDraft, publish, unpublish } = props;

  const { id } = useDocumentInfo();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const primary = publish ?? save ?? null;
  if (!primary) return null;

  // Schedule publish is only meaningful on drafts-enabled collections,
  // which always supply a saveDraft slot.
  const hasDrafts = saveDraft !== undefined && saveDraft !== null;
  const unsaved = id == null;

  const items = useMemo<DropdownMenuItem[]>(() => {
    const arr: DropdownMenuItem[] = [];

    if (hasDrafts) {
      arr.push({
        kind: 'item',
        id: 'save-draft',
        label: <span className="cs-edit__menu-slot">{saveDraft}</span>,
        onSelect: () => {},
      });

      arr.push({
        kind: 'item',
        id: 'schedule',
        icon: <CalendarIcon />,
        label: unsaved ? 'Save a draft first to schedule' : 'Schedule publish…',
        ...(unsaved ? {} : { shortcut: '⌘⇧S' }),
        disabled: unsaved,
        onSelect: () => setScheduleOpen(true),
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
  }, [save, saveDraft, publish, unpublish, hasDrafts, unsaved]);

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
      {hasDrafts && !unsaved && (
        <SchedulePublishDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      )}
    </div>
  );
};
