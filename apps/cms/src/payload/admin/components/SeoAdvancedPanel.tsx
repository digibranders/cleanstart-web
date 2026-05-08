'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { ChevronDown } from './icons/Chevron';

type SeoAdvancedPanelProps = {
  /**
   * Persisted localStorage key — collection slug, so each list remembers
   * its own collapsed/expanded state per editor.
   */
  storageKey?: string;
};

type MediaPreview = {
  id: string;
  url: string | null;
  filename: string | null;
  alt: string | null;
};

const STORAGE_PREFIX = 'cs.seo-advanced.expanded:';

/**
 * Single right-rail panel housing the OG image + secondary SEO
 * controls (advanced OG copy, Schema.org speakable selectors).
 * Reads/writes into the existing `seo.*` data shape via `useField`,
 * so no schema or migration is needed — only the *render surface*
 * moves from the main form into the sidebar.
 *
 * NB: a custom-canonical-URL block lived here previously; it was
 * removed because the override field had no consumer (every page is
 * self-canonical via `docCanonicalUrl()` in lib/jsonld/url.ts, and
 * `<link rel="canonical">` HTML emission is deferred with apps/web).
 * The schema fields (`seo.useCustomCanonical`, `seo.canonicalOverride`)
 * stay hidden in seo.ts so any saved data survives.
 *
 * The panel collapses by default; expanded state persists in
 * localStorage keyed by collection slug.
 */
export const SeoAdvancedPanel = (props: SeoAdvancedPanelProps): ReactElement => {
  const { storageKey } = props;
  const headingId = useId();
  const ogImageInputId = useId();
  const ogTitleInputId = useId();
  const ogDescInputId = useId();
  const speakableInputId = useId();

  const fullStorageKey = useMemo(
    () => (storageKey ? `${STORAGE_PREFIX}${storageKey}` : null),
    [storageKey],
  );

  const [expanded, setExpanded] = useState<boolean>(false);
  // Restore from localStorage after mount to avoid SSR hydration drift.
  useEffect(() => {
    if (!fullStorageKey || typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(fullStorageKey);
      if (stored === '1') setExpanded(true);
    } catch {
      // ignore localStorage failures (private mode, quota)
    }
  }, [fullStorageKey]);

  const persistExpanded = useCallback(
    (next: boolean) => {
      setExpanded(next);
      if (!fullStorageKey || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(fullStorageKey, next ? '1' : '0');
      } catch {
        // ignore
      }
    },
    [fullStorageKey],
  );

  // OG image — the field is a relationship to media. The MediaField
  // custom upload writes the related-doc id; we read the same path
  // here as a string|null and surface a small status pill.
  const { value: ogImageValue, setValue: setOgImage } = useField<string | null>({
    path: 'seo.ogImage',
  });
  const { value: ogImageAltValue, setValue: setOgImageAlt } = useField<string | null>({
    path: 'seo.ogImageAlt',
  });
  const [ogPreview, setOgPreview] = useState<MediaPreview | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  useEffect(() => {
    if (!ogImageValue) {
      setOgPreview(null);
      return;
    }
    let cancelled = false;
    setOgLoading(true);
    fetch(`/api/media/${encodeURIComponent(ogImageValue)}?depth=0`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc: { id?: string; url?: string; filename?: string; alt?: string } | null) => {
        if (cancelled) return;
        if (!doc) {
          setOgPreview(null);
        } else {
          setOgPreview({
            id: typeof doc.id === 'string' ? doc.id : String(doc.id ?? ogImageValue),
            url: typeof doc.url === 'string' ? doc.url : null,
            filename: typeof doc.filename === 'string' ? doc.filename : null,
            alt: typeof doc.alt === 'string' ? doc.alt : null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setOgPreview(null);
      })
      .finally(() => {
        if (!cancelled) setOgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ogImageValue]);

  const { value: useAdvancedOg, setValue: setUseAdvancedOg } = useField<boolean>({
    path: 'seo.useAdvancedOg',
  });
  const { value: ogTitleValue, setValue: setOgTitle } = useField<string | null>({
    path: 'seo.ogTitle',
  });
  const { value: ogDescValue, setValue: setOgDesc } = useField<string | null>({
    path: 'seo.ogDescription',
  });

  const { value: speakablePathValue, setValue: setSpeakablePath } = useField<
    Array<{ selector: string; id?: string }> | null
  >({ path: 'seo.speakablePath' });

  const speakableSelectors = useMemo(
    () => (Array.isArray(speakablePathValue) ? speakablePathValue : []),
    [speakablePathValue],
  );

  const [pendingSelector, setPendingSelector] = useState('');
  const handleAddSelector = useCallback(() => {
    const trimmed = pendingSelector.trim();
    if (trimmed === '') return;
    const next = [...speakableSelectors, { selector: trimmed }];
    setSpeakablePath(next);
    setPendingSelector('');
  }, [pendingSelector, speakableSelectors, setSpeakablePath]);

  const handleRemoveSelector = useCallback(
    (idx: number) => {
      const next = speakableSelectors.filter((_, i) => i !== idx);
      setSpeakablePath(next);
    },
    [speakableSelectors, setSpeakablePath],
  );

  // Status summary — shown in the collapsed header so editors can see
  // at a glance what's customised vs default.
  const summary = useMemo(() => {
    const bits: string[] = [];
    if (ogImageValue) bits.push('OG image');
    if (useAdvancedOg) bits.push('OG copy');
    if (speakableSelectors.length > 0) bits.push(`${speakableSelectors.length} speakable`);
    return bits.length === 0 ? 'Defaults applied' : bits.join(' · ');
  }, [ogImageValue, useAdvancedOg, speakableSelectors.length]);

  return (
    <div className="cs-seo-advanced" data-expanded={expanded ? 'true' : 'false'}>
      <button
        type="button"
        className="cs-seo-advanced__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => persistExpanded(!expanded)}
      >
        <span className="cs-seo-advanced__title">SEO advanced</span>
        <span className="cs-seo-advanced__summary">{summary}</span>
        <span className="cs-seo-advanced__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {expanded && (
        <div id={headingId} className="cs-seo-advanced__body">
          {/* OG Image */}
          <div className="cs-seo-advanced__row">
            <label htmlFor={ogImageInputId} className="cs-seo-advanced__label">
              Open Graph image
            </label>
            <div className="cs-seo-advanced__og-preview">
              {ogLoading ? (
                <div className="cs-seo-advanced__og-skel" aria-label="Loading preview" />
              ) : ogPreview?.url ? (
                <a
                  href={ogPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-seo-advanced__og-thumb"
                  title={ogPreview.filename ?? 'Open image'}
                >
                  <img src={ogPreview.url} alt={ogPreview.alt ?? ''} loading="lazy" />
                </a>
              ) : (
                <div className="cs-seo-advanced__og-empty" aria-hidden="true">
                  No image
                </div>
              )}
              <div className="cs-seo-advanced__og-meta">
                <input
                  id={ogImageInputId}
                  type="text"
                  value={ogImageValue ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setOgImage(e.target.value === '' ? null : e.target.value)
                  }
                  placeholder="Media ID (paste or clear)"
                  spellCheck={false}
                  autoComplete="off"
                  className="cs-seo-advanced__input cs-seo-advanced__input--mono"
                />
                {ogImageValue && (
                  <input
                    type="text"
                    value={ogImageAltValue ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setOgImageAlt(e.target.value === '' ? null : e.target.value)
                    }
                    placeholder="Override alt text (optional)"
                    spellCheck
                    autoComplete="off"
                    className="cs-seo-advanced__input"
                  />
                )}
              </div>
            </div>
            <p className="cs-seo-advanced__hint">
              Falls back to the hero image, then the site default. Served at 1200×630 (OGP) and
              1200×675 (Discover).
            </p>
          </div>

          {/* Advanced OG copy */}
          <div className="cs-seo-advanced__row">
            <label className="cs-seo-advanced__toggle">
              <input
                type="checkbox"
                checked={Boolean(useAdvancedOg)}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUseAdvancedOg(e.target.checked)
                }
              />
              <span>Override og:title / og:description</span>
            </label>
            {useAdvancedOg && (
              <div className="cs-seo-advanced__nested">
                <label htmlFor={ogTitleInputId} className="cs-seo-advanced__label">
                  og:title
                </label>
                <input
                  id={ogTitleInputId}
                  type="text"
                  value={ogTitleValue ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setOgTitle(e.target.value === '' ? null : e.target.value)
                  }
                  placeholder="Defaults to the SEO title"
                  className="cs-seo-advanced__input"
                />
                <label htmlFor={ogDescInputId} className="cs-seo-advanced__label">
                  og:description
                </label>
                <textarea
                  id={ogDescInputId}
                  value={ogDescValue ?? ''}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setOgDesc(e.target.value === '' ? null : e.target.value)
                  }
                  placeholder="Defaults to the SEO description"
                  rows={2}
                  className="cs-seo-advanced__input"
                />
              </div>
            )}
          </div>

          {/*
            Custom canonical UI removed. Every page is self-canonical
            by default — JSON-LD `url` / `mainEntityOfPage` / `@id` are
            built from `<baseUrl><route-prefix>/<slug>` via
            `docCanonicalUrl()` in lib/jsonld/url.ts. There is no
            `<link rel="canonical">` HTML emission today (apps/web is
            deferred per CLAUDE.md). The `seo.useCustomCanonical` and
            `seo.canonicalOverride` schema fields are kept but hidden;
            once the public-site renderer lands and we want a true
            cross-domain canonical override, surface the UI again
            here AND wire the consumer in lib/jsonld/url.ts.
          */}

          {/* Speakable selectors */}
          <div className="cs-seo-advanced__row">
            <span className="cs-seo-advanced__label">Speakable selectors</span>
            <p className="cs-seo-advanced__hint">
              CSS selectors for paragraphs eligible for Schema.org Speakable. Empty = the lead +
              first body paragraph.
            </p>
            {speakableSelectors.length > 0 && (
              <ul className="cs-seo-advanced__chips">
                {speakableSelectors.map((entry, idx) => (
                  <li key={`${entry.selector}-${idx}`} className="cs-seo-advanced__chip">
                    <code>{entry.selector}</code>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelector(idx)}
                      aria-label={`Remove ${entry.selector}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="cs-seo-advanced__chip-input">
              <input
                id={speakableInputId}
                type="text"
                value={pendingSelector}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPendingSelector(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSelector();
                  }
                }}
                placeholder=".article__lead, .article__first-paragraph"
                className="cs-seo-advanced__input cs-seo-advanced__input--mono"
              />
              <button
                type="button"
                onClick={handleAddSelector}
                disabled={pendingSelector.trim() === ''}
                className="cs-seo-advanced__add"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
