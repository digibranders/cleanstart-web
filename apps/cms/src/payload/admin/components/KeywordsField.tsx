'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { collectPlainText, extractFromLexical } from '../../lib/lexical-extract';
import {
  type DensityBand,
  type HeadingExtract,
  scoreKeywordDensity,
} from '../../lib/seo/keyword-density';
import { MAX_KEYWORDS, normalizeKeywords } from '../../lib/seo/keywords';
import type { TopicSuggestion } from '../../lib/seo/topic-suggestions';

type KeywordsFieldProps = {
  titleSource?: string;
  descriptionSource?: string;
};

const RECOMMENDED_MAX = 5;

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

const sectionLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--theme-text-soft, #a4a7af)',
  marginBottom: 4,
};
const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--theme-text-disabled, #6b6e77)',
  margin: '0 0 6px',
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
};
const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 6px 3px 8px',
  fontSize: 11,
  borderRadius: 999,
  background: 'var(--theme-elevation-100, #25262b)',
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  color: 'var(--theme-text, #e8e9eb)',
};
const readoutChipStyle: React.CSSProperties = { ...chipStyle, padding: '3px 8px' };
const removeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--theme-text-soft, #a4a7af)',
  cursor: 'pointer',
  fontSize: 13,
  lineHeight: 1,
  padding: 0,
};
const addBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 4,
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  background: 'var(--theme-elevation-100, #25262b)',
  color: 'var(--theme-text, #e8e9eb)',
  cursor: 'pointer',
};
const suggestBoxStyle: React.CSSProperties = {
  marginTop: 4,
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  borderRadius: 4,
  background: 'var(--theme-elevation-50, #1c1d21)',
  overflow: 'hidden',
};
const suggestItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  padding: '5px 8px',
  fontSize: 12,
  background: 'transparent',
  border: 'none',
  color: 'var(--theme-text, #e8e9eb)',
  cursor: 'pointer',
  textAlign: 'left',
};

/**
 * Unified SEO "Keywords" card. Two sections:
 *  - Primary topic — `seo.keywordTarget` + a live coverage readout
 *    (body density, presence in title/desc/H2-H3/lead). Writing aid.
 *  - Supporting topics — `seo.keywords` chip list (string[] json) with
 *    autosuggest sourced from the Meilisearch `keywords` facet.
 * Supersedes the former KeywordTargetField + SeoKeywordsField.
 */
export const KeywordsField = (props: KeywordsFieldProps): ReactElement => {
  const { titleSource = 'title', descriptionSource = 'abstract' } = props;
  const primaryId = useId();
  const supportingId = useId();

  const { value: keyword, setValue: setKeyword } = useField<string>({ path: 'seo.keywordTarget' });
  const { value: body } = useField<unknown>({ path: 'body' });
  const { value: docTitle } = useField<string>({ path: titleSource });
  const { value: seoTitle } = useField<string>({ path: 'seo.title' });
  const { value: seoDesc } = useField<string>({ path: 'seo.description' });
  const { value: sourceDesc } = useField<string>({ path: descriptionSource });

  const density = useMemo(() => {
    if (!keyword || keyword.trim().length === 0) return null;
    const summary = extractFromLexical(body);
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

  const { value: topicsValue, setValue: setTopics } = useField<string[] | null>({
    path: 'seo.keywords',
  });
  const topics = useMemo(() => (Array.isArray(topicsValue) ? topicsValue : []), [topicsValue]);
  const [pending, setPending] = useState('');

  const commitTopics = useCallback(
    (next: string[]) => {
      const cleaned = normalizeKeywords(next);
      setTopics(cleaned.length > 0 ? cleaned : null);
    },
    [setTopics],
  );
  const addText = useCallback(
    (text: string) => {
      const parts = text.split(',');
      if (parts.every((p) => p.trim().length === 0)) return;
      commitTopics([...topics, ...parts]);
      setPending('');
    },
    [topics, commitTopics],
  );
  const removeTopic = useCallback(
    (kw: string) => commitTopics(topics.filter((k) => k !== kw)),
    [topics, commitTopics],
  );

  const atCap = topics.length >= MAX_KEYWORDS;
  const overRecommended = topics.length > RECOMMENDED_MAX;

  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/topic-suggestions?q=${encodeURIComponent(pending.trim())}`,
          { credentials: 'include' },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { suggestions?: TopicSuggestion[] };
        const selected = new Set(topics.map((t) => t.toLocaleLowerCase()));
        setSuggestions(
          (data.suggestions ?? []).filter((s) => !selected.has(s.value.toLocaleLowerCase())),
        );
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [pending, topics, focused]);

  return (
    <div className="field-type keywords-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <label htmlFor={primaryId} style={sectionLabelStyle}>
        Primary topic
      </label>
      <input
        id={primaryId}
        type="text"
        value={keyword ?? ''}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setKeyword(e.target.value === '' ? null : e.target.value)
        }
        placeholder="e.g. SBOM signing"
        style={{ ...inputStyle, marginBottom: 6 }}
      />
      {density ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <span style={{ ...readoutChipStyle, color: BAND_TONE[density.band] }}>
            Body · {density.bodyDensity}% ({BAND_LABEL[density.band]})
          </span>
          <span style={{ ...readoutChipStyle, color: density.titleOccurrences > 0 ? '#7ddc9c' : '#f0c45a' }}>
            Title · {density.titleOccurrences > 0 ? '✓' : '✗'}
          </span>
          <span style={{ ...readoutChipStyle, color: density.descriptionOccurrences > 0 ? '#7ddc9c' : '#f0c45a' }}>
            Desc · {density.descriptionOccurrences > 0 ? '✓' : '✗'}
          </span>
          <span style={{ ...readoutChipStyle, color: density.inH2OrH3 ? '#7ddc9c' : '#f0c45a' }}>
            H2/H3 · {density.inH2OrH3 ? '✓' : '✗'}
          </span>
          <span style={{ ...readoutChipStyle, color: density.inFirst100Words ? '#7ddc9c' : '#f0c45a' }}>
            Lead · {density.inFirst100Words ? '✓' : '✗'}
          </span>
        </div>
      ) : (
        <p style={hintStyle}>Set a primary topic to see coverage (writing aid — not a ranking lever).</p>
      )}

      <label htmlFor={supportingId} style={sectionLabelStyle}>
        Supporting topics{' '}
        <span style={{ color: overRecommended ? '#f0c45a' : 'var(--theme-text-disabled, #6b6e77)' }}>
          · {topics.length}/{MAX_KEYWORDS} ({overRecommended ? 'aim for 3–5' : '3–5 recommended'})
        </span>
      </label>

      {topics.length > 0 && (
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', margin: '0 0 6px', padding: 0 }}>
          {topics.map((kw) => (
            <li key={kw} style={chipStyle}>
              <span>{kw}</span>
              <button type="button" onClick={() => removeTopic(kw)} aria-label={`Remove ${kw}`} style={removeBtnStyle}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id={supportingId}
          type="text"
          value={pending}
          disabled={atCap}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPending(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addText(pending);
            }
          }}
          placeholder={atCap ? `Max ${MAX_KEYWORDS} topics` : 'type or pick a topic…'}
          style={inputStyle}
        />
        <button type="button" onClick={() => addText(pending)} disabled={atCap || pending.trim() === ''} style={addBtnStyle}>
          Add
        </button>
      </div>

      {focused && !atCap && suggestions.length > 0 && (
        <div style={suggestBoxStyle}>
          {suggestions.map((s) => (
            <button
              key={s.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addText(s.value);
              }}
              style={suggestItemStyle}
            >
              <span>{s.value}</span>
              <span style={{ color: 'var(--theme-text-disabled, #6b6e77)' }}>{s.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
