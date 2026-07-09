'use client';

import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

type DrawerSide = 'right' | 'left';
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly labelledBy?: string;
  readonly ariaLabel?: string;
  readonly side?: DrawerSide;
  readonly size?: DrawerSize;
  readonly dismissOnBackdrop?: boolean;
  readonly className?: string;
};

/**
 * Side-panel modal. Built on native <dialog> for the same reasons as
 * Dialog (top layer, focus trap, ESC). Replaces Payload's
 * `useListDrawer` / `useDocumentDrawer` host surfaces — pickers compose
 * this with their own content.
 */
export const Drawer = (props: Props): ReactElement => {
  const {
    open,
    onClose,
    children,
    labelledBy,
    ariaLabel,
    side = 'right',
    size = 'md',
    dismissOnBackdrop = true,
    className,
  } = props;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal?.();
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !dismissOnBackdrop) return undefined;
    const onMouseDown = (e: MouseEvent): void => {
      const dlg = dialogRef.current;
      if (!dlg) return;
      // A native <dialog> reports the dialog element *itself* as the event
      // target when the click lands on its ::backdrop (the dimmed area
      // outside the panel). Every click inside the panel — or inside a
      // menu/popover portaled into the dialog's top layer, e.g. the export
      // drawer's date-range DropdownMenu — has a descendant as its target,
      // so it must not dismiss. A `panelRef.contains(target)` check would
      // instead treat that portaled dropdown (a sibling of the panel, but
      // still inside the dialog) as an outside click and wrongly close the
      // drawer the moment the user picks a preset.
      if (e.target === dlg) onClose();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open, dismissOnBackdrop, onClose]);

  const composed = [
    'cs-drawer__panel',
    `cs-drawer--${side}`,
    `cs-drawer--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <dialog
      ref={dialogRef}
      className="cs-drawer"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : ariaLabel}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div ref={panelRef} className={composed}>
        {children}
      </div>
    </dialog>
  );
};

type HeaderProps = {
  readonly title: string;
  readonly id?: string;
  readonly onClose?: () => void;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
};

export const DrawerHeader = (props: HeaderProps): ReactElement => {
  const { title, id, onClose, subtitle, actions } = props;
  return (
    <header className="cs-drawer__header">
      <div className="cs-drawer__heading">
        <h2 id={id} className="cs-drawer__title">
          {title}
        </h2>
        {subtitle ? <p className="cs-drawer__subtitle">{subtitle}</p> : null}
      </div>
      <div className="cs-drawer__header-actions">
        {actions}
        {onClose ? (
          <button
            type="button"
            className="cs-drawer__close"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  );
};

export const DrawerBody = (props: { readonly children: ReactNode }): ReactElement => (
  <div className="cs-drawer__body">{props.children}</div>
);

export const DrawerFooter = (props: { readonly children: ReactNode }): ReactElement => (
  <footer className="cs-drawer__footer">{props.children}</footer>
);
