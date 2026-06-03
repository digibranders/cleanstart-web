'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const STORAGE_KEY = 'cs-doc-sidebar';
const DEFAULT_WIDTH = 440;
const MIN_WIDTH = 300;
const MAX_WIDTH = 640;
const COLLAPSED_WIDTH = 40;
const WRAP_SELECTOR = '.document-fields__sidebar-wrap';
const KEY_STEP = 16;
const KEY_STEP_LARGE = 48;
const PERSIST_DELAY = 250;
/** Payload's stock two-column edit row (main | gap | sidebar). */
const ROW_SELECTOR = '.document-fields--has-sidebar';
const WRAPPER_CLASS = 'cs-doc-sidebar-ctl';

type Stored = {
  readonly width: number;
  readonly collapsed: boolean;
};

const clampWidth = (n: number): number =>
  Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(n)));

const readStored = (): Stored => {
  const fallback: Stored = { width: DEFAULT_WIDTH, collapsed: false };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      width:
        typeof parsed.width === 'number' && Number.isFinite(parsed.width)
          ? clampWidth(parsed.width)
          : DEFAULT_WIDTH,
      collapsed: parsed.collapsed === true,
    };
  } catch {
    return fallback;
  }
};

const writeStored = (state: Stored): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage disabled / quota — the width is already applied this session.
  }
};

/**
 * Side-panel toggle icon (the convention used by Claude / VS Code / Linear): a
 * rounded window with a divider marking off the right rail. The rail region is
 * shaded when the rail is open and hollow when it's collapsed, so the glyph
 * doubles as a state indicator.
 */
const PanelIcon = ({ open }: { open: boolean }): ReactElement => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect
      x="2.25"
      y="3.25"
      width="11.5"
      height="9.5"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <line
      x1="9.5"
      y1="3.5"
      x2="9.5"
      y2="12.5"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    {open ? (
      <path
        d="M9.5 3.95 H11.75 A1.55 1.55 0 0 1 13.3 5.5 V10.5 A1.55 1.55 0 0 1 11.75 12.05 H9.5 Z"
        fill="currentColor"
        opacity="0.32"
      />
    ) : null}
  </svg>
);

/**
 * Resizable + collapsible document SEO/meta rail.
 *
 * The edit view is Payload's STOCK chrome (the custom edit view is a parked
 * no-op — see `wire-custom-edit-view.ts`), so this is a DOM enhancer rather
 * than a layout component. Mounted globally via `afterNavLinks` (which renders
 * on every admin page, the editor included). On an edit view with a sidebar it:
 *
 *   1. sets `--cs-doc-sidebar-w` + `data-cs-sidebar-collapsed` on the
 *      `.document-fields--has-sidebar` row (the layout in `_doc-sidebar.scss`
 *      reacts), and
 *   2. portals a click-through overlay — a drag grip on the main↔rail boundary
 *      plus a collapse toggle — into a wrapper appended to that row, so the
 *      grip tracks the rail via the SAME width variable (no measurement).
 *
 * It never mutates Payload's field DOM, no-ops on list views / docs without a
 * sidebar, and re-attaches across SPA navigation (the row is recreated per
 * document). localStorage-persisted, best-effort. Progressive enhancement: the
 * CSS default (360px rail) renders cleanly even if this never mounts.
 */
export const DocSidebarResizer = (): ReactElement | null => {
  const stateRef = useRef<Stored>(readStored());
  const rowRef = useRef<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startWidth: number;
    abort: AbortController;
  } | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(stateRef.current.collapsed);

  const apply = useCallback((): void => {
    const row = rowRef.current;
    if (!row) return;
    const { width, collapsed } = stateRef.current;
    // Only write when a value actually changed. apply() runs on every DOM
    // mutation (via the observer), and the editor mutates constantly
    // (autosave, field state); re-setting `flex-basis` each time restarts the
    // 140ms CSS transition so it never reaches its target. Guarding the writes
    // lets the transition complete.
    const widthVar = `${width}px`;
    if (row.style.getPropertyValue('--cs-doc-sidebar-w') !== widthVar) {
      // The variable drives the handle/toggle position (CSS).
      row.style.setProperty('--cs-doc-sidebar-w', widthVar);
    }
    const wrap = row.querySelector<HTMLElement>(WRAP_SELECTOR);
    if (wrap) {
      // The rail size is set inline: a `var()` flex-basis doesn't re-resolve
      // reliably, and `important` beats Payload's vendor width on the rail.
      const basis = `${collapsed ? COLLAPSED_WIDTH : width}px`;
      if (wrap.style.flexBasis !== basis) {
        wrap.style.setProperty('flex-basis', basis, 'important');
        wrap.style.setProperty('width', basis, 'important');
      }
    }
    const wantAttr = collapsed ? '1' : null;
    if (row.getAttribute('data-cs-sidebar-collapsed') !== wantAttr) {
      if (collapsed) row.setAttribute('data-cs-sidebar-collapsed', '1');
      else row.removeAttribute('data-cs-sidebar-collapsed');
    }
  }, []);

  const persist = useCallback((): void => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => writeStored(stateRef.current), PERSIST_DELAY);
  }, []);

  const setWidth = useCallback(
    (width: number): void => {
      stateRef.current = { ...stateRef.current, width: clampWidth(width) };
      apply();
      persist();
    },
    [apply, persist],
  );

  // ── Locate the row, ensure our overlay wrapper lives inside it ────
  const attach = useCallback((): void => {
    const row = document.querySelector<HTMLElement>(ROW_SELECTOR);
    if (!row) {
      if (rowRef.current || wrapperRef.current) {
        rowRef.current = null;
        wrapperRef.current = null;
        setPortalTarget(null);
      }
      return;
    }
    // Fast path: same row, wrapper still attached — nothing to do (this runs on
    // every DOM mutation via the observer, so it must stay cheap).
    if (rowRef.current === row && wrapperRef.current && row.contains(wrapperRef.current)) {
      return;
    }
    rowRef.current = row;
    let wrapper = wrapperRef.current;
    if (!wrapper || !row.contains(wrapper)) {
      wrapper = document.createElement('div');
      wrapper.className = WRAPPER_CLASS;
      row.appendChild(wrapper);
      wrapperRef.current = wrapper;
    }
    apply();
    setPortalTarget(wrapper);
  }, [apply]);

  // ── Drag ──
  const onHandleDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>): void => {
      if (e.button !== 0) return;
      e.preventDefault();
      const abort = new AbortController();
      dragRef.current = { startX: e.clientX, startWidth: stateRef.current.width, abort };
      document.body.classList.add('cs-col-resizing');

      const onMove = (ev: PointerEvent): void => {
        const drag = dragRef.current;
        if (!drag) return;
        // Rail is on the right, so dragging the grip left widens it.
        setWidth(drag.startWidth + (drag.startX - ev.clientX));
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
    [setWidth],
  );

  const onHandleDouble = useCallback((): void => {
    setWidth(DEFAULT_WIDTH);
  }, [setWidth]);

  const onHandleKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
      // ArrowLeft widens the right-hand rail; ArrowRight narrows it.
      setWidth(stateRef.current.width + (e.key === 'ArrowLeft' ? step : -step));
    },
    [setWidth],
  );

  const toggleCollapsed = useCallback((): void => {
    const next = !stateRef.current.collapsed;
    stateRef.current = { ...stateRef.current, collapsed: next };
    setCollapsed(next);
    apply();
    persist();
  }, [apply, persist]);

  // ── Lifecycle ──
  useEffect(() => {
    attach();
    // The edit row is created/replaced per document on SPA nav; re-attach when
    // the DOM changes. `attach` early-returns when the row + wrapper are stable,
    // so this stays cheap on field-edit churn.
    const mo = new MutationObserver(() => attach());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      dragRef.current?.abort.abort();
      document.body.classList.remove('cs-col-resizing');
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      wrapperRef.current?.remove();
      wrapperRef.current = null;
    };
  }, [attach]);

  if (!portalTarget) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="cs-doc-sidebar-ctl__handle"
        aria-label="Resize sidebar. Drag, use arrow keys, or double-click to reset."
        onPointerDown={onHandleDown}
        onDoubleClick={onHandleDouble}
        onKeyDown={onHandleKey}
      />
      <button
        type="button"
        className="cs-doc-sidebar-ctl__toggle"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        onClick={toggleCollapsed}
      >
        <PanelIcon open={!collapsed} />
      </button>
    </>,
    portalTarget,
  );
};

export default DocSidebarResizer;
