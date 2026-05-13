'use client';

import { useFormFields, useRowLabel } from '@payloadcms/ui';
import type { ReactElement } from 'react';

const truncate = (input: string, max: number): string =>
  input.length > max ? `${input.slice(0, max - 1).trimEnd()}…` : input;

const formatLevel = (raw: number | null | undefined): string =>
  typeof raw === 'number' && Number.isFinite(raw) ? `H${raw}` : 'H?';

/**
 * Row label for the auto-built `tableOfContents` array. Shows the heading
 * level + text on the collapsed row (e.g. "H2 · What Is Attack Surface
 * Reduction") so editors can verify TOC structure at a glance.
 *
 * Why useFormFields instead of useRowLabel().data:
 * - useRowLabel().data reads from RowLabelContext which reconstructs row data
 *   from form-state keys. admin.hidden: true skips addFieldStatePromise so
 *   those keys are never registered — data is always empty.
 * - useDocumentInfo().initialData is set once on page load and is NOT updated
 *   after in-session saves, so it always reflects stale pre-save values.
 * - useFormFields reads directly from the live flat form state by dot-path
 *   (e.g. "tableOfContents.0.level"). addFieldStatePromise registers ALL
 *   sub-fields server-side regardless of row collapse state, and form state
 *   is updated on every save without a page refresh.
 *
 * Prerequisite: level and text must use HiddenField (custom null component)
 * not admin.hidden: true. The null component does not trigger
 * fieldIsHiddenOrDisabled, so the fields ARE included in form state.
 */
export const TocRowLabel = (): ReactElement => {
  const { rowNumber } = useRowLabel();

  const level = useFormFields(
    ([fields]) =>
      rowNumber != null
        ? (fields[`tableOfContents.${rowNumber}.level`]?.value as number | undefined)
        : undefined,
  );

  const text = useFormFields(
    ([fields]) =>
      rowNumber != null
        ? (fields[`tableOfContents.${rowNumber}.text`]?.value as string | undefined)
        : undefined,
  );

  const displayLevel = formatLevel(level);
  const displayText = (text ?? '').trim();

  return (
    <span>
      <span
        style={{
          display: 'inline-block',
          minWidth: '2.25rem',
          padding: '0.05rem 0.4rem',
          marginRight: '0.5rem',
          borderRadius: '3px',
          background: 'var(--theme-elevation-150, #e2e8f0)',
          color: 'var(--theme-text, #101828)',
          fontSize: '0.7rem',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {displayLevel}
      </span>
      {displayText ? (
        truncate(displayText, 110)
      ) : (
        <em style={{ opacity: 0.6 }}>(no heading text)</em>
      )}
    </span>
  );
};
