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
    label: 'No-index',
    helper: "Hidden from Google. Followed links still pass authority.",
    tone: 'warning',
  },
  {
    value: 'noindex,nofollow',
    label: 'No-index, no-follow',
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
 * Selection writes back to `seo.indexable` via useField.
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
    <fieldset
      className="field-type seo-indexable-field"
      style={{
        marginBottom: 'var(--cs-space-3, 12px)',
        border: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      <legend
        className="field-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--cs-space-2, 8px)',
          marginBottom: 4,
          padding: 0,
          width: '100%',
        }}
      >
        <span>Indexable</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: 11,
            color: toneColor[activeOption.tone],
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'currentColor',
            }}
          />
          {current === 'index' ? 'Live' : 'Hidden'}
        </span>
      </legend>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          background: 'var(--theme-input-bg, #14151a)',
          border: '1px solid var(--theme-elevation-200, #34363d)',
          borderRadius: 6,
          padding: 3,
        }}
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
              style={{
                background: isActive ? 'var(--cs-tint-brand-soft, rgba(6,199,242,0.08))' : 'transparent',
                color: isActive ? toneColor[opt.tone] : 'var(--theme-text-soft, #a4a7af)',
                border: 'none',
                borderRadius: 4,
                padding: '0.4rem 0.5rem',
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'background-color 120ms ease, color 120ms ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <p
        className="field-description"
        style={{
          margin: '4px 0 0 0',
          fontSize: 12,
          color: 'var(--theme-text-soft, #a4a7af)',
        }}
      >
        {activeOption.helper}
      </p>
    </fieldset>
  );
};
