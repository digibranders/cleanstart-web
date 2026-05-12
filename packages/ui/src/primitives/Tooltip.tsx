'use client';

import type { ReactElement, ReactNode } from 'react';
import { Children, cloneElement, isValidElement, useId, useRef, useState } from 'react';

import { type Placement, useAnchoredPosition } from '../hooks/useAnchoredPosition';

type Props = {
  readonly content: ReactNode;
  readonly children: ReactElement;
  readonly placement?: Placement;
  readonly delay?: number;
  readonly disabled?: boolean;
};

/**
 * Hover/focus tooltip. Wraps a single trigger element, clones it to
 * inject `aria-describedby` + ref, and shows a small floating bubble
 * via `useAnchoredPosition`. Keyboard-accessible (focus shows it,
 * blur hides it). Replaces the stock Payload `.tooltip` skin.
 */
export const Tooltip = (props: Props): ReactElement => {
  const { content, children, placement = 'top-start', delay = 250, disabled = false } = props;
  const id = useId();
  const anchorRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  const pos = useAnchoredPosition({
    anchorRef,
    floatingRef,
    open,
    placement,
    offset: 8,
  });

  const show = (): void => {
    if (disabled) return;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };

  const hide = (): void => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    setOpen(false);
  };

  const child = Children.only(children);
  if (!isValidElement(child)) return child;

  const triggerProps = (child as ReactElement<Record<string, unknown>>).props;
  const cloned = cloneElement(child as ReactElement<Record<string, unknown>>, {
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
    },
    'aria-describedby': open ? id : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      (triggerProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (triggerProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      (triggerProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      (triggerProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
      hide();
    },
  });

  const style: React.CSSProperties = pos
    ? { position: 'fixed', top: `${pos.top}px`, left: `${pos.left}px` }
    : { position: 'fixed', top: '-9999px', left: '-9999px' };

  return (
    <>
      {cloned}
      {open ? (
        <div
          ref={floatingRef}
          id={id}
          role="tooltip"
          className="cs-tooltip"
          style={style}
        >
          {content}
        </div>
      ) : null}
    </>
  );
};
