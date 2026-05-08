'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { auditLexicalBody } from '../../lib/lexical-audit';
import { collectPlainText } from '../../lib/lexical-extract';
import { type ReadabilityBand, scoreReadability } from '../../lib/readability';
import { detectFeaturedSnippetCandidates } from '../../lib/seo/featured-snippet';

const BAND_LABEL: Record<ReadabilityBand, string> = {
  'very-easy': 'Very easy',
  easy: 'Easy',
  standard: 'Standard',
  difficult: 'Difficult',
};

const BAND_TONE: Record<ReadabilityBand, string> = {
  'very-easy': '#7ddc9c',
  easy: '#7ddc9c',
  standard: '#f0c45a',
  difficult: '#f08f8f',
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  background: 'var(--theme-elevation-100, #25262b)',
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  color: 'var(--theme-text, #e8e9eb)',
  letterSpacing: 0.2,
};

/**
 * Sidebar-mounted audit card for the doc body. Shows three chips:
 *   - internal / external link counts
 *   - image alt-coverage (X / Y with alt)
 *   - reading-grade band (Easy / Standard / Difficult)
 *
 * Pure derived signal — re-runs on every body change. No API calls,
 * no async work.
 */
export const BodyAuditField = (): ReactElement | null => {
  const { value: body } = useField<unknown>({ path: 'body' });

  const audit = useMemo(() => auditLexicalBody(body), [body]);
  const readability = useMemo(() => scoreReadability(collectPlainText(body)), [body]);
  const snippets = useMemo(() => detectFeaturedSnippetCandidates(body), [body]);

  // Empty body: nothing useful to render. Mounting nothing avoids a
  // dead chip row on a brand-new draft.
  if (
    audit.totalImages === 0 &&
    audit.internalLinks === 0 &&
    audit.externalLinks === 0 &&
    readability.words === 0
  ) {
    return null;
  }

  const altCoverage =
    audit.totalImages === 0
      ? null
      : `${audit.imagesWithAlt}/${audit.totalImages} alt`;
  const altPass = audit.totalImages === 0 || audit.imagesWithAlt === audit.totalImages;

  return (
    <div className="field-type body-audit-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <div
        className="field-label"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--theme-text-soft, #a4a7af)',
          marginBottom: 6,
        }}
      >
        Body audit
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={chipStyle} title="Internal links pointing inside the site">
          {audit.internalLinks} internal
        </span>
        <span style={chipStyle} title="External links pointing off-site">
          {audit.externalLinks} external
        </span>
        {altCoverage ? (
          <span
            style={{
              ...chipStyle,
              borderColor: altPass ? '#2fae67' : '#c79a2e',
              color: altPass ? '#7ddc9c' : '#f0c45a',
            }}
            title={
              altPass
                ? 'Every body image has alt text'
                : 'Some body images are missing alt text — fix before publishing'
            }
          >
            {altCoverage}
          </span>
        ) : null}
        {readability.words > 0 ? (
          <span
            style={{ ...chipStyle, color: BAND_TONE[readability.band] }}
            title={`Flesch Reading Ease ${readability.score}/100 across ${readability.words} words / ${readability.sentences} sentences`}
          >
            {BAND_LABEL[readability.band]} · {readability.score}
          </span>
        ) : null}
        {snippets.candidates.length > 0 ? (
          <span
            style={{
              ...chipStyle,
              color:
                snippets.best === 'great'
                  ? '#7ddc9c'
                  : snippets.best === 'okay'
                    ? '#f0c45a'
                    : '#a4a7af',
            }}
            title={`${snippets.candidates
              .map((c) => `${c.question} → ${c.answerWordCount} words (${c.quality})`)
              .join('\n')}\n\nGoogle pulls featured-snippet panels from H2/H3 questions followed by a 40–60-word answer paragraph.`}
          >
            {snippets.candidates.length} snippet{snippets.candidates.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </div>
  );
};
