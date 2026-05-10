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

const BAND_TONE: Record<HealthBand, string> = {
  healthy: 'var(--color-success-500, #00c46a)',
  'needs-work': 'var(--color-warning-500, #fbbf24)',
  missing: 'var(--color-error-500, #ff5c5c)',
};

/**
 * Sidebar-mounted SEO Health Score chip. Reads form state via
 * `useField` and re-runs the pure scorer on every render.
 *
 * Collapsed state is a single ~34px row matching the other sidebar
 * cards (`.cs-schema-preview`, `.cs-head-tags-card`): dot · label ·
 * score · chevron. Expanding reveals the per-check ✓ / ✗ list.
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
  const tone = BAND_TONE[result.band];
  const issuesLabel =
    result.failingCount === 0
      ? 'No issues'
      : `${result.failingCount} issue${result.failingCount === 1 ? '' : 's'}`;

  return (
    <div className="cs-seo-health" data-expanded={open ? 'true' : 'false'}>
      <button
        type="button"
        className="cs-seo-health__header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`SEO health: ${BAND_LABEL[result.band]}, ${result.score} of 100. ${
          result.failingCount === 0 ? 'No issues.' : `${result.failingCount} issue${result.failingCount === 1 ? '' : 's'} to fix.`
        }`}
      >
        <span className="cs-seo-health__title">SEO health</span>
        <span
          className="cs-seo-health__score"
          style={{ color: tone }}
          aria-label={`${result.score} of 100`}
        >
          {result.score}
        </span>
        <span className="cs-seo-health__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {open ? (
        <div className="cs-seo-health__body">
          <p className="cs-seo-health__summary">{issuesLabel}</p>
          <ul className="cs-seo-health__checks">
            {result.checks.map((check) => (
              <li key={check.id} data-pass={check.pass ? 'true' : 'false'}>
                <span className="cs-seo-health__mark" aria-hidden="true">
                  {check.pass ? '✓' : '✗'}
                </span>
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
