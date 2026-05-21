'use client';

import type { KeyboardEvent, ReactElement, ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useDismiss } from '../hooks/useDismiss';
import { type Placement, useAnchoredPosition } from '../hooks/useAnchoredPosition';

export type DropdownMenuItem =
  | {
      readonly kind: 'item';
      readonly id: string;
      readonly label: ReactNode;
      readonly icon?: ReactNode;
      readonly shortcut?: string;
      readonly disabled?: boolean;
      readonly tone?: 'neutral' | 'danger';
      readonly onSelect: () => void;
    }
  | { readonly kind: 'separator'; readonly id: string }
  | { readonly kind: 'label'; readonly id: string; readonly label: ReactNode };

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly anchorRef: RefObject<HTMLElement | null>;
  readonly items: ReadonlyArray<DropdownMenuItem>;
  readonly placement?: Placement;
  readonly ariaLabel?: string;
};

/**
 * Anchored single-column menu. Supports separators + section labels,
 * full keyboard nav (Up/Down, Home/End, Enter), Esc to close, click
 * outside dismiss. Used by publish-split-button, kebab menus, bulk
 * action bar, list-view filter "more" surfaces.
 */
export const DropdownMenu = (props: Props): ReactElement | null => {
  const { open, onClose, anchorRef, items, placement = 'bottom-start', ariaLabel } = props;
  const floatingRef = useRef<HTMLDivElement | null>(null);
  // Portal to <body> so `position: fixed` is computed against the
  // viewport's initial containing block, not whatever ancestor
  // happens to establish one (e.g. an element with `backdrop-filter`,
  // `transform`, `filter`, `contain: paint`, or `will-change` —
  // any of which silently break fixed positioning per CSS spec).
  // SSR-safe: the portal node is only resolved after mount.
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalNode(typeof document !== 'undefined' ? document.body : null);
  }, []);

  const pos = useAnchoredPosition({
    anchorRef,
    floatingRef,
    open,
    placement,
    offset: 6,
  });

  useDismiss({
    open,
    onDismiss: onClose,
    ignore: [floatingRef, anchorRef],
  });

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIndexes = items
    .map((it, i) => (it.kind === 'item' && !it.disabled ? i : -1))
    .filter((i) => i >= 0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when the menu opens; enabledIndexes is derived from a frozen `items` prop
  useEffect(() => {
    if (!open) return;
    const first = enabledIndexes[0];
    if (first !== undefined) {
      window.requestAnimationFrame(() => itemRefs.current[first]?.focus());
    }
  }, [open]);

  if (!open || !portalNode) return null;

  const focusAt = (idx: number): void => {
    itemRefs.current[idx]?.focus();
  };

  const findCurrent = (): number =>
    items.findIndex((_, i) => itemRefs.current[i] === document.activeElement);

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (enabledIndexes.length === 0) return;
    const cur = findCurrent();
    const curPos = enabledIndexes.indexOf(cur);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = enabledIndexes[(curPos + 1 + enabledIndexes.length) % enabledIndexes.length];
      if (next !== undefined) focusAt(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = enabledIndexes[(curPos - 1 + enabledIndexes.length) % enabledIndexes.length];
      if (prev !== undefined) focusAt(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = enabledIndexes[0];
      if (first !== undefined) focusAt(first);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = enabledIndexes[enabledIndexes.length - 1];
      if (last !== undefined) focusAt(last);
    }
  };

  const style: React.CSSProperties = pos
    ? { position: 'fixed', top: `${pos.top}px`, left: `${pos.left}px` }
    : { position: 'fixed', top: '-9999px', left: '-9999px' };

  return createPortal(
    <div
      ref={floatingRef}
      role="menu"
      aria-label={ariaLabel}
      className="cs-menu"
      style={style}
      onKeyDown={onKey}
    >
      {items.map((item, i) => {
        if (item.kind === 'separator') {
          return <hr key={item.id} className="cs-menu__separator" />;
        }
        if (item.kind === 'label') {
          return (
            <div key={item.id} className="cs-menu__label">
              {item.label}
            </div>
          );
        }
        return (
          <button
            key={item.id}
            ref={(node) => {
              itemRefs.current[i] = node;
            }}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={[
              'cs-menu__item',
              item.tone === 'danger' ? 'cs-menu__item--danger' : '',
              item.disabled ? 'is-disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect();
              onClose();
            }}
          >
            {item.icon ? <span className="cs-menu__icon">{item.icon}</span> : null}
            <span className="cs-menu__label-text">{item.label}</span>
            {item.shortcut ? <kbd className="cs-menu__shortcut">{item.shortcut}</kbd> : null}
          </button>
        );
      })}
    </div>,
    portalNode,
  );
};
