'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { type HealthBand, scoreSeoHealth } from '../../lib/seo/health-score';
import { ChevronDown } from './icons/Chevron';

type SeoHealthScoreFieldProps = {
  /** Source field for the title fallback when `seo.title` is empty. */
  titleSource?: string;
  /** Source field for the description fallback when `seo.description` is empty. */
  descriptionSource?: string;
  /** Doc-level field that owns the URL part. `slug` for most collections, `path` for Pages. */
  urlSource?: string;
};

const BAND_LABEL: Record<HealthBand, string> = {
  healthy: 'Healthy',
  'needs-work': 'Needs work',
  missing: 'Missing essentials',
};

const BAND_COLOR: Record<HealthBand, { bg: string; fg: string; ring: string }> = {
  healthy: { bg: '#0f3a26', fg: '#7ddc9c', ring: '#2fae67' },
  'needs-work': { bg: '#3a2f0f', fg: '#f0c45a', ring: '#c79a2e' },
  missing: { bg: '#3a1212', fg: '#f08f8f', ring: '#c54040' },
};

/**
 * Sidebar-mounted SEO Health Score chip. Reads form state via
 * `useField` and re-runs the pure scorer on every render. The chip
 * expands on click into a per-check ✓ / ✗ list so editors know
 * exactly what to fix.
 */
export const SeoHealthScoreField = (
  props: SeoHealthScoreFieldProps,
): ReactElement => {
  const {
    titleSource = 'title',
    descriptionSource = 'abstract',
    urlSource = 'slug',
  } = props;

  const { value: docTitle } = useField<string>({ path: titleSource });
  const { value: seoTitle } = useField<string>({ path: 'seo.title' });
  const { value: seoDesc } = useField<string>({ path: 'seo.description' });
  const { value: sourceDesc } = useField<string>({ path: descriptionSource });
  const { value: indexable } = useField<string>({ path: 'seo.indexable' });
  const { value: ogImage } = useField<unknown>({ path: 'seo.ogImage' });
  const { value: heroImage } = useField<unknown>({ path: 'heroImage' });
  const { value: photo } = useField<unknown>({ path: 'photo' });
  const { value: urlPart } = useField<string>({ path: urlSource });

  const result = useMemo(
    () =>
      scoreSeoHealth({
        title: (seoTitle?.trim() || docTitle?.trim() || '') || null,
        description: (seoDesc?.trim() || sourceDesc?.trim() || '') || null,
        indexable: indexable ?? null,
        hasOgImage: ogImage != null,
        hasHero: heroImage != null || photo != null,
        slugOrPath: urlPart ?? null,
      }),
    [seoTitle, docTitle, seoDesc, sourceDesc, indexable, ogImage, heroImage, photo, urlPart],
  );

  const [open, setOpen] = useState(false);
  const colors = BAND_COLOR[result.band];

  return (
    <div className="field-type seo-health-score-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`SEO health: ${BAND_LABEL[result.band]}, ${result.score} of 100. ${
          result.failingCount === 0 ? 'No issues.' : `${result.failingCount} issue${result.failingCount === 1 ? '' : 's'} to fix.`
        }`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: colors.bg,
          color: colors.fg,
          border: `1px solid ${colors.ring}`,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `2px solid ${colors.ring}`,
            fontSize: 13,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
          }}
        >
          {result.score}
        </span>
        <span style={{ flex: 1, lineHeight: 1.3 }}>
          <span style={{ display: 'block', fontWeight: 600 }}>SEO health · {BAND_LABEL[result.band]}</span>
          <span style={{ display: 'block', fontSize: 11, opacity: 0.8 }}>
            {result.failingCount === 0
              ? 'No issues found.'
              : `${result.failingCount} issue${result.failingCount === 1 ? '' : 's'} to fix · click for details`}
          </span>
        </span>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.85,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform var(--cs-motion-micro)',
          }}
        >
          <ChevronDown />
        </span>
      </button>
      {open ? (
        <ul
          style={{
            margin: '8px 0 0 0',
            padding: '8px 12px',
            listStyle: 'none',
            background: 'var(--theme-elevation-50, #1c1d21)',
            border: '1px solid var(--theme-elevation-150, #2a2c33)',
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          {result.checks.map((check) => (
            <li
              key={check.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0',
                color: check.pass
                  ? 'var(--theme-text-soft, #a4a7af)'
                  : 'var(--theme-text, #e8e9eb)',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: check.pass ? '#2fae67' : '#c54040',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  flex: '0 0 auto',
                }}
              >
                {check.pass ? '✓' : '✗'}
              </span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
