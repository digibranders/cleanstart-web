'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

const TITLE_TARGET = 60;
const TITLE_HARD_CAP = 70;

type SeoTitleFieldProps = {
  path: string;
  /**
   * The doc-level field whose value is mirrored into `seo.title`
   * while in auto mode. Defaults to `title`. Authors / Categories use
   * `name` as their `useAsTitle`, so the helper passes `name` here.
   */
  sourceField?: string;
};

const colorForLength = (len: number): string => {
  if (len === 0) return 'var(--theme-text-disabled, #6b6e77)';
  if (len <= TITLE_TARGET) return 'var(--color-success-500, #00c46a)';
  if (len <= TITLE_HARD_CAP) return 'var(--color-warning-500, #fbbf24)';
  return 'var(--color-error-500, #ff5c5c)';
};

/**
 * Custom Field for `seo.title` with auto-sync from the document title.
 *
 * UX model (Yoast / Rank Math style):
 *
 *  1. **Empty meta title** → silently mirrors the document `title`
 *     value as the user types. The mirrored value is stored so the
 *     editor sees the real string that will be served as `<title>`.
 *  2. **Editor types in the meta title** → sync stops. Manual mode is
 *     entered only via direct user input in `handleChange` — never
 *     inferred reactively from value divergence (which causes a race
 *     condition where the detect-divergence effect fires with the
 *     pre-update value and locks manual mode after the very first
 *     source keystroke).
 *  3. **Reset button** → re-enables sync, snapping the meta title
 *     back to the current document title.
 *
 * Plus a character counter with traffic-light coloring (green ≤ 60,
 * amber 60-70, red > 70) — Google typically truncates titles at ~60
 * characters, fully cutting at 70.
 */
export const SeoTitleField = (props: SeoTitleFieldProps): ReactElement => {
  const { path, sourceField = 'title' } = props;
  const inputId = useId();

  const { value: docTitleValue } = useField<string>({ path: sourceField });
  const { value: seoTitleValue, setValue: setSeoTitle } = useField<string>({ path });

  /**
   * manualMode = true  → editor typed a custom SEO title; auto-sync off.
   * manualMode = false → SEO title mirrors the source field; auto-sync on.
   *
   * Initial value: false for new docs (empty SEO title), true for existing
   * docs whose stored title no longer matches the current source value
   * (i.e. was previously customised).
   */
  const [manualMode, setManualMode] = useState<boolean>(() => {
    const stored = (seoTitleValue ?? '').trim();
    const docTitle = (docTitleValue ?? '').trim();
    return stored !== '' && stored !== docTitle;
  });

  /**
   * Auto-sync: whenever the source field changes and we're not in manual
   * mode, push its value straight into seo.title. No secondary "detect
   * divergence" effect needed — manual mode is entered exclusively via
   * handleChange.
   */
  useEffect(() => {
    if (manualMode) return;
    setSeoTitle(docTitleValue ?? '');
  }, [docTitleValue, manualMode, setSeoTitle]);

  /**
   * User typed in the SEO title input. Enter manual mode only when the
   * result diverges from the source (so typing the exact source value
   * does not lock the field).
   */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setSeoTitle(next);
      if (next !== (docTitleValue ?? '')) {
        setManualMode(true);
      }
    },
    [docTitleValue, setSeoTitle],
  );

  /**
   * Reset: snap back to the source value and re-engage auto-sync.
   * Set the value immediately so there's no flash while the effect runs.
   */
  const handleResetToTitle = useCallback(() => {
    setSeoTitle(docTitleValue ?? '');
    setManualMode(false);
  }, [docTitleValue, setSeoTitle]);

  const charCount = useMemo(() => (seoTitleValue ?? '').length, [seoTitleValue]);
  const charColor = colorForLength(charCount);
  const docTitleEmpty = (docTitleValue ?? '').trim() === '';

  return (
    <div className="field-type text seo-title-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <div
        className="field-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--cs-space-2, 8px)',
          marginBottom: 4,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <label htmlFor={inputId}>Meta Title</label>
          {!docTitleEmpty && (
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
          )}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: charColor,
            fontFeatureSettings: '"tnum" 1',
          }}
          aria-live="polite"
        >
          {charCount} / {TITLE_TARGET}
        </span>
      </div>
      <input
        id={inputId}
        type="text"
        value={seoTitleValue ?? ''}
        onChange={handleChange}
        placeholder={docTitleEmpty ? 'Set the document title above first' : ''}
        spellCheck
        autoComplete="off"
      />
      <p className="field-description" style={{ margin: '4px 0 0 0' }}>
        <span style={{ fontSize: 12, color: 'var(--theme-text-soft, #a4a7af)' }}>
          {manualMode
            ? "Custom — won't track the document title."
            : `Auto-synced from the document title. Aim for ≤ ${TITLE_TARGET} characters.`}
        </span>
      </p>
    </div>
  );
};
