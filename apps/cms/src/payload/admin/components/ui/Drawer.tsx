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
      const panel = panelRef.current;
      if (!panel) return;
      if (!panel.contains(e.target as Node)) onClose();
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
