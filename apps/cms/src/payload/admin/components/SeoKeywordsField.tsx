'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useId, useMemo, useState } from 'react';

import { MAX_KEYWORDS, normalizeKeywords } from '../../lib/seo/keywords';

const inputStyle: React.CSSProperties = {
  flex: 1,
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

/**
 * Sidebar editor for `seo.keywords` (a `string[]` json blob). Renders a
 * chip list with add (Enter or comma, paste-friendly) + remove. All
 * mutations route through `normalizeKeywords`, so the stored shape is
 * always clean / de-duped / capped. This is the entity-keyword set
 * (schema.org `keywords` + `mentions[]`), separate from the single
 * "target keyword" density tool.
 */
export const SeoKeywordsField = (): ReactElement => {
  const inputId = useId();
  const { value, setValue } = useField<string[] | null>({ path: 'seo.keywords' });
  const keywords = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [pending, setPending] = useState('');

  const commit = useCallback(
    (next: string[]) => {
      const cleaned = normalizeKeywords(next);
      setValue(cleaned.length > 0 ? cleaned : null);
    },
    [setValue],
  );

  const addPending = useCallback(() => {
    // Split on commas so a pasted "a, b, c" expands into three chips.
    const parts = pending.split(',');
    if (parts.every((p) => p.trim().length === 0)) return;
    commit([...keywords, ...parts]);
    setPending('');
  }, [pending, keywords, commit]);

  const removeKeyword = useCallback(
    (kw: string) => commit(keywords.filter((k) => k !== kw)),
    [keywords, commit],
  );

  const atCap = keywords.length >= MAX_KEYWORDS;

  return (
    <div className="field-type seo-keywords-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
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
        Topic keywords
      </label>
      <p style={{ fontSize: 11, color: 'var(--theme-text-disabled, #6b6e77)', margin: '0 0 6px' }}>
        Entity terms this page is about. Feed schema.org markup + on-site search — not a meta-keywords tag.
      </p>

      {keywords.length > 0 && (
        <ul
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            listStyle: 'none',
            margin: '0 0 6px',
            padding: 0,
          }}
        >
          {keywords.map((kw) => (
            // normalizeKeywords guarantees case-insensitive uniqueness, so
            // kw is a stable, unique key for this list.
            <li key={kw} style={chipStyle}>
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => removeKeyword(kw)}
                aria-label={`Remove ${kw}`}
                style={removeBtnStyle}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id={inputId}
          type="text"
          value={pending}
          disabled={atCap}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPending(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addPending();
            }
          }}
          placeholder={atCap ? `Max ${MAX_KEYWORDS} keywords` : 'e.g. SBOM, FIPS 140-3'}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={addPending}
          disabled={atCap || pending.trim() === ''}
          style={addBtnStyle}
        >
          Add
        </button>
      </div>
    </div>
  );
};
