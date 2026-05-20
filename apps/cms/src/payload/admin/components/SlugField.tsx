'use client';

import { Tooltip } from '@cleanstart/ui';
import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  getSlugStatus,
  resetSlugStatus,
  setSlugStatus,
  subscribeSlugStatus,
  type SlugStatus,
} from '../lib/slug-status-store';

type SlugFieldProps = {
  /**
   * Sibling field whose value is mirrored when the slug is empty / has
   * never been manually edited. Defaults to `title`.
   */
  source?: string;
  /**
   * Field-config flag passed through Payload's clientProps so we know
   * whether to surface the required asterisk + native validation.
   */
  required?: boolean;
  /** Inline help copy mirrored from the field's `admin.description`. */
  description?: string;
  /** Field path. Always `slug` in current usage but kept generic. */
  path?: string;
  /** Field label (Payload passes the resolved string). */
  label?: string;
};

/**
 * URL-safe slugifier — mirror of the server-side `slugify` helper. We
 * duplicate the small pure function on the client so we don't drag the
 * server `slugify.ts` (which imports nothing of consequence) into the
 * admin bundle through a server-only path. The two must stay in sync;
 * the unit suite at `slugify.test.ts` covers the canonical inputs.
 */
const slugify = (input: string | null | undefined): string => {
  if (!input) return '';
  return input
    .toString()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Slug-safe live normaliser for onChange. Converts invalid characters
 * to hyphens and collapses runs, but does NOT strip leading/trailing
 * hyphens — that would eat the `-` the editor just typed before they
 * can finish the next word segment. Full trim happens on blur.
 */
const slugifyLive = (input: string): string => {
  if (!input) return '';
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-');
};

interface EditContext {
  readonly collection: string;
  readonly id: string | null;
}

/**
 * Parse `/admin/collections/<slug>/<id>` from the current pathname so
 * the collision check knows which collection to query and which row
 * (if any) to exclude. Returns null on list / dashboard / create
 * routes — the caller treats null as "skip the lookup".
 */
const matchEditContext = (): EditContext | null => {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(
    /^\/admin\/collections\/([^/]+)\/([^/?#]+)/,
  );
  if (!m) return null;
  const [, slug, id] = m;
  if (!slug || !id) return null;
  return { collection: slug, id: id === 'create' ? null : id };
};

/**
 * Custom `slug` field. Same data shape as Payload's stock text input,
 * but with a Webflow-style auto-fill: while the slug has never been
 * manually edited, every keystroke in the source field (default
 * `title`) re-slugs into here in real time. The first manual edit that
 * diverges from the auto-slug pins it — sync stops, and a
 * "Reset to title" link lets the editor opt back in.
 *
 * Manual mode is entered exclusively via direct typing in the slug
 * input (`handleChange`). It is never inferred reactively from value
 * divergence — that approach causes a race condition where the
 * "detect divergence" effect fires with the pre-update `slugValue`
 * and locks manual mode after the very first title keystroke.
 */
export const SlugField = (props: SlugFieldProps): ReactElement => {
  const { source = 'title', required = true, label } = props;
  const path = props.path ?? 'slug';
  const inputId = useId();

  const { value: docTitleValue } = useField<string>({ path: source });
  const { value: slugValue, setValue: setSlug } = useField<string>({ path });
  const [status, setStatusLocal] = useState<SlugStatus>(getSlugStatus);

  // Mirror the module-level store into local state so React re-renders.
  // `SlugField` is the sole writer; the guard component is a reader.
  useEffect(() => subscribeSlugStatus(setStatusLocal), []);

  // Clear any stale state left over from a previous document in the same
  // SPA session, then again on unmount so list/dashboard views start clean.
  useEffect(() => {
    resetSlugStatus();
    return () => resetSlugStatus();
  }, []);

  /**
   * manualMode = true  → editor has typed a custom slug; auto-sync off.
   * manualMode = false → slug mirrors the title; auto-sync on.
   *
   * Initial value: false for new docs (empty slug), true for existing
   * docs whose stored slug no longer matches the auto-slug of the
   * current title (i.e. was previously customised).
   */
  const [manualMode, setManualMode] = useState<boolean>(() => {
    const stored = (slugValue ?? '').trim();
    if (stored === '') return false;
    return stored !== slugify(docTitleValue ?? '');
  });

  /**
   * Auto-sync: whenever the title changes and we're not in manual mode,
   * push the slugified title straight into the slug field. No
   * intermediate ref needed — we never infer mode from value divergence.
   */
  useEffect(() => {
    if (manualMode) return;
    setSlug(slugify(docTitleValue ?? ''));
  }, [docTitleValue, manualMode, setSlug]);

  /**
   * User typed directly in the slug input. Live-normalise the value and
   * enter manual mode only when the result diverges from the auto-slug
   * (so typing the exact same value as the title doesn't lock the field).
   */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const cleaned = slugifyLive(event.target.value);
      setSlug(cleaned);
      if (slugify(cleaned) !== slugify(docTitleValue ?? '')) {
        setManualMode(true);
      }
    },
    [docTitleValue, setSlug],
  );

  const handleBlur = useCallback(() => {
    const trimmed = slugify(slugValue ?? '');
    if (trimmed !== (slugValue ?? '')) {
      setSlug(trimmed);
    }
  }, [slugValue, setSlug]);

  /**
   * Reset: clear manual mode so the next title keystroke re-engages
   * auto-sync. The slug is immediately set to the current auto-slug so
   * the field doesn't flash a stale value while waiting for the effect.
   */
  const handleResetToTitle = useCallback(() => {
    setSlug(slugify(docTitleValue ?? ''));
    setManualMode(false);
  }, [docTitleValue, setSlug]);

  const docTitleEmpty = useMemo(() => (docTitleValue ?? '').trim() === '', [docTitleValue]);

  // Debounced collision lookup. Asks the collection's REST endpoint
  // whether any other doc already owns this slug; surfaces a soft
  // warning so the editor sees the conflict before they hit Save and
  // get a 409 from the unique constraint.
  useEffect(() => {
    const trimmed = (slugValue ?? '').trim();
    if (trimmed.length === 0) {
      setSlugStatus({ kind: 'empty' });
      return undefined;
    }
    const ctx = matchEditContext();
    if (!ctx) {
      // No edit context (e.g. list view) — treat as available so the
      // gate doesn't disable controls on screens it shouldn't reach.
      setSlugStatus({ kind: 'available' });
      return undefined;
    }
    setSlugStatus({ kind: 'checking' });
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const url = new URL(`/api/${ctx.collection}`, window.location.origin);
        url.searchParams.set('where[slug][equals]', trimmed);
        url.searchParams.set('limit', '2');
        url.searchParams.set('depth', '0');
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
          // Fail open: the server-side `unique` constraint is still the
          // ultimate safety net. We don't want a transient 5xx during the
          // lookup to permanently disable saving.
          if (!cancelled) setSlugStatus({ kind: 'available' });
          return;
        }
        const json = (await res.json()) as { docs?: { id?: string | number }[] };
        const conflicts = (json.docs ?? []).filter(
          (d) => d.id != null && String(d.id) !== ctx.id,
        );
        if (cancelled) return;
        if (conflicts.length === 0) {
          setSlugStatus({ kind: 'available' });
        } else {
          setSlugStatus({
            kind: 'collision',
            detail: String(conflicts[0]?.id ?? ''),
          });
        }
      } catch {
        if (!cancelled) setSlugStatus({ kind: 'available' });
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slugValue]);

  return (
    <div className="cs-slug field-type text">
      <div className="cs-slug__label">
        <span className="cs-slug__label-text">
          <label htmlFor={inputId}>
            {label ?? 'Slug'}
            {required && (
              <span aria-hidden="true" className="cs-slug__required">
                *
              </span>
            )}
          </label>
          {!docTitleEmpty && (
            <>
              <label className="cs-slug__auto-toggle">
                <input
                  type="checkbox"
                  checked={!manualMode}
                  onChange={(e) => {
                    if (e.target.checked) handleResetToTitle();
                    else setManualMode(true);
                  }}
                  className="cs-slug__auto-check"
                />
                <span>Auto</span>
              </label>
              <Tooltip
                placement="bottom-start"
                content={
                  <>
                    <b>On</b> — slug syncs live from the title as you type.<br />
                    <b>Off</b> — slug is frozen; title changes won't affect it.
                  </>
                }
              >
                <button type="button" className="cs-slug__auto-info" aria-label="How auto-sync works">
                  i
                </button>
              </Tooltip>
            </>
          )}
        </span>
        {status.kind === 'available' && (
          <output
            aria-live="polite"
            className="cs-slug__chip"
            data-tone="ok"
            title="This slug is unique in the collection."
          >
            Available
          </output>
        )}
      </div>
      <input
        id={inputId}
        type="text"
        value={slugValue ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={docTitleEmpty ? 'Set the title first' : ''}
        spellCheck={false}
        autoComplete="off"
        required={required}
        className="cs-slug__input"
      />
      {status.kind === 'collision' ? (
        <output aria-live="polite" className="cs-slug__collision">
          <span aria-hidden="true">!</span>
          This slug is already in use. Save will fail — pick a different one.
        </output>
      ) : null}
      {required && status.kind === 'empty' && !docTitleEmpty ? (
        <output aria-live="polite" className="cs-slug__collision">
          <span aria-hidden="true">!</span>
          Slug is required. Save Draft and Publish stay disabled until it's set.
        </output>
      ) : null}
    </div>
  );
};
