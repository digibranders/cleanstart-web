'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

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
 * `title`) re-slugs into here. The first manual edit pins it — sync
 * stops, and a "Reset to title" link lets the editor opt back in.
 *
 * This unblocks the Save Draft → "slug is invalid" error: Payload's
 * client-side `required: true` validator now sees a populated value at
 * submit time, so the request actually leaves the browser and the
 * server-side `beforeValidate` slug hook never has to fire.
 */
type CollisionState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'collision'; conflictId: string };

export const SlugField = (props: SlugFieldProps): ReactElement => {
  const { source = 'title', required = false, label } = props;
  const path = props.path ?? 'slug';
  const inputId = useId();

  const { value: docTitleValue } = useField<string>({ path: source });
  const { value: slugValue, setValue: setSlug } = useField<string>({ path });
  const [collision, setCollision] = useState<CollisionState>({ kind: 'idle' });

  const lastSyncedRef = useRef<string>('');
  const [manualMode, setManualMode] = useState<boolean>(() => {
    const stored = (slugValue ?? '').trim();
    if (stored === '') return false;
    // If the stored slug doesn't match a slugified version of the
    // current title, the editor previously customised it. Respect that.
    return stored !== slugify(docTitleValue ?? '');
  });

  // Auto-sync: while in auto mode, mirror the slugified title.
  useEffect(() => {
    if (manualMode) return;
    const next = slugify(docTitleValue ?? '');
    if (slugValue === next) {
      lastSyncedRef.current = next;
      return;
    }
    setSlug(next);
    lastSyncedRef.current = next;
  }, [docTitleValue, manualMode, slugValue, setSlug]);

  // Detect manual edits (typed value diverges from both the last
  // synced value AND the slugified title).
  useEffect(() => {
    if (manualMode) return;
    const live = slugValue ?? '';
    const docSlug = slugify(docTitleValue ?? '');
    if (live !== lastSyncedRef.current && live !== docSlug) {
      setManualMode(true);
    }
  }, [slugValue, docTitleValue, manualMode]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      // Slugify on the fly so the editor can't accidentally type
      // capitals / spaces that would later break the URL.
      const cleaned = slugify(next);
      setSlug(cleaned);
      if (cleaned !== slugify(docTitleValue ?? '')) {
        setManualMode(true);
      }
    },
    [docTitleValue, setSlug],
  );

  const handleResetToTitle = useCallback(() => {
    const next = slugify(docTitleValue ?? '');
    setSlug(next);
    lastSyncedRef.current = next;
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
      setCollision({ kind: 'idle' });
      return undefined;
    }
    const ctx = matchEditContext();
    if (!ctx) {
      setCollision({ kind: 'idle' });
      return undefined;
    }
    setCollision({ kind: 'checking' });
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const url = new URL(`/api/${ctx.collection}`, window.location.origin);
        url.searchParams.set('where[slug][equals]', trimmed);
        url.searchParams.set('limit', '2');
        url.searchParams.set('depth', '0');
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) setCollision({ kind: 'idle' });
          return;
        }
        const json = (await res.json()) as { docs?: { id?: string | number }[] };
        const conflicts = (json.docs ?? []).filter(
          (d) => d.id != null && String(d.id) !== ctx.id,
        );
        if (cancelled) return;
        if (conflicts.length === 0) {
          setCollision({ kind: 'available' });
        } else {
          setCollision({
            kind: 'collision',
            conflictId: String(conflicts[0]?.id ?? ''),
          });
        }
      } catch {
        if (!cancelled) setCollision({ kind: 'idle' });
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slugValue]);

  return (
    <div className="cs-slug field-type text">
      <label htmlFor={inputId} className="cs-slug__label">
        <span className="cs-slug__label-text">
          {label ?? 'Slug'}
          {required && (
            <span aria-hidden="true" className="cs-slug__required">
              *
            </span>
          )}
        </span>
        {!manualMode && !docTitleEmpty && (
          <span
            className="cs-slug__chip"
            data-tone="auto"
            title="Auto-synced from the title. Type to override."
          >
            <span className="cs-slug__chip-dot" aria-hidden="true" />
            Auto
          </span>
        )}
        {manualMode && collision.kind === 'available' && (
          <output
            aria-live="polite"
            className="cs-slug__chip"
            data-tone="ok"
            title="This slug is unique in the collection."
          >
            <span className="cs-slug__chip-dot" aria-hidden="true" />
            Available
          </output>
        )}
      </label>
      <input
        id={inputId}
        type="text"
        value={slugValue ?? ''}
        onChange={handleChange}
        placeholder={docTitleEmpty ? 'Set the title first' : ''}
        spellCheck={false}
        autoComplete="off"
        required={required}
        className="cs-slug__input"
      />
      {manualMode && !docTitleEmpty && (
        <p className="cs-slug__hint">
          <button
            type="button"
            onClick={handleResetToTitle}
            className="cs-slug__reset"
          >
            Reset to title
          </button>
        </p>
      )}
      {collision.kind === 'collision' ? (
        <output aria-live="polite" className="cs-slug__collision">
          <span aria-hidden="true">!</span>
          This slug is already in use. Save will fail — pick a different one.
        </output>
      ) : null}
    </div>
  );
};
