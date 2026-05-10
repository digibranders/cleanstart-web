'use client';

import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** `aria-labelledby` target. Prefer this over `ariaLabel`. */
  readonly labelledBy?: string;
  /** Fallback when no labelled element is available. */
  readonly ariaLabel?: string;
  readonly size?: DialogSize;
  /**
   * If true, clicking the backdrop dismisses. Default true. Disable for
   * destructive confirms where editors should commit a choice.
   */
  readonly dismissOnBackdrop?: boolean;
  readonly className?: string;
};

/**
 * Headless modal primitive. Built on the native <dialog> element so we
 * inherit the top-layer rendering, focus trap, and ESC handling for free.
 * The wrapping <div className="cs-dialog__panel"> is the visible surface;
 * <dialog> itself is invisible chrome.
 *
 * Use directly for centred modals (ConfirmDialog, ShortcutHelpDialog) and
 * compose into Drawer for side-panel modals.
 */
export const Dialog = (props: Props): ReactElement => {
  const {
    open,
    onClose,
    children,
    labelledBy,
    ariaLabel,
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

  const sizeClass = `cs-dialog--${size}`;
  const composed = ['cs-dialog__panel', sizeClass, className].filter(Boolean).join(' ');

  return (
    <dialog
      ref={dialogRef}
      className="cs-dialog"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : ariaLabel}
      onClose={onClose}
      onCancel={(e) => {
        // Native cancel fires on ESC. Let our onClose run, but prevent
        // the implicit close so React state stays the source of truth.
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
  readonly description?: string;
};

export const DialogHeader = (props: HeaderProps): ReactElement => {
  const { title, id, onClose, description } = props;
  return (
    <header className="cs-dialog__header">
      <div className="cs-dialog__heading">
        <h2 id={id} className="cs-dialog__title">
          {title}
        </h2>
        {description ? <p className="cs-dialog__description">{description}</p> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          className="cs-dialog__close"
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
    </header>
  );
};

export const DialogBody = (props: { readonly children: ReactNode }): ReactElement => (
  <div className="cs-dialog__body">{props.children}</div>
);

export const DialogFooter = (props: { readonly children: ReactNode }): ReactElement => (
  <footer className="cs-dialog__footer">{props.children}</footer>
);
