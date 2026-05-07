'use client';

import type { ReactElement } from 'react';
import { useEffect } from 'react';

/**
 * Reformat verbose list-view cell content client-side. Payload's
 * auto-injected fields (`filesize`, `updatedAt`, `createdAt`) render
 * as raw bytes / `Mon Day(th) Year, hh:mm AM` — neither is glanceable
 * in a dense table. This component finds those cells and rewrites
 * their text in place. Idempotent — safe to re-run on every DOM
 * mutation.
 *
 * Renders nothing visible.
 */
export const ListCellEnhancer = (): ReactElement | null => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const ONE_MIN = 60_000;
    const ONE_HOUR = 60 * ONE_MIN;
    const ONE_DAY = 24 * ONE_HOUR;
    const SEVEN_DAYS = 7 * ONE_DAY;

    const formatBytes = (raw: string): string | null => {
      const trimmed = raw.trim();
      if (!/^\d+$/.test(trimmed)) return null;
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1024) return null;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
      if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
      return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
    };

    const formatDate = (raw: string): string | null => {
      // Match "May 7th 2026, 11:29 AM" or any Date-parseable ISO/string
      const trimmed = raw.trim();
      // Strip ordinal suffix (1st / 2nd / 3rd / 4th) — Date.parse rejects those.
      const cleaned = trimmed.replace(/(\d+)(st|nd|rd|th)/, '$1');
      const t = new Date(cleaned).getTime();
      if (!Number.isFinite(t)) return null;
      const diff = Date.now() - t;
      if (diff < 0) {
        return new Date(t).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      if (diff < ONE_MIN) return 'just now';
      if (diff < ONE_HOUR) return `${Math.floor(diff / ONE_MIN)}m ago`;
      if (diff < ONE_DAY) return `${Math.floor(diff / ONE_HOUR)}h ago`;
      if (diff < SEVEN_DAYS) {
        const d = Math.floor(diff / ONE_DAY);
        return d === 1 ? 'yesterday' : `${d}d ago`;
      }
      return new Date(t).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const ATTR = 'data-cs-enhanced';

    const enhance = (): void => {
      // Filesize cells.
      for (const cell of document.querySelectorAll<HTMLElement>('.cell-filesize')) {
        if (cell.getAttribute(ATTR) === '1') continue;
        const next = formatBytes(cell.textContent ?? '');
        if (next != null) {
          cell.setAttribute('title', `${cell.textContent ?? ''} bytes`);
          cell.textContent = next;
        }
        cell.setAttribute(ATTR, '1');
      }
      // Date cells (updatedAt / createdAt / publishedAt).
      const dateCells = document.querySelectorAll<HTMLElement>(
        '.cell-updatedAt, .cell-createdAt, .cell-publishedAt',
      );
      for (const cell of dateCells) {
        if (cell.getAttribute(ATTR) === '1') continue;
        const original = (cell.textContent ?? '').trim();
        const next = formatDate(original);
        if (next) {
          cell.setAttribute('title', original);
          cell.textContent = next;
        }
        cell.setAttribute(ATTR, '1');
      }
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};

export default ListCellEnhancer;
