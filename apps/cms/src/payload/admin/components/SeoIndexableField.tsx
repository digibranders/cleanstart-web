'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback } from 'react';

type IndexableValue = 'index' | 'noindex' | 'noindex,nofollow';

type SeoIndexableFieldProps = {
  path: string;
};

const OPTIONS: ReadonlyArray<{
  value: IndexableValue;
  label: string;
  helper: string;
  tone: 'success' | 'warning' | 'error';
}> = [
  {
    value: 'index',
    label: 'Index',
    helper: 'Eligible for Google + included in /sitemap.xml',
    tone: 'success',
  },
  {
    value: 'noindex',
    label: 'No-Index',
    helper: 'Hidden from Google. Followed links still pass authority.',
    tone: 'warning',
  },
  {
    value: 'noindex,nofollow',
    label: 'No-Index + No-Follow',
    helper: 'Hidden from Google AND links don’t pass authority.',
    tone: 'error',
  },
];

const toneColor: Record<'success' | 'warning' | 'error', string> = {
  success: 'var(--color-success-500, #00c46a)',
  warning: 'var(--color-warning-500, #fbbf24)',
  error: 'var(--color-error-500, #ff5c5c)',
};

/**
 * Custom Field for `seo.indexable` rendered as a 3-chip segmented
 * control. The most catastrophic SEO setting (accidentally shipping
 * a noindex page to production) deserves loud, visible UI rather
 * than being buried in a select inside a collapsed group.
 *
 * Compact single-row layout matching the height of the other sidebar
 * cards. Per-option helper text lives on the chip's `title` attribute
 * (and the `Indexable` info-tooltip wired by FieldDescriptionTooltip).
 */
export const SeoIndexableField = (props: SeoIndexableFieldProps): ReactElement => {
  const { path } = props;
  const { value, setValue } = useField<IndexableValue>({ path });
  const current = (value ?? 'index') as IndexableValue;

  const handleSelect = useCallback(
    (next: IndexableValue) => {
      setValue(next);
    },
    [setValue],
  );

  const activeOption = OPTIONS.find((o) => o.value === current) ?? OPTIONS[0];
  if (!activeOption) {
    return <></>;
  }

  return (
    <fieldset className="cs-seo-indexable">
      <legend className="cs-seo-indexable__legend">
        <span className="cs-seo-indexable__title">Indexable</span>
        <span
          className="cs-seo-indexable__chip"
          style={{ color: toneColor[activeOption.tone] }}
        >
          {activeOption.label}
        </span>
      </legend>

      <div
        className="cs-seo-indexable__group"
        aria-label="Indexable"
      >
        {OPTIONS.map((opt) => {
          const isActive = opt.value === current;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleSelect(opt.value)}
              title={opt.helper}
              className="cs-seo-indexable__option"
              data-active={isActive ? 'true' : 'false'}
              style={{ color: isActive ? toneColor[opt.tone] : undefined }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};
