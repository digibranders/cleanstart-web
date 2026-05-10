'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useId, useMemo } from 'react';

import { collectPlainText, extractFromLexical } from '../../lib/lexical-extract';
import {
  type DensityBand,
  type HeadingExtract,
  scoreKeywordDensity,
} from '../../lib/seo/keyword-density';

type KeywordTargetFieldProps = {
  /** Source field for the doc title fallback. Defaults to `title`. */
  titleSource?: string;
  /** Source field for the description fallback. Defaults to `abstract`. */
  descriptionSource?: string;
};

const BAND_TONE: Record<DensityBand, string> = {
  absent: '#a4a7af',
  light: '#f0c45a',
  good: '#7ddc9c',
  overused: '#f08f8f',
};

const BAND_LABEL: Record<DensityBand, string> = {
  absent: 'Not in body',
  light: 'Light',
  good: 'Good',
  overused: 'Overused',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: 13,
  background: 'var(--theme-elevation-50, #1c1d21)',
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  borderRadius: 4,
  color: 'var(--theme-text, #e8e9eb)',
  fontFamily: 'inherit',
  marginBottom: 6,
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  fontSize: 11,
  borderRadius: 999,
  background: 'var(--theme-elevation-100, #25262b)',
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  color: 'var(--theme-text, #e8e9eb)',
};

/**
 * Sidebar field that pairs a free-text "target keyword" input with a
 * live density readout: body density (% with band), title presence,
 * description presence. Pure derived signal — recomputes on every
 * keystroke.
 */
export const KeywordTargetField = (
  props: KeywordTargetFieldProps,
): ReactElement => {
  const { titleSource = 'title', descriptionSource = 'abstract' } = props;
  const inputId = useId();
  const { value: keyword, setValue: setKeyword } = useField<string>({
    path: 'seo.keywordTarget',
  });
  const { value: body } = useField<unknown>({ path: 'body' });
  const { value: docTitle } = useField<string>({ path: titleSource });
  const { value: seoTitle } = useField<string>({ path: 'seo.title' });
  const { value: seoDesc } = useField<string>({ path: 'seo.description' });
  const { value: sourceDesc } = useField<string>({ path: descriptionSource });

  const result = useMemo(() => {
    if (!keyword || keyword.trim().length === 0) return null;
    const summary = extractFromLexical(body);
    // Translate Heading[] from lexical-extract into the
    // HeadingExtract[] the scorer expects. Both share `level` + `text`
    // by design; the cast is just narrowing the level union.
    const headings: HeadingExtract[] = summary.headings.map((h) => ({
      level: h.level as HeadingExtract['level'],
      text: h.text,
    }));
    return scoreKeywordDensity({
      keyword,
      bodyText: collectPlainText(body),
      title: seoTitle?.trim() || docTitle?.trim() || null,
      description: seoDesc?.trim() || sourceDesc?.trim() || null,
      headings,
    });
  }, [keyword, body, seoTitle, docTitle, seoDesc, sourceDesc]);

  return (
    <div className="field-type keyword-target-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--theme-text-soft, #a4a7af)',
          marginBottom: 4,
        }}
      >
        Target keyword
      </label>
      <input
        id={inputId}
        type="text"
        value={keyword ?? ''}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setKeyword(e.target.value === '' ? null : e.target.value)
        }
        placeholder="e.g. SBOM signing"
        style={inputStyle}
      />
      {result ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span
            style={{ ...chipStyle, color: BAND_TONE[result.band] }}
            title={`Body: ${result.bodyOccurrences} occurrence${result.bodyOccurrences === 1 ? '' : 's'} across ${result.bodyWords} words.\nSweet spot: 1.0–2.5%.`}
          >
            Body · {result.bodyDensity}% ({BAND_LABEL[result.band]})
          </span>
          <span
            style={{
              ...chipStyle,
              color: result.titleOccurrences > 0 ? '#7ddc9c' : '#f0c45a',
            }}
            title={
              result.titleOccurrences > 0
                ? 'Keyword present in the SEO title.'
                : 'Keyword missing from the SEO title — add it for ranking lift.'
            }
          >
            Title · {result.titleOccurrences > 0 ? '✓' : '✗'}
          </span>
          <span
            style={{
              ...chipStyle,
              color: result.descriptionOccurrences > 0 ? '#7ddc9c' : '#f0c45a',
            }}
            title={
              result.descriptionOccurrences > 0
                ? 'Keyword present in the SEO description.'
                : 'Keyword missing from the SEO description — Google bolds matches.'
            }
          >
            Desc · {result.descriptionOccurrences > 0 ? '✓' : '✗'}
          </span>
          <span
            style={{
              ...chipStyle,
              color: result.inH2OrH3 ? '#7ddc9c' : '#f0c45a',
            }}
            title={
              result.inH2OrH3
                ? 'Keyword appears in at least one H2 / H3 heading — strong topical signal.'
                : 'Keyword missing from H2 / H3 headings — Google weights heading text heavily for topical relevance.'
            }
          >
            H2/H3 · {result.inH2OrH3 ? '✓' : '✗'}
          </span>
          <span
            style={{
              ...chipStyle,
              color: result.inFirst100Words ? '#7ddc9c' : '#f0c45a',
            }}
            title={
              result.inFirst100Words
                ? 'Keyword appears in the first 100 words — early-mention signal.'
                : 'Keyword missing from the first 100 words — Google weights early body content heavily.'
            }
          >
            Lead · {result.inFirst100Words ? '✓' : '✗'}
          </span>
        </div>
      ) : (
        <p
          style={{
            fontSize: 11,
            color: 'var(--theme-text-disabled, #6b6e77)',
            margin: 0,
          }}
        >
          Set a target to see body density + title/description coverage.
        </p>
      )}
    </div>
  );
};
