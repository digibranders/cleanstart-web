'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useId, useMemo, useState } from 'react';

import { lintHreflang } from '../../lib/seo/hreflang-lint';
import { parseHeadTags, summariseParse } from '../../lib/seo/parse-head-tags';
import { ChevronDown } from './icons/Chevron';

interface HreflangRow {
  hreflang: string;
  href: string;
}

export type HeadTagsCardProps = Record<string, never>;

// ─── Quick add (paste hreflang link tags) ──────────────────────────

interface QuickAddProps {
  rows: HreflangRow[];
  onChange: (next: HreflangRow[]) => void;
  onAdded: (params: { addedAlternates: number; summary: string }) => void;
}

const QuickAddPanel = ({ rows, onChange, onAdded }: QuickAddProps): ReactElement => {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    if (text.trim().length === 0) {
      setFeedback('Paste something into the box first.');
      return;
    }
    const parsed = parseHeadTags(text);

    const seenAlt = new Set(
      rows.map((r) => `${r.hreflang.trim().toLowerCase()}|${r.href.trim()}`),
    );
    const nextRows = [...rows];
    let addedAlt = 0;
    for (const incoming of parsed.alternates) {
      const key = `${incoming.hreflang.toLowerCase()}|${incoming.href}`;
      if (seenAlt.has(key)) continue;
      seenAlt.add(key);
      nextRows.push(incoming);
      addedAlt += 1;
    }

    if (addedAlt > 0) onChange(nextRows);

    const summary = summariseParse(parsed, {
      addedAlternates: addedAlt,
      addedMetaTags: 0,
    });
    setFeedback(summary);
    if (addedAlt > 0) setText('');
    onAdded({ addedAlternates: addedAlt, summary });
  }, [text, rows, onChange, onAdded]);

  return (
    <section className="cs-head-tags__section">
      <header className="cs-head-tags__section-head">
        <h4 className="cs-head-tags__section-title">Quick add</h4>
        <p className="cs-head-tags__section-hint">
          Paste <code>&lt;link rel=&quot;alternate&quot; hreflang=&quot;…&quot; /&gt;</code> tags
          — we&apos;ll parse them in.
        </p>
      </header>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'<link rel="alternate" hreflang="en-US" href="…">'}
        rows={2}
        className="cs-head-tags__textarea"
        spellCheck={false}
      />
      <div className="cs-head-tags__row">
        <button
          type="button"
          onClick={handleAdd}
          className="cs-head-tags__btn cs-head-tags__btn--primary"
        >
          Add
        </button>
        {feedback ? (
          <span className="cs-head-tags__feedback">{feedback}</span>
        ) : null}
      </div>
    </section>
  );
};

// ─── Other language versions (hreflang) ────────────────────────────

const HreflangPanel = ({
  rows,
  onChange,
}: {
  rows: HreflangRow[];
  onChange: (next: HreflangRow[]) => void;
}): ReactElement => {
  const issues = useMemo(() => lintHreflang({ rows }), [rows]);

  const updateRow = useCallback(
    (index: number, patch: Partial<HreflangRow>) => {
      onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    },
    [rows, onChange],
  );
  const addRow = useCallback(() => {
    onChange([...rows, { hreflang: '', href: '' }]);
  }, [rows, onChange]);
  const removeRow = useCallback(
    (index: number) => {
      onChange(rows.filter((_, i) => i !== index));
    },
    [rows, onChange],
  );

  return (
    <section className="cs-head-tags__section">
      <header className="cs-head-tags__section-head">
        <h4 className="cs-head-tags__section-title">Hreflang tags</h4>
        {rows.length === 0 && (
          <p className="cs-head-tags__section-hint">
            Self-reference + x-default are auto-added. List other versions here.
          </p>
        )}
      </header>

      {rows.length > 0 && (
        <ul className="cs-head-tags__rows">
          {rows.map((row, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: positional rows
              key={index}
              className="cs-head-tags__hreflang-row"
            >
              <input
                type="text"
                aria-label="Language code"
                className="cs-head-tags__input cs-head-tags__input--mono"
                placeholder="en-US"
                value={row.hreflang}
                onChange={(e) => updateRow(index, { hreflang: e.target.value })}
              />
              <input
                type="text"
                aria-label="URL"
                className="cs-head-tags__input"
                placeholder="https://…"
                value={row.href}
                onChange={(e) => updateRow(index, { href: e.target.value })}
              />
              <button
                type="button"
                aria-label={`Remove version ${index + 1}`}
                onClick={() => removeRow(index)}
                className="cs-head-tags__remove"
                title="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {issues.length > 0 && (
        <ul className="cs-head-tags__issues">
          {issues.map((issue) => (
            <li
              key={issue.code}
              data-severity={issue.severity}
            >
              <span aria-hidden>{issue.severity === 'warning' ? '⚠' : 'ℹ'}</span>
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addRow}
        className="cs-head-tags__btn cs-head-tags__btn--ghost"
      >
        + Add language
      </button>
    </section>
  );
};

// ─── Card chrome ───────────────────────────────────────────────────

/**
 * Right-rail card surfacing per-page `<head>` controls — Quick add
 * (paste anything, we sort it), Other language versions (hreflang),
 * and Extra meta tags. Robots / indexing directives live in the SEO
 * Advanced surface so all advanced SEO controls stay in one place.
 *
 * Drafts always emit `noindex,nofollow` server-side regardless —
 * protects unpublished work from accidental indexing.
 */
export const HeadTagsCard = (_props: HeadTagsCardProps): ReactElement => {
  const [expanded, setExpanded] = useState(false);

  const { value: alternatesRaw, setValue: setAlternatesRaw } = useField<
    HreflangRow[] | null | undefined
  >({ path: 'seo.alternates' });

  const alternates = useMemo<HreflangRow[]>(
    () => (Array.isArray(alternatesRaw) ? alternatesRaw : []),
    [alternatesRaw],
  );

  const headingId = useId();

  const summary = useMemo(() => {
    if (alternates.length === 0) return { label: 'None', tone: 'muted' as const };
    return {
      label: `${alternates.length} ${alternates.length === 1 ? 'tag' : 'tags'}`,
      tone: 'active' as const,
    };
  }, [alternates.length]);

  const handleQuickAdded = useCallback(() => {
    // Hook for future telemetry / toast.
  }, []);

  return (
    <div className="cs-head-tags" data-expanded={expanded ? 'true' : 'false'}>
      <button
        type="button"
        className="cs-head-tags__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="cs-head-tags__title">Hreflang</span>
        <span
          className="cs-head-tags__summary"
          data-tone={summary.tone === 'active' ? 'active' : undefined}
        >
          {summary.label}
        </span>
        <span className="cs-head-tags__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {expanded ? (
        <div id={headingId} className="cs-head-tags__body">
          <QuickAddPanel rows={alternates} onChange={setAlternatesRaw} onAdded={handleQuickAdded} />

          <HreflangPanel rows={alternates} onChange={setAlternatesRaw} />
        </div>
      ) : null}
    </div>
  );
};

export default HeadTagsCard;
