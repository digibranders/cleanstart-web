'use client';

import { useEffect, useState, type ReactElement } from 'react';

const ONE_MIN = 60_000;

const formatRelative = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  if (diff < 30_000) return 'just now';
  if (diff < ONE_MIN) return 'a few seconds ago';
  if (diff < 60 * ONE_MIN) {
    const m = Math.floor(diff / ONE_MIN);
    return `${m} min${m === 1 ? '' : 's'} ago`;
  }
  if (diff < 24 * 60 * ONE_MIN) {
    const h = Math.floor(diff / (60 * ONE_MIN));
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  const d = Math.floor(diff / (24 * 60 * ONE_MIN));
  return `${d} day${d === 1 ? '' : 's'} ago`;
};

type EditPath = { collection: string; id: string };

const matchEditPath = (pathname: string): EditPath | null => {
  // /admin/collections/<slug>/<id>  (also covers /<id>?draft=… etc.)
  const m = pathname.match(/^\/admin\/collections\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  const [, slug, id] = m;
  if (!slug || !id || id === 'create' || id === 'trash') return null;
  return { collection: slug, id };
};

/**
 * Floating "Saved X ago" chip mounted globally via
 * `admin.components.actions`. Renders nothing on routes that aren't a
 * document edit view; on edit views it polls the doc's `updatedAt`
 * every 30s and refreshes the relative-time label every minute.
 *
 * The chip is position: fixed at the bottom-right of the viewport so
 * it never overlaps form chrome or sticky headers. It's a passive
 * read — no dirty-state tracking yet — but answers the most common
 * editor question: "did my last save land?".
 */
export const SavedStateIndicator = (): ReactElement | null => {
  const [editPath, setEditPath] = useState<EditPath | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [saving, setSaving] = useState(false);

  // Listen for transient "saving" pulses dispatched by the SaveShortcut
  // and any other CMS code that wants the indicator to flash. The pulse
  // auto-clears after 1.2s — once the next poll lands updatedAt the
  // chip flips back to "Saved Xs ago".
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onSavingPulse = (): void => {
      setSaving(true);
      window.setTimeout(() => setSaving(false), 1200);
    };
    window.addEventListener('cs-cms:saving', onSavingPulse);
    return () => window.removeEventListener('cs-cms:saving', onSavingPulse);
  }, []);

  // Detect edit view from pathname; re-detect on history navigation
  // (popstate fires for back/forward) and on a custom route-change
  // signal we dispatch from any link click that lands on an edit view.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const detect = (): void => {
      setEditPath(matchEditPath(window.location.pathname));
    };
    detect();
    window.addEventListener('popstate', detect);
    // Re-check on a short interval — Next.js client-side navigation
    // doesn't always fire popstate, and a 500ms tick is cheap.
    const i = window.setInterval(detect, 500);
    return () => {
      window.removeEventListener('popstate', detect);
      window.clearInterval(i);
    };
  }, []);

  // Fetch updatedAt for the current doc; poll every 30s while on the
  // edit view so a save by the same editor (or a cross-tab edit by
  // another user) refreshes the chip.
  useEffect(() => {
    if (!editPath) {
      setUpdatedAt(null);
      return undefined;
    }
    let cancelled = false;
    const fetchTime = async (): Promise<void> => {
      try {
        const url = `/api/${editPath.collection}/${editPath.id}?depth=0&draft=true`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return;
        const json = (await res.json()) as { updatedAt?: string };
        if (!cancelled && typeof json?.updatedAt === 'string') {
          setUpdatedAt(json.updatedAt);
        }
      } catch {
        // Network errors are silent — the chip just won't update.
      }
    };
    void fetchTime();
    const interval = window.setInterval(fetchTime, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [editPath]);

  // Re-render every minute so the relative-time label stays fresh
  // without re-fetching the doc.
  useEffect(() => {
    const i = window.setInterval(() => setTick((t) => t + 1), ONE_MIN);
    return () => window.clearInterval(i);
  }, []);

  if (!editPath || (!updatedAt && !saving)) return null;

  if (saving) {
    return (
      <output className="cs-saved-indicator cs-saved-indicator--saving" aria-live="polite">
        <span className="cs-saved-indicator__dot cs-saved-indicator__dot--saving" aria-hidden="true" />
        <span className="cs-saved-indicator__text">Saving…</span>
      </output>
    );
  }

  return (
    <output
      className="cs-saved-indicator"
      aria-live="polite"
      title={updatedAt ? new Date(updatedAt).toLocaleString() : ''}
    >
      <span className="cs-saved-indicator__dot" aria-hidden="true" />
      <span className="cs-saved-indicator__text">
        Saved {updatedAt ? formatRelative(updatedAt) : ''}
      </span>
    </output>
  );
};

export default SavedStateIndicator;
