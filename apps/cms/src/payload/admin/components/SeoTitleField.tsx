'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

const TITLE_TARGET = 60;
const TITLE_HARD_CAP = 70;

type SeoTitleFieldProps = {
  path: string;
};

const colorForLength = (len: number): string => {
  if (len === 0) return 'var(--theme-text-disabled, #6b6e77)';
  if (len <= TITLE_TARGET) return 'var(--color-success-500, #00c46a)';
  if (len <= TITLE_HARD_CAP) return 'var(--color-warning-500, #fbbf24)';
  return 'var(--color-error-500, #ff5c5c)';
};

/**
 * Custom Field for `seo.title` with auto-sync from the document
 * title.
 *
 * UX model (Yoast / Rank Math style):
 *
 *  1. **Empty meta title** → silently mirrors the document `title`
 *     value as the user types. The mirrored value is stored, so the
 *     editor sees the real string that will be served as `<title>`.
 *  2. **Editor types in the meta title** → component stops syncing.
 *     Once the user has typed anything that differs from the most
 *     recently synced document title, sync is paused for the lifetime
 *     of this form session.
 *  3. **Reset button** → re-enables sync, snapping the meta title
 *     back to the current document title.
 *
 * Plus a character counter with traffic-light coloring (green ≤ 60,
 * amber 60-70, red > 70) — Google typically truncates titles at
 * around 60 characters, fully cutting at 70.
 */
export const SeoTitleField = (props: SeoTitleFieldProps): ReactElement => {
  const { path } = props;
  const inputId = useId();

  const { value: docTitleValue } = useField<string>({ path: 'title' });
  const { value: seoTitleValue, setValue: setSeoTitle } = useField<string>({ path });

  // Track the value we last auto-synced. While the live seo.title
  // matches that value, sync is in "auto" mode — we keep mirroring.
  // The moment the value differs (because the user typed), we switch
  // to "manual" mode and stop syncing until the user clicks Reset.
  const lastSyncedRef = useRef<string>('');
  const [manualMode, setManualMode] = useState<boolean>(() => {
    // On first mount: if there's already a stored seo.title that
    // differs from the document title, the editor previously
    // customised it. Respect that — start in manual mode.
    const stored = (seoTitleValue ?? '').trim();
    const docTitle = (docTitleValue ?? '').trim();
    return stored !== '' && stored !== docTitle;
  });

  // Auto-sync effect: when document title changes and we're in auto
  // mode, mirror the new value into seo.title.
  useEffect(() => {
    if (manualMode) return;
    const next = docTitleValue ?? '';
    if (seoTitleValue === next) {
      lastSyncedRef.current = next;
      return;
    }
    setSeoTitle(next);
    lastSyncedRef.current = next;
  }, [docTitleValue, manualMode, seoTitleValue, setSeoTitle]);

  // Detect manual edits: if the live value differs from what we
  // last synced AND it differs from the doc title, the user typed.
  useEffect(() => {
    if (manualMode) return;
    const live = seoTitleValue ?? '';
    if (live !== lastSyncedRef.current && live !== (docTitleValue ?? '')) {
      setManualMode(true);
    }
  }, [seoTitleValue, docTitleValue, manualMode]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setSeoTitle(next);
      // The change came from the user; flip to manual mode unless
      // they happened to type the exact doc title (rare).
      if (next !== (docTitleValue ?? '')) {
        setManualMode(true);
      }
    },
    [docTitleValue, setSeoTitle],
  );

  const handleResetToTitle = useCallback(() => {
    const next = docTitleValue ?? '';
    setSeoTitle(next);
    lastSyncedRef.current = next;
    setManualMode(false);
  }, [docTitleValue, setSeoTitle]);

  const charCount = useMemo(() => (seoTitleValue ?? '').length, [seoTitleValue]);
  const charColor = colorForLength(charCount);
  const docTitleEmpty = (docTitleValue ?? '').trim() === '';

  return (
    <div className="field-type text seo-title-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
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
        <span>Meta Title</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          {!manualMode && !docTitleEmpty && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--cs-cyan-500, #06c7f2)',
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
              title="Auto-synced from the document title. Type here to override."
            >
              · auto
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: charColor,
              fontFeatureSettings: '"tnum" 1',
            }}
            aria-live="polite"
          >
            {charCount} / {TITLE_TARGET}
          </span>
        </span>
      </label>
      <input
        id={inputId}
        type="text"
        value={seoTitleValue ?? ''}
        onChange={handleChange}
        placeholder={docTitleEmpty ? 'Set the document title above first' : ''}
        spellCheck
        autoComplete="off"
      />
      <p className="field-description" style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: 12, color: 'var(--theme-text-soft, #a4a7af)' }}>
          {manualMode
            ? 'Custom — won’t track the document title.'
            : `Auto-synced from the document title. Aim for ≤ ${TITLE_TARGET} characters.`}
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
