'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

const DESC_TARGET = 160;
// Color is advisory only — the publish gate no longer hard-blocks on
// description length. Amber spans the wide "longer than ideal but still
// reasonable" range; red is reserved for clearly excessive values.
const DESC_HARD_CAP = 240;

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
 *   - Empty meta description mirrors the source field in real time
 *   - Manual mode is entered exclusively via direct user input in
 *     `handleChange` — never inferred reactively from value divergence
 *     (which causes a race condition where the detect-divergence effect
 *     fires with the pre-update value and locks manual mode after the
 *     very first source keystroke)
 *   - "Reset to <source>" link snaps back to auto mode
 *
 * Char counter is traffic-light: green ≤ 160 (Google's typical truncation),
 * amber 161-240, red > 240. Advisory only — publishing is allowed at any
 * length (with a confirm prompt outside the recommended range).
 */
export const SeoDescriptionField = (props: SeoDescriptionFieldProps): ReactElement => {
  const { path, sourceField = 'abstract' } = props;
  const inputId = useId();

  const { value: sourceValue } = useField<string>({ path: sourceField });
  const { value: seoDescValue, setValue: setSeoDesc } = useField<string>({ path });

  /**
   * manualMode = true  → editor typed a custom description; auto-sync off.
   * manualMode = false → description mirrors the source field; auto-sync on.
   *
   * Initial value: false for new docs (empty description), true for existing
   * docs whose stored description no longer matches the current source value.
   */
  const [manualMode, setManualMode] = useState<boolean>(() => {
    const stored = (seoDescValue ?? '').trim();
    const src = (sourceValue ?? '').trim();
    return stored !== '' && stored !== src;
  });

  /**
   * Auto-sync: whenever the source field changes and we're not in manual
   * mode, push its value straight into seo.description. No secondary
   * "detect divergence" effect needed — manual mode is entered exclusively
   * via handleChange.
   */
  useEffect(() => {
    if (manualMode) return;
    setSeoDesc(sourceValue ?? '');
  }, [sourceValue, manualMode, setSeoDesc]);

  /**
   * User typed in the description textarea. Enter manual mode only when
   * the result diverges from the source value.
   */
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

  /**
   * Reset: snap back to the source value and re-engage auto-sync.
   * Set the value immediately so there's no flash while the effect runs.
   */
  const handleResetToSource = useCallback(() => {
    setSeoDesc(sourceValue ?? '');
    setManualMode(false);
  }, [sourceValue, setSeoDesc]);

  const charCount = useMemo(() => (seoDescValue ?? '').length, [seoDescValue]);
  const charColor = colorForLength(charCount);
  const sourceEmpty = (sourceValue ?? '').trim() === '';

  return (
    <div className="field-type textarea seo-description-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <div
        className="field-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--cs-space-2, 8px)',
          marginBottom: 4,
          width: '100%',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <label htmlFor={inputId}>Meta Description</label>
          {!sourceEmpty && (
            <label className="cs-slug__auto-toggle">
              <input
                type="checkbox"
                checked={!manualMode}
                onChange={(e) => {
                  if (e.target.checked) handleResetToSource();
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
          {charCount} / {DESC_TARGET}
        </span>
      </div>
      <textarea
        id={inputId}
        value={seoDescValue ?? ''}
        onChange={handleChange}
        placeholder={sourceEmpty ? `Set the ${sourceField} above first` : ''}
        rows={3}
        spellCheck
      />
      <p className="field-description" style={{ margin: '4px 0 0 0' }}>
        <span style={{ fontSize: 12, color: 'var(--theme-text-soft, #a4a7af)' }}>
          {manualMode
            ? `Custom — won't track ${sourceField}.`
            : `Auto-synced from ${sourceField}. Aim for ≤ ${DESC_TARGET} characters.`}
        </span>
      </p>
    </div>
  );
};
