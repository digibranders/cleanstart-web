'use client';

import type { ReactElement, ReactNode, RefObject } from 'react';
import { useEffect, useRef } from 'react';

import { useDismiss } from '../hooks/useDismiss';
import { type Placement, useAnchoredPosition } from '../hooks/useAnchoredPosition';

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly anchorRef: RefObject<HTMLElement | null>;
  readonly children: ReactNode;
  readonly placement?: Placement;
  readonly offset?: number;
  readonly ariaLabel?: string;
  readonly labelledBy?: string;
  /** Restore focus to the anchor on close. Default true. */
  readonly restoreFocus?: boolean;
  readonly className?: string;
  /** Role for the floating element. Default `'dialog'`. */
  readonly role?: 'dialog' | 'menu' | 'listbox';
  /** Match the floating element's width to the anchor. */
  readonly matchAnchorWidth?: boolean;
};

/**
 * Anchored, non-modal floating surface. ESC + outside-pointerdown
 * dismiss, click-on-anchor doesn't double-toggle. For modal flows use
 * Dialog or Drawer instead.
 */
export const Popover = (props: Props): ReactElement | null => {
  const {
    open,
    onClose,
    anchorRef,
    children,
    placement = 'bottom-start',
    offset = 6,
    ariaLabel,
    labelledBy,
    restoreFocus = true,
    className,
    role = 'dialog',
    matchAnchorWidth = false,
  } = props;

  const floatingRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const pos = useAnchoredPosition({
    anchorRef,
    floatingRef,
    open,
    placement,
    offset,
  });

  useDismiss({
    open,
    onDismiss: onClose,
    ignore: [floatingRef, anchorRef],
  });

  useEffect(() => {
    if (!open) return undefined;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    return () => {
      if (restoreFocus) {
        lastFocusedRef.current?.focus?.();
      }
    };
  }, [open, restoreFocus]);

  if (!open) return null;

  const anchorWidth =
    matchAnchorWidth && anchorRef.current
      ? anchorRef.current.getBoundingClientRect().width
      : null;

  const style: React.CSSProperties = pos
    ? { position: 'fixed', top: `${pos.top}px`, left: `${pos.left}px` }
    : { position: 'fixed', top: '-9999px', left: '-9999px' };
  if (anchorWidth != null) {
    style.width = `${anchorWidth}px`;
  }

  const composed = ['cs-popover', className].filter(Boolean).join(' ');

  return (
    <div
      ref={floatingRef}
      className={composed}
      role={role}
      aria-modal={role === 'dialog' ? false : undefined}
      aria-label={labelledBy ? undefined : ariaLabel}
      aria-labelledby={labelledBy}
      style={style}
    >
      {children}
    </div>
  );
};
