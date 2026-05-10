'use client';

import type { KeyboardEvent, ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useDismiss } from '../hooks/useDismiss';
import type { DropdownMenuItem } from './DropdownMenu';

type Props = {
  readonly items: ReadonlyArray<DropdownMenuItem>;
  /**
   * Anchor — a DOM node or null. Tie this to your trigger area's ref.
   * The menu listens for `contextmenu` events on it.
   */
  readonly anchor: HTMLElement | null;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
};

/**
 * Right-click / long-press menu. Consumes the `contextmenu` event on
 * `anchor`, positions a floating menu at the pointer, and closes on
 * outside click / Esc. Used by Lexical table cells, list-view rows,
 * media gallery items.
 */
export const ContextMenu = (props: Props): ReactElement | null => {
  const { items, anchor, ariaLabel, disabled = false } = props;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!anchor || disabled) return undefined;
    const onCtx = (e: MouseEvent): void => {
      e.preventDefault();
      const x = e.clientX;
      const y = e.clientY;
      setPos({ top: y, left: x });
      setOpen(true);
    };
    anchor.addEventListener('contextmenu', onCtx);
    return () => anchor.removeEventListener('contextmenu', onCtx);
  }, [anchor, disabled]);

  useDismiss({
    open,
    onDismiss: () => setOpen(false),
    ignore: [floatingRef],
  });

  useEffect(() => {
    if (!open) return;
    const enabled = items
      .map((it, i) => (it.kind === 'item' && !it.disabled ? i : -1))
      .filter((i) => i >= 0);
    const first = enabled[0];
    if (first !== undefined) {
      window.requestAnimationFrame(() => itemRefs.current[first]?.focus());
    }
  }, [open, items]);

  if (!open || !pos) return null;

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const enabled = items
      .map((it, i) => (it.kind === 'item' && !it.disabled ? i : -1))
      .filter((i) => i >= 0);
    if (enabled.length === 0) return;
    const cur = items.findIndex((_, i) => itemRefs.current[i] === document.activeElement);
    const pos2 = enabled.indexOf(cur);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const n = enabled[(pos2 + 1 + enabled.length) % enabled.length];
      if (n !== undefined) itemRefs.current[n]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const n = enabled[(pos2 - 1 + enabled.length) % enabled.length];
      if (n !== undefined) itemRefs.current[n]?.focus();
    }
  };

  return (
    <div
      ref={floatingRef}
      role="menu"
      aria-label={ariaLabel}
      className="cs-menu cs-menu--context"
      style={{ position: 'fixed', top: `${pos.top}px`, left: `${pos.left}px` }}
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
              setOpen(false);
            }}
          >
            {item.icon ? <span className="cs-menu__icon">{item.icon}</span> : null}
            <span className="cs-menu__label-text">{item.label}</span>
            {item.shortcut ? <kbd className="cs-menu__shortcut">{item.shortcut}</kbd> : null}
          </button>
        );
      })}
    </div>
  );
};
