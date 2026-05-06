'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';

/**
 * Compact sidebar pill row showing word count + reading minutes for the
 * current document. Replaces two full-width read-only number fields
 * (`readingMinutes`, `wordCount`) with a single glanceable line.
 *
 * The underlying number fields are kept on the collection (just
 * `admin.hidden: true`) so the existing `bodyStatsHook` continues to
 * write to them on save and downstream consumers (JSON-LD, listing
 * cards, sitemap) keep working unchanged.
 */
export const BodyStatsField = (): ReactElement => {
  const { value: wordCountValue } = useField<number>({ path: 'wordCount' });
  const { value: readingMinutesValue } = useField<number>({
    path: 'readingMinutes',
  });

  const words = typeof wordCountValue === 'number' ? wordCountValue : 0;
  const minutes =
    typeof readingMinutesValue === 'number' ? readingMinutesValue : 0;

  const hasStats = words > 0 || minutes > 0;

  return (
    <div className="cs-body-stats">
      <div className="cs-body-stats__row">
        <div
          className="cs-body-stats__pill"
          title="Total words in the body. Computed on save."
        >
          <span className="cs-body-stats__value">
            {hasStats ? words.toLocaleString() : '—'}
          </span>
          <span className="cs-body-stats__label">words</span>
        </div>
        <div
          className="cs-body-stats__pill"
          title="Estimated reading time. Computed from word count on save."
        >
          <span className="cs-body-stats__value">
            {hasStats ? minutes : '—'}
          </span>
          <span className="cs-body-stats__label">
            min read
          </span>
        </div>
      </div>
      {!hasStats && (
        <p className="cs-body-stats__hint">
          Stats compute on save once the body has content.
        </p>
      )}
    </div>
  );
};

export default BodyStatsField;
