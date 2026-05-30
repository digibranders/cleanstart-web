'use client';

import { useAuth } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  getColumnWidths,
  persistColumnWidths,
  type ColumnWidths,
} from '../../../lib/column-widths';

type Props = {
  readonly collectionSlug: string;
};

/** Smallest a column may be dragged/keyed to. */
const MIN_WIDTH = 64;
/** Keyboard nudge step (Shift multiplies). */
const KEY_STEP = 16;
const KEY_STEP_LARGE = 48;
/** Debounce window before a width change is PATCHed to the server. */
const PERSIST_DELAY = 400;
/** Event the list-view "Reset column widths" menu item dispatches. */
const RESET_EVENT = 'cs-col-resize:reset';
const HEADING_PREFIX = 'heading-';
/** Columns that are structurally fixed and must not be resized. */
const LOCKED = new Set(['_select']);

type Handle = {
  readonly accessor: string;
  readonly label: string;
  readonly left: number;
  readonly top: number;
  readonly height: number;
};

type DragState = {
  readonly accessor: string;
  readonly startX: number;
  readonly startWidth: number;
  readonly abort: AbortController;
};

const accessorOf = (th: HTMLTableCellElement): string | null => {
  if (!th.id.startsWith(HEADING_PREFIX)) return null;
  const accessor = th.id.slice(HEADING_PREFIX.length);
  if (!accessor || LOCKED.has(accessor)) return null;
  return accessor;
};

const clampWidth = (px: number, max: number): number =>
  Math.max(MIN_WIDTH, Math.min(px, Math.max(MIN_WIDTH, max)));

/**
 * Resizable list-table columns.
 *
 * Composition: Payload's RSC `Table` slot owns the `<table>` markup — we
 * never mutate it. Instead this component (mounted inside
 * `.cs-list__table`) does two side-effect-free things:
 *
 *   1. Widths — written through a single `<style>` element we own, scoped
 *      to `.cs-list__table` and keyed by `th[id="heading-…"]`. Because the
 *      rules target by selector, they survive any Payload re-render (SPA
 *      nav, column-visibility toggles) and re-apply to the new table for
 *      free. `table-layout: fixed` (set in _tables.scss) makes the th
 *      width authoritative for the whole column.
 *   2. Handles — an absolutely-positioned React overlay of thin grips at
 *      each column's right edge. The overlay is `pointer-events: none`; only
 *      the grips capture input, so the header underneath stays fully
 *      interactive (sort, column menu).
 *
 * Widths persist per-editor to `users.preferences.columnWidths[slug]` (see
 * column-widths.ts). Everything is progressive enhancement: if this
 * component never mounts or its JS throws, the CSS default widths still
 * render a clean table.
 */
export const ColumnResizer = ({ collectionSlug }: Props): ReactElement => {
  const { user } = useAuth();
  const userId = (user as { id?: number | string } | null)?.id;
  const preferences = (user as { preferences?: unknown } | null)?.preferences;

  // Latest auth values, read imperatively from persistence callbacks so
  // they never capture a stale closure (auth can refresh mid-session).
  const prefsRef = useRef<unknown>(preferences);
  prefsRef.current = preferences;
  const userIdRef = useRef<number | string | undefined>(userId);
  userIdRef.current = userId;

  const layerRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const widthsRef = useRef<ColumnWidths>({});
  const dragRef = useRef<DragState | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  // One-shot seed guard, reset whenever the collection changes.
  const seededRef = useRef(false);
  // Mirror of `handles` state, so `measure` can short-circuit when nothing
  // changed without taking `handles` as a dependency.
  const handlesRef = useRef<readonly Handle[]>([]);

  const [handles, setHandles] = useState<readonly Handle[]>([]);

  // ── DOM lookup ────────────────────────────────────────────────────
  const getContainer = useCallback(
    (): HTMLElement | null => layerRef.current?.closest('.cs-list__table') ?? null,
    [],
  );
  const getTable = useCallback((): HTMLTableElement | null => {
    const container = getContainer();
    return container ? container.querySelector('table') : null;
  }, [getContainer]);
  // Payload's inner `.table` div is the horizontal scroll container; fall back
  // to the card if the structure ever differs.
  const getScroller = useCallback(
    (): HTMLElement | null => getTable()?.parentElement ?? getContainer(),
    [getTable, getContainer],
  );

  // ── Width application (the owned <style> element) ─────────────────
  const buildCss = useCallback((widths: ColumnWidths): string => {
    const rules: string[] = [];
    for (const [accessor, px] of Object.entries(widths)) {
      // Force an exact width under auto table-layout: width + min + max on
      // both the header and every body cell. Attribute-quoted/`~=` selectors
      // handle every accessor, including `_status` and dotted nested fields
      // like `seo.title`. Cells already clip with ellipsis, so a width below
      // the content just truncates rather than overflowing.
      const decl = `width:${px}px!important;min-width:${px}px!important;max-width:${px}px!important;`;
      rules.push(
        `.cs-list__table table th[id="${HEADING_PREFIX}${accessor}"],` +
          `.cs-list__table table td[class~="cell-${accessor}"]{${decl}}`,
      );
    }
    return rules.join('\n');
  }, []);

  const applyWidths = useCallback(
    (widths: ColumnWidths): void => {
      widthsRef.current = widths;
      if (styleRef.current) styleRef.current.textContent = buildCss(widths);
    },
    [buildCss],
  );

  // Shift the (card-pinned) handle overlay by the scroller's offset so grips
  // ride along with horizontal scroll without a per-frame re-measure. Set
  // imperatively — cheap, no React render.
  const syncTransform = useCallback((): void => {
    const layer = layerRef.current;
    if (!layer) return;
    const scroller = getScroller();
    const sl = scroller ? scroller.scrollLeft : 0;
    layer.style.transform = sl ? `translateX(${-sl}px)` : '';
  }, [getScroller]);

  // ── Handle geometry ───────────────────────────────────────────────
  const measure = useCallback((): void => {
    const container = getContainer();
    const scroller = getScroller();
    const table = getTable();
    const thead = table?.tHead;
    const headRow = thead?.rows[0];
    if (!container || !scroller || !table || !thead || !headRow) {
      if (handlesRef.current.length > 0) {
        handlesRef.current = [];
        setHandles([]);
      }
      return;
    }
    // Base coordinates on the CARD (the overlay's positioning context), but add
    // the SCROLLER's scrollLeft so positions are in unscrolled content space —
    // scroll-invariant, so scrolling only updates the overlay transform
    // (`syncTransform`), never the measured geometry. (The scroller sits inside
    // the card behind a wrapper, so its left edge differs from the card's;
    // mixing the two coordinate systems is what caused earlier misalignment.)
    const baseRect = container.getBoundingClientRect();
    const headRect = thead.getBoundingClientRect();
    const scrollLeft = scroller.scrollLeft;
    const top = Math.round(headRect.top - baseRect.top);
    const height = Math.round(headRect.height);
    const next: Handle[] = [];
    for (const th of Array.from(headRow.cells)) {
      const accessor = accessorOf(th);
      if (!accessor) continue;
      const rect = th.getBoundingClientRect();
      const left = Math.round(rect.right - baseRect.left + scrollLeft);
      next.push({
        accessor,
        label: (th.textContent ?? accessor).trim() || accessor,
        left,
        top,
        height,
      });
    }
    // Short-circuit when geometry is unchanged. The MutationObserver below
    // re-measures on any DOM change — including this component's own handle
    // re-render — so without this guard a stable layout could re-render in a
    // loop. Comparing by value breaks that cycle definitively.
    const prev = handlesRef.current;
    const unchanged =
      prev.length === next.length &&
      prev.every((h, i) => {
        const n = next[i];
        return (
          n !== undefined &&
          h.accessor === n.accessor &&
          h.left === n.left &&
          h.top === n.top &&
          h.height === n.height &&
          h.label === n.label
        );
      });
    if (unchanged) return;
    handlesRef.current = next;
    setHandles(next);
  }, [getContainer, getScroller, getTable]);

  const scheduleMeasure = useCallback((): void => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
      syncTransform();
    });
  }, [measure, syncTransform]);

  // ── Persistence (debounced, best-effort, stale-closure-free) ──────
  const schedulePersist = useCallback((): void => {
    if (userIdRef.current == null) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const id = userIdRef.current;
      if (id == null) return;
      void persistColumnWidths(id, prefsRef.current, collectionSlug, widthsRef.current);
    }, PERSIST_DELAY);
  }, [collectionSlug]);

  const commitWidth = useCallback(
    (accessor: string, px: number): void => {
      const container = getContainer();
      const max = container ? container.clientWidth : MIN_WIDTH;
      const next = { ...widthsRef.current, [accessor]: clampWidth(Math.round(px), max) };
      applyWidths(next);
      scheduleMeasure();
      schedulePersist();
    },
    [applyWidths, getContainer, scheduleMeasure, schedulePersist],
  );

  // ── Drag ──────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (accessor: string) =>
      (e: React.PointerEvent<HTMLButtonElement>): void => {
        if (e.button !== 0) return;
        const table = getTable();
        const th = table?.querySelector<HTMLTableCellElement>(
          `th[id="${HEADING_PREFIX}${accessor}"]`,
        );
        if (!th) return;
        e.preventDefault();
        const abort = new AbortController();
        dragRef.current = {
          accessor,
          startX: e.clientX,
          startWidth: th.getBoundingClientRect().width,
          abort,
        };
        document.body.classList.add('cs-col-resizing');

        const onMove = (ev: PointerEvent): void => {
          const drag = dragRef.current;
          if (!drag) return;
          commitWidth(drag.accessor, drag.startWidth + (ev.clientX - drag.startX));
        };
        const onUp = (): void => {
          dragRef.current?.abort.abort();
          dragRef.current = null;
          document.body.classList.remove('cs-col-resizing');
        };
        window.addEventListener('pointermove', onMove, { signal: abort.signal });
        window.addEventListener('pointerup', onUp, { signal: abort.signal });
        window.addEventListener('pointercancel', onUp, { signal: abort.signal });
      },
    [getTable, commitWidth],
  );

  // ── Double-click: autofit to the widest cell in the column ────────
  const onDoubleClick = useCallback(
    (accessor: string) => (): void => {
      const table = getTable();
      if (!table) return;
      const cells = table.querySelectorAll<HTMLElement>(
        `th[id="${HEADING_PREFIX}${accessor}"], td.cell-${CSS.escape(accessor)}`,
      );
      let widest = MIN_WIDTH;
      for (const cell of Array.from(cells)) {
        // scrollWidth is the content's intrinsic width (cells clip with
        // ellipsis), plus a small breathing buffer.
        widest = Math.max(widest, cell.scrollWidth + 8);
      }
      commitWidth(accessor, widest);
    },
    [getTable, commitWidth],
  );

  // ── Keyboard resize ───────────────────────────────────────────────
  const onKeyDown = useCallback(
    (accessor: string) =>
      (e: React.KeyboardEvent<HTMLButtonElement>): void => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const table = getTable();
        const th = table?.querySelector<HTMLTableCellElement>(
          `th[id="${HEADING_PREFIX}${accessor}"]`,
        );
        if (!th) return;
        e.preventDefault();
        const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
        const delta = e.key === 'ArrowRight' ? step : -step;
        commitWidth(accessor, th.getBoundingClientRect().width + delta);
      },
    [getTable, commitWidth],
  );

  // ── Seed saved widths once auth (preferences) is available ────────
  // Auth can resolve after first paint, so we wait for `preferences` and
  // seed exactly once per collection. Guarding on `seededRef` means a
  // later auth refresh never clobbers widths the editor dragged this
  // session (those live in `widthsRef` until the next full reload).
  useEffect(() => {
    if (seededRef.current || preferences == null) return;
    seededRef.current = true;
    applyWidths(getColumnWidths(preferences, collectionSlug));
    scheduleMeasure();
  }, [preferences, collectionSlug, applyWidths, scheduleMeasure]);

  // ── Lifecycle: owned <style>, observers, global listeners ─────────
  // Keyed on collectionSlug: navigating between collections tears down and
  // rebuilds cleanly. Memoised callbacks are intentionally omitted — they
  // are stable for a given collection and re-subscribing every render would
  // thrash the observers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-subscribing observers per render would thrash; callbacks are stable per collection
  useLayoutEffect(() => {
    const container = getContainer();
    if (!container) return undefined;

    seededRef.current = false;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-cs-col-widths', collectionSlug);
    container.appendChild(styleEl);
    styleRef.current = styleEl;
    applyWidths({});
    measure();

    // Update the overlay transform synchronously for zero-lag scroll tracking,
    // then schedule a measure in case geometry also changed.
    const onScroll = (): void => {
      syncTransform();
      scheduleMeasure();
    };

    // Payload's inner `.table` div owns horizontal scroll, so bind directly to
    // it — capture-phase window scroll is unreliable for nested scrollers, and
    // the handle overlay (pinned to the card) must re-measure as that div
    // scrolls. Re-bind if Payload swaps the table element on re-render.
    let boundScroller: HTMLElement | null = null;
    const bindScroller = (): void => {
      const scroller = getTable()?.parentElement ?? null;
      if (scroller === boundScroller) return;
      boundScroller?.removeEventListener('scroll', onScroll);
      scroller?.addEventListener('scroll', onScroll, { passive: true });
      boundScroller = scroller;
    };

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(container);
    const table = getTable();
    if (table) ro.observe(table);
    bindScroller();

    // Re-find + re-bind + re-measure when Payload re-renders the table.
    const mo = new MutationObserver(() => {
      const t = getTable();
      if (t) ro.observe(t);
      bindScroller();
      scheduleMeasure();
    });
    mo.observe(container, { childList: true, subtree: true });

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    container.addEventListener('scroll', onScroll, { passive: true });

    const onReset = (): void => {
      applyWidths({});
      scheduleMeasure();
      const id = userIdRef.current;
      if (id != null) {
        void persistColumnWidths(id, prefsRef.current, collectionSlug, {});
      }
    };
    document.addEventListener(RESET_EVENT, onReset);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener('resize', scheduleMeasure);
      container.removeEventListener('scroll', onScroll);
      boundScroller?.removeEventListener('scroll', onScroll);
      document.removeEventListener(RESET_EVENT, onReset);
      dragRef.current?.abort.abort();
      document.body.classList.remove('cs-col-resizing');
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      styleEl.remove();
      styleRef.current = null;
    };
  }, [collectionSlug]);

  return (
    <div ref={layerRef} className="cs-col-resize-layer" aria-hidden={handles.length === 0}>
      {handles.map((h) => (
        <button
          key={h.accessor}
          type="button"
          className="cs-col-resize-handle"
          style={{ left: h.left, top: h.top, height: h.height }}
          aria-label={`Resize ${h.label} column. Use left and right arrow keys to adjust, double-click to fit.`}
          onPointerDown={onPointerDown(h.accessor)}
          onDoubleClick={onDoubleClick(h.accessor)}
          onKeyDown={onKeyDown(h.accessor)}
        >
          <span className="cs-col-resize-handle__grip" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

export default ColumnResizer;
