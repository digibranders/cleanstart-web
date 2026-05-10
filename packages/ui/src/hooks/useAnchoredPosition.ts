'use client';

import { useCallback, useEffect, useState } from 'react';

export type Placement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'right-start'
  | 'left-start';

type Args = {
  readonly anchor: HTMLElement | null;
  readonly floating: HTMLElement | null;
  readonly open: boolean;
  readonly placement?: Placement;
  readonly offset?: number;
  /** Padding from viewport edges when clamping. */
  readonly viewportPadding?: number;
};

type Position = { top: number; left: number };

const compute = (
  anchorRect: DOMRect,
  floatRect: DOMRect,
  placement: Placement,
  offset: number,
): Position => {
  switch (placement) {
    case 'bottom-end':
      return {
        top: anchorRect.bottom + offset,
        left: anchorRect.right - floatRect.width,
      };
    case 'top-start':
      return {
        top: anchorRect.top - floatRect.height - offset,
        left: anchorRect.left,
      };
    case 'top-end':
      return {
        top: anchorRect.top - floatRect.height - offset,
        left: anchorRect.right - floatRect.width,
      };
    case 'right-start':
      return {
        top: anchorRect.top,
        left: anchorRect.right + offset,
      };
    case 'left-start':
      return {
        top: anchorRect.top,
        left: anchorRect.left - floatRect.width - offset,
      };
    default:
      return {
        top: anchorRect.bottom + offset,
        left: anchorRect.left,
      };
  }
};

const clamp = (pos: Position, floatRect: DOMRect, padding: number): Position => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    top: Math.max(padding, Math.min(pos.top, vh - floatRect.height - padding)),
    left: Math.max(padding, Math.min(pos.left, vw - floatRect.width - padding)),
  };
};

/**
 * Tiny anchor-positioning helper. Computes a `position: fixed` top/left
 * for a floating element relative to an anchor, clamped to the viewport.
 * Recomputes on scroll, resize, and any animation frame while open.
 */
export const useAnchoredPosition = (args: Args): Position | null => {
  const {
    anchor,
    floating,
    open,
    placement = 'bottom-start',
    offset = 6,
    viewportPadding = 8,
  } = args;
  const [pos, setPos] = useState<Position | null>(null);

  const update = useCallback((): void => {
    if (!anchor || !floating) return;
    const aRect = anchor.getBoundingClientRect();
    const fRect = floating.getBoundingClientRect();
    const raw = compute(aRect, fRect, placement, offset);
    setPos(clamp(raw, fRect, viewportPadding));
  }, [anchor, floating, placement, offset, viewportPadding]);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    update();
    let frame = 0;
    const tick = (): void => {
      update();
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    window.addEventListener('resize', update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
    };
  }, [open, update]);

  return pos;
};
