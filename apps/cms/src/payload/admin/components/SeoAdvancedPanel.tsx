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

const STORAGE_PREFIX = 'cs.seo-advanced.expanded:';

/**
 * Right-rail Tier-5 panel — only the genuinely-expert SEO knobs left:
 * robots-meta directives and Schema.org Speakable selectors. The OG
 * image upload, OG copy overrides, and X (Twitter) card overrides
 * have all moved into `SocialCardField` (Tier 2) — those are about
 * the social-share surface, not "advanced SEO".
 *
 * Reads/writes through `useField` — no schema or migration needed.
 *
 * The panel collapses by default; expanded state persists in
 * localStorage keyed by collection slug.
 */
export const SeoAdvancedPanel = (props: SeoAdvancedPanelProps): ReactElement => {
  const { storageKey } = props;
  const headingId = useId();
  const speakableInputId = useId();

  const fullStorageKey = useMemo(
    () => (storageKey ? `${STORAGE_PREFIX}${storageKey}` : null),
    [storageKey],
  );

  const [expanded, setExpanded] = useState<boolean>(false);
  useEffect(() => {
    if (!fullStorageKey || typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(fullStorageKey);
      if (stored === '1') setExpanded(true);
    } catch {
      // ignore localStorage failures
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

  // Robots advanced — backed by the robotsAdvanced group.
  const { value: noarchive, setValue: setNoarchive } = useField<boolean>({
    path: 'seo.robotsAdvanced.noarchive',
  });
  const { value: nosnippet, setValue: setNosnippet } = useField<boolean>({
    path: 'seo.robotsAdvanced.nosnippet',
  });
  const { value: noimageindex, setValue: setNoimageindex } = useField<boolean>({
    path: 'seo.robotsAdvanced.noimageindex',
  });
  const { value: notranslate, setValue: setNotranslate } = useField<boolean>({
    path: 'seo.robotsAdvanced.notranslate',
  });
  const { value: maxImagePreview, setValue: setMaxImagePreview } = useField<
    'standard' | 'large' | 'none' | null
  >({ path: 'seo.robotsAdvanced.maxImagePreview' });

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
  // at a glance what's customised vs default. Social-card overrides
  // are surfaced in their own card now.
  const summary = useMemo(() => {
    const bits: string[] = [];
    if (
      noarchive || nosnippet || noimageindex || notranslate ||
      (maxImagePreview && maxImagePreview !== 'standard')
    ) {
      bits.push('Robots');
    }
    if (speakableSelectors.length > 0) bits.push(`${speakableSelectors.length} speakable`);
    return bits.length === 0 ? 'Defaults applied' : bits.join(' · ');
  }, [
    noarchive,
    nosnippet,
    noimageindex,
    notranslate,
    maxImagePreview,
    speakableSelectors,
  ]);

  const [subOpen, setSubOpen] = useState<{
    robots: boolean;
    speakable: boolean;
  }>({ robots: false, speakable: false });
  const toggleSub = useCallback((k: keyof typeof subOpen) => {
    setSubOpen((p) => ({ ...p, [k]: !p[k] }));
  }, []);

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
          {/* Robots-meta directives — collapsed by default. */}
          <div className="cs-seo-advanced__row">
            <button
              type="button"
              className="cs-seo-advanced__sub-toggle"
              aria-expanded={subOpen.robots}
              onClick={() => toggleSub('robots')}
            >
              <span className="cs-seo-advanced__label">Robots directives</span>
              <span
                className="cs-seo-advanced__chevron"
                aria-hidden="true"
                style={{ transform: subOpen.robots ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              >
                <ChevronDown />
              </span>
            </button>
            {subOpen.robots && (
              <div className="cs-seo-advanced__nested">
                <label className="cs-seo-advanced__toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(noarchive)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNoarchive(e.target.checked)}
                  />
                  <span>noarchive — don't show cached version</span>
                </label>
                <label className="cs-seo-advanced__toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(nosnippet)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNosnippet(e.target.checked)}
                  />
                  <span>nosnippet — suppress text snippet</span>
                </label>
                <label className="cs-seo-advanced__toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(noimageindex)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNoimageindex(e.target.checked)
                    }
                  />
                  <span>noimageindex — don't index images</span>
                </label>
                <label className="cs-seo-advanced__toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(notranslate)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNotranslate(e.target.checked)
                    }
                  />
                  <span>notranslate — hide "Translate" link</span>
                </label>

                <span className="cs-seo-advanced__label">max-image-preview</span>
                <select
                  value={maxImagePreview ?? 'standard'}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setMaxImagePreview(
                      (e.target.value as 'standard' | 'large' | 'none') || 'standard',
                    )
                  }
                  className="cs-seo-advanced__input"
                >
                  <option value="standard">Default (standard)</option>
                  <option value="large">Large — best for Google Discover</option>
                  <option value="none">None — no preview</option>
                </select>
                <p className="cs-seo-advanced__hint">
                  Set <code>large</code> on photo-heavy posts targeting Google Discover. The
                  rest of these directives are useful for compliance / time-bound pages.
                </p>
              </div>
            )}
          </div>

          {/* Speakable selectors — Schema.org Speakable pilot. */}
          <div className="cs-seo-advanced__row">
            <button
              type="button"
              className="cs-seo-advanced__sub-toggle"
              aria-expanded={subOpen.speakable}
              onClick={() => toggleSub('speakable')}
            >
              <span className="cs-seo-advanced__label">Speakable (Schema.org pilot)</span>
              <span
                className="cs-seo-advanced__chevron"
                aria-hidden="true"
                style={{ transform: subOpen.speakable ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              >
                <ChevronDown />
              </span>
            </button>
            {subOpen.speakable && (
              <div className="cs-seo-advanced__nested">
                <p className="cs-seo-advanced__hint">
                  CSS selectors for paragraphs eligible for Google Assistant voice readout.
                  Pilot feature; only honoured for US-English news. Empty = the lead + first
                  body paragraph.
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPendingSelector(e.target.value)
                    }
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};
