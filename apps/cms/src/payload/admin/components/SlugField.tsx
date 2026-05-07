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
export const SlugField = (props: SlugFieldProps): ReactElement => {
  const { source = 'title', required = false, description, label } = props;
  const path = props.path ?? 'slug';
  const inputId = useId();

  const { value: docTitleValue } = useField<string>({ path: source });
  const { value: slugValue, setValue: setSlug } = useField<string>({ path });

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

  return (
    <div className="field-type text" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <label
        htmlFor={inputId}
        className="field-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--cs-space-2, 8px)',
          marginBottom: 4,
        }}
      >
        <span>
          {label ?? 'Slug'}
          {required && (
            <span
              aria-hidden="true"
              style={{
                color: 'var(--color-error-500)',
                fontWeight: 700,
                marginInlineStart: 4,
              }}
            >
              *
            </span>
          )}
        </span>
        {!manualMode && !docTitleEmpty && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--cs-cyan-500, #06c7f2)',
              fontWeight: 500,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
            title="Auto-synced from the title. Type here to override."
          >
            · auto
          </span>
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
      />
      <p
        className="field-description"
        style={{
          margin: '4px 0 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--theme-text-soft, #a4a7af)' }}>
          {manualMode
            ? "Custom — won't track the title."
            : (description ?? 'URL-safe slug. Auto-synced from the title.')}
        </span>
        {manualMode && !docTitleEmpty && (
          <button
            type="button"
            onClick={handleResetToTitle}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--cs-cyan-500, #06c7f2)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(6, 199, 242, 0.4)',
              textUnderlineOffset: 2,
            }}
          >
            Reset to title
          </button>
        )}
      </p>
    </div>
  );
};
