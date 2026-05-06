'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

const DESC_TARGET = 160;
const DESC_HARD_CAP = 200;

type SeoDescriptionFieldProps = {
  path: string;
  /**
   * Source field name to mirror from when the editor hasn't customised
   * the SEO description. Defaults to `abstract`. Pass e.g. `summary`
   * for Resources or any collection where the lead text lives under
   * a different field.
   */
  sourceField?: string;
};

const colorForLength = (len: number): string => {
  if (len === 0) return 'var(--theme-text-disabled, #6b6e77)';
  if (len <= DESC_TARGET) return 'var(--color-success-500, #00c46a)';
  if (len <= DESC_HARD_CAP) return 'var(--color-warning-500, #fbbf24)';
  return 'var(--color-error-500, #ff5c5c)';
};

/**
 * Custom Field for `seo.description` with auto-sync from a sibling
 * lead-text field (defaults to `abstract`).
 *
 * Same UX model as `SeoTitleField`:
 *   - Empty meta description silently mirrors the source field
 *   - First manual edit flips to manual mode (sync stops)
 *   - "Reset to <source>" link snaps back to auto mode
 *
 * Char counter is traffic-light: green ≤ 160 (Google's typical truncation),
 * amber 160-200, red > 200 (Google fully cuts).
 */
export const SeoDescriptionField = (props: SeoDescriptionFieldProps): ReactElement => {
  const { path, sourceField = 'abstract' } = props;
  const inputId = useId();

  const { value: sourceValue } = useField<string>({ path: sourceField });
  const { value: seoDescValue, setValue: setSeoDesc } = useField<string>({ path });

  const lastSyncedRef = useRef<string>('');
  const [manualMode, setManualMode] = useState<boolean>(() => {
    const stored = (seoDescValue ?? '').trim();
    const src = (sourceValue ?? '').trim();
    return stored !== '' && stored !== src;
  });

  useEffect(() => {
    if (manualMode) return;
    const next = sourceValue ?? '';
    if (seoDescValue === next) {
      lastSyncedRef.current = next;
      return;
    }
    setSeoDesc(next);
    lastSyncedRef.current = next;
  }, [sourceValue, manualMode, seoDescValue, setSeoDesc]);

  useEffect(() => {
    if (manualMode) return;
    const live = seoDescValue ?? '';
    if (live !== lastSyncedRef.current && live !== (sourceValue ?? '')) {
      setManualMode(true);
    }
  }, [seoDescValue, sourceValue, manualMode]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value;
      setSeoDesc(next);
      if (next !== (sourceValue ?? '')) {
        setManualMode(true);
      }
    },
    [sourceValue, setSeoDesc],
  );

  const handleResetToSource = useCallback(() => {
    const next = sourceValue ?? '';
    setSeoDesc(next);
    lastSyncedRef.current = next;
    setManualMode(false);
  }, [sourceValue, setSeoDesc]);

  const charCount = useMemo(() => (seoDescValue ?? '').length, [seoDescValue]);
  const charColor = colorForLength(charCount);
  const sourceEmpty = (sourceValue ?? '').trim() === '';

  return (
    <div className="field-type textarea seo-description-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
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
        <span>Meta Description</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          {!manualMode && !sourceEmpty && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--cs-cyan-500, #06c7f2)',
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
              title={`Auto-synced from ${sourceField}. Type here to override.`}
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
            {charCount} / {DESC_TARGET}
          </span>
        </span>
      </label>
      <textarea
        id={inputId}
        value={seoDescValue ?? ''}
        onChange={handleChange}
        placeholder={sourceEmpty ? `Set the ${sourceField} above first` : ''}
        rows={3}
        spellCheck
      />
      <p className="field-description" style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: 12, color: 'var(--theme-text-soft, #a4a7af)' }}>
          {manualMode
            ? `Custom — won’t track ${sourceField}.`
            : `Auto-synced from ${sourceField}. Aim for ≤ ${DESC_TARGET} characters.`}
        </span>
        {manualMode && !sourceEmpty && (
          <button
            type="button"
            onClick={handleResetToSource}
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
            Reset to {sourceField}
          </button>
        )}
      </p>
    </div>
  );
};
