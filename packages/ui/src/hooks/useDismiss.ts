'use client';

import { useEffect } from 'react';

type Options = {
  readonly open: boolean;
  readonly onDismiss: () => void;
  /**
   * Refs whose subtree should NOT count as outside. Clicks inside any of
   * these are ignored. Pass the popover content + the anchor that toggles
   * it, so clicking the anchor doesn't fire dismiss + reopen on the same
   * gesture.
   */
  readonly ignore?: ReadonlyArray<React.RefObject<HTMLElement | null>>;
  readonly closeOnEscape?: boolean;
  readonly closeOnPointerDownOutside?: boolean;
};

/**
 * Click-outside + ESC dismissal for non-modal floating UI. Native
 * `<dialog>.showModal()` already handles both for modal surfaces, so
 * don't reach for this in Dialog / Drawer.
 */
export const useDismiss = (opts: Options): void => {
  const {
    open,
    onDismiss,
    ignore = [],
    closeOnEscape = true,
    closeOnPointerDownOutside = true,
  } = opts;

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e: KeyboardEvent): void => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
      }
    };

    const onPointerDown = (e: MouseEvent): void => {
      if (!closeOnPointerDownOutside) return;
      const target = e.target as Node | null;
      if (!target) return;
      for (const ref of ignore) {
        const node = ref.current;
        if (node?.contains(target)) return;
      }
      onDismiss();
    };

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onPointerDown, true);
    };
  }, [open, onDismiss, ignore, closeOnEscape, closeOnPointerDownOutside]);
};
