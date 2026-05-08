'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

type MediaSize = {
  url?: string | null;
};

export type MediaBrowseDoc = {
  id: string;
  filename?: string | null;
  mimeType?: string | null;
  url?: string | null;
  alt?: string | null;
  sizes?: Record<string, MediaSize | undefined> | null;
};

const pickThumbUrl = (doc: MediaBrowseDoc): string | null => {
  const fromSizes = doc.sizes?.thumb?.url ?? doc.sizes?.card?.url ?? null;
  return fromSizes ?? doc.url ?? null;
};

type Props = {
  /** Controlled open / close. */
  readonly open: boolean;
  /** Fired on Esc, click-outside, X-button, or after a successful pick. */
  readonly onClose: () => void;
  /** Fired when the editor picks a tile. */
  readonly onSelect: (doc: MediaBrowseDoc) => void;
  /**
   * Optional accessible label for the dialog. Default: "Browse media".
   */
  readonly ariaLabel?: string;
};

/**
 * Thumbnail-grid media browser, lifted out of MediaField.tsx so any
 * field can mount the same picker UX. Uses the existing
 * `.cs-media-field__browse-*` SCSS so visual fidelity matches the
 * Hero-image Browse pixel-for-pixel.
 *
 * Behaviour:
 *   - Debounced search against `/api/media?where[filename][like]=...`
 *   - Native `<dialog>` (`showModal`) for proper focus-trap + Esc
 *   - Click-outside dismisses
 *   - Arrow / Home / End keyboard nav across tiles
 *   - Auto-focuses the search input on open
 *
 * Why a custom <dialog> instead of Payload's `useListDrawer`:
 * editors prefer the thumbnail grid for image-pick tasks (visual
 * recognition > filename scan), and we already had a polished
 * implementation inside MediaField. Shared component, single source.
 */
export const MediaBrowseDialog = (props: Props): ReactElement | null => {
  const { open, onClose, onSelect, ariaLabel = 'Browse media' } = props;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaBrowseDoc[]>([]);
  const [loading, setLoading] = useState(false);

  // Open / close the native <dialog>.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal?.();
      // Focus the search box once layout settles.
      window.requestAnimationFrame(() => searchRef.current?.focus());
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      const url = new URL('/api/media', window.location.origin);
      url.searchParams.set('limit', '24');
      url.searchParams.set('sort', '-createdAt');
      url.searchParams.set('depth', '0');
      if (query.trim().length > 0) {
        url.searchParams.set('where[filename][like]', query.trim());
      }
      fetch(url.toString(), { credentials: 'include' })
        .then((r) => r.json())
        .then((data: { docs?: MediaBrowseDoc[] }) => {
          if (cancelled) return;
          setResults(Array.isArray(data?.docs) ? data.docs : []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  // Click-outside the inner container dismisses (the dialog backdrop
  // is the dialog element itself; clicks inside the container don't
  // escape, so this fires only on backdrop clicks).
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e: MouseEvent): void => {
      const c = containerRef.current;
      if (!c) return;
      if (!c.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open, onClose]);

  // Arrow-key / Home / End navigation across tiles.
  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const grid = e.currentTarget;
    const tiles = Array.from(
      grid.querySelectorAll<HTMLButtonElement>('button.cs-media-field__browse-tile'),
    );
    if (tiles.length === 0) return;
    const cols = Math.max(1, Math.floor(grid.clientWidth / (140 + 8)));
    const active = document.activeElement;
    let idx = tiles.findIndex((t) => t === active);
    if (idx === -1) idx = 0;
    let nextIdx = idx;
    if (e.key === 'ArrowRight') nextIdx = Math.min(tiles.length - 1, idx + 1);
    else if (e.key === 'ArrowLeft') nextIdx = Math.max(0, idx - 1);
    else if (e.key === 'ArrowDown') nextIdx = Math.min(tiles.length - 1, idx + cols);
    else if (e.key === 'ArrowUp') nextIdx = Math.max(0, idx - cols);
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = tiles.length - 1;
    else return;
    e.preventDefault();
    tiles[nextIdx]?.focus();
  };

  return (
    <dialog
      ref={dialogRef}
      className="cs-media-field__browse-dialog"
      aria-label={ariaLabel}
      onClose={onClose}
    >
      <div className="cs-media-field__browse" ref={containerRef}>
        <div className="cs-media-field__browse-head">
          <input
            ref={searchRef}
            type="search"
            className="cs-media-field__browse-search"
            placeholder="Search by filename…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="cs-media-field__icon-btn"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="cs-media-field__browse-grid" onKeyDown={onGridKeyDown}>
          {loading && results.length === 0 ? (
            <div className="cs-media-field__browse-empty">Loading…</div>
          ) : results.length === 0 ? (
            <div className="cs-media-field__browse-empty">No matches.</div>
          ) : (
            results.map((m) => {
              const t = pickThumbUrl(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  className="cs-media-field__browse-tile"
                  onClick={() => {
                    onSelect(m);
                    onClose();
                  }}
                  title={m.filename ?? m.id}
                >
                  {t ? (
                    <img src={t} alt={m.alt ?? ''} loading="lazy" />
                  ) : (
                    <span className="cs-media-field__browse-tile-fallback">
                      {m.mimeType ?? '—'}
                    </span>
                  )}
                  <span className="cs-media-field__browse-tile-name">{m.filename}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </dialog>
  );
};

export default MediaBrowseDialog;
