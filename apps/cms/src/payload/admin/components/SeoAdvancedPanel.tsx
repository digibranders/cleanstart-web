'use client';

import { useField, useListDrawer } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { ChevronDown } from './icons/Chevron';
import { SocialCardPreview } from './SocialCardPreview';

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
  width: number | null;
  height: number | null;
};

// OG image dimension targets per the OGP spec + Google Discover docs.
// 1200×630 minimum, 1.91:1 aspect (with ±5% slack to absorb crops that
// are still safe). Width below 600 disqualifies from many platforms.
const OG_TARGET_WIDTH = 1200;
const OG_MIN_WIDTH = 600;
const OG_TARGET_RATIO = 1.91;
const OG_RATIO_TOLERANCE = 0.05; // ±5%

// Social-platform char-count guides. Real platforms vary by client +
// viewport; these are the conservative caps editors should write to.
const OG_TITLE_MAX = 60;
const OG_TITLE_HARD = 80;
const OG_DESC_MAX = 160;
const OG_DESC_HARD = 200;

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

  // OG image — relationship to the `media` collection. The picker
  // uses Payload's first-party `useListDrawer` so editors get the
  // exact same media-list UX as anywhere else in the admin (search,
  // pagination, upload-from-device, alt-text editing) instead of
  // having to copy-paste a Media ID.
  const { value: ogImageValue, setValue: setOgImage } = useField<string | null>({
    path: 'seo.ogImage',
  });
  const { value: ogImageAltValue, setValue: setOgImageAlt } = useField<string | null>({
    path: 'seo.ogImageAlt',
  });
  const [OgImageListDrawer, , { openDrawer: openOgImageDrawer, closeDrawer: closeOgImageDrawer }] =
    useListDrawer({ collectionSlugs: ['media'], uploads: true });
  const onPickOgImage = useCallback(
    (args: { doc: { id?: string | number } }) => {
      const id = args.doc?.id;
      if (id != null) setOgImage(typeof id === 'string' ? id : String(id));
      closeOgImageDrawer();
    },
    [setOgImage, closeOgImageDrawer],
  );

  // Twitter image — same picker pattern.
  const [TwitterImageListDrawer, , {
    openDrawer: openTwitterImageDrawer,
    closeDrawer: closeTwitterImageDrawer,
  }] = useListDrawer({ collectionSlugs: ['media'], uploads: true });
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
      .then(
        (
          doc:
            | { id?: string; url?: string; filename?: string; alt?: string; width?: number; height?: number }
            | null,
        ) => {
          if (cancelled) return;
          if (!doc) {
            setOgPreview(null);
          } else {
            setOgPreview({
              id: typeof doc.id === 'string' ? doc.id : String(doc.id ?? ogImageValue),
              url: typeof doc.url === 'string' ? doc.url : null,
              filename: typeof doc.filename === 'string' ? doc.filename : null,
              alt: typeof doc.alt === 'string' ? doc.alt : null,
              width: typeof doc.width === 'number' ? doc.width : null,
              height: typeof doc.height === 'number' ? doc.height : null,
            });
          }
        },
      )
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

  // Twitter / X overrides — reuse the schema fields that already exist.
  const { value: useAdvancedTwitter, setValue: setUseAdvancedTwitter } =
    useField<boolean>({ path: 'seo.useAdvancedTwitter' });
  const { value: twitterTitleValue, setValue: setTwitterTitle } =
    useField<string | null>({ path: 'seo.twitterTitle' });
  const { value: twitterDescValue, setValue: setTwitterDesc } =
    useField<string | null>({ path: 'seo.twitterDescription' });
  const { value: twitterImageValue, setValue: setTwitterImage } =
    useField<string | null>({ path: 'seo.twitterImage' });
  const { value: twitterCard, setValue: setTwitterCard } =
    useField<'summary' | 'summary_large_image' | null>({ path: 'seo.twitterCard' });

  // Robots advanced — backed by the new robotsAdvanced group.
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

  // Always-fall-back values for the social-card preview.
  const { value: docTitle } = useField<string>({ path: 'title' });
  const { value: seoTitle } = useField<string>({ path: 'seo.title' });
  const { value: seoDesc } = useField<string>({ path: 'seo.description' });
  const { value: docAbstract } = useField<string>({ path: 'abstract' });

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

  // OG image dimension warnings — derived from the resolved media doc.
  const ogDimWarnings = useMemo<string[]>(() => {
    if (!ogPreview || ogPreview.width == null || ogPreview.height == null) return [];
    const out: string[] = [];
    const { width, height } = ogPreview;
    if (width < OG_MIN_WIDTH) {
      out.push(`Below ${OG_MIN_WIDTH} px wide — most platforms will refuse it.`);
    } else if (width < OG_TARGET_WIDTH) {
      out.push(`Below the recommended ${OG_TARGET_WIDTH} px width.`);
    }
    if (height > 0) {
      const ratio = width / height;
      const lo = OG_TARGET_RATIO * (1 - OG_RATIO_TOLERANCE);
      const hi = OG_TARGET_RATIO * (1 + OG_RATIO_TOLERANCE);
      if (ratio < lo || ratio > hi) {
        out.push(
          `Aspect ratio ${ratio.toFixed(2)}:1 — recommended is ${OG_TARGET_RATIO}:1. Platforms will crop.`,
        );
      }
    }
    return out;
  }, [ogPreview]);

  // Effective values for the social-card preview — apply the same
  // fallback chain the (future) HTML <meta> emitter will use:
  //   og:title       = ogTitle || seo.title || doc.title
  //   og:description = ogDescription || seo.description || abstract
  //   og:image       = ogImage(url) — only what we have resolved here
  // Twitter falls back through OG when no twitter override.
  const effectiveOgTitle =
    (useAdvancedOg && ogTitleValue?.trim()) ||
    seoTitle?.trim() ||
    docTitle?.trim() ||
    '';
  const effectiveOgDesc =
    (useAdvancedOg && ogDescValue?.trim()) ||
    seoDesc?.trim() ||
    docAbstract?.trim() ||
    '';

  // Status summary — shown in the collapsed header so editors can see
  // at a glance what's customised vs default.
  const summary = useMemo(() => {
    const bits: string[] = [];
    if (ogImageValue) bits.push('OG image');
    if (useAdvancedOg) bits.push('OG copy');
    if (useAdvancedTwitter) bits.push('X card');
    if (
      noarchive || nosnippet || noimageindex || notranslate ||
      (maxImagePreview && maxImagePreview !== 'standard')
    ) {
      bits.push('Robots');
    }
    if (speakableSelectors.length > 0) bits.push(`${speakableSelectors.length} speakable`);
    return bits.length === 0 ? 'Defaults applied' : bits.join(' · ');
  }, [
    ogImageValue,
    useAdvancedOg,
    useAdvancedTwitter,
    noarchive,
    nosnippet,
    noimageindex,
    notranslate,
    maxImagePreview,
    speakableSelectors.length,
  ]);

  // Subsection collapse — the editor doesn't always want every advanced
  // block open. Persist per-subsection expansion the same way the panel
  // itself persists.
  const [subOpen, setSubOpen] = useState<{
    twitter: boolean;
    robots: boolean;
    speakable: boolean;
  }>({ twitter: false, robots: false, speakable: false });
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
                <div className="cs-seo-advanced__og-actions">
                  <button
                    type="button"
                    id={ogImageInputId}
                    onClick={openOgImageDrawer}
                    className="cs-seo-advanced__og-pick"
                  >
                    {ogImageValue ? 'Change image' : 'Pick image'}
                  </button>
                  {ogImageValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setOgImage(null);
                        setOgImageAlt(null);
                      }}
                      className="cs-seo-advanced__og-clear"
                      aria-label="Clear OG image"
                    >
                      Clear
                    </button>
                  )}
                </div>
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
              Falls back to the hero image, then the site default. Recommended 1200×630 (OGP)
              or 1200×675 (Discover).
            </p>
            {ogPreview?.width != null && ogPreview?.height != null && (
              <p className="cs-seo-advanced__hint cs-seo-advanced__hint--meta">
                {ogPreview.width}×{ogPreview.height} px ·{' '}
                {(ogPreview.width / Math.max(ogPreview.height, 1)).toFixed(2)}:1
              </p>
            )}
            {ogDimWarnings.length > 0 && (
              <ul className="cs-seo-advanced__warnings">
                {ogDimWarnings.map((w) => (
                  <li key={w} className="cs-seo-advanced__warning">
                    ⚠ {w}
                  </li>
                ))}
              </ul>
            )}
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
                <div className="cs-seo-advanced__row-head">
                  <label htmlFor={ogTitleInputId} className="cs-seo-advanced__label">
                    og:title
                  </label>
                  <CharCounter
                    value={ogTitleValue ?? ''}
                    soft={OG_TITLE_MAX}
                    hard={OG_TITLE_HARD}
                  />
                </div>
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
                <div className="cs-seo-advanced__row-head">
                  <label htmlFor={ogDescInputId} className="cs-seo-advanced__label">
                    og:description
                  </label>
                  <CharCounter
                    value={ogDescValue ?? ''}
                    soft={OG_DESC_MAX}
                    hard={OG_DESC_HARD}
                  />
                </div>
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

          {/* Social-card live preview — uses the effective OG values
              (override → SEO → doc fallback chain). Sits BETWEEN the
              OG copy override and the Twitter / Robots / Speakable
              subsections so editors immediately see the impact of the
              override they just toggled. */}
          <div className="cs-seo-advanced__row">
            <span className="cs-seo-advanced__label">Social card preview</span>
            <SocialCardPreview
              imageUrl={ogPreview?.url ?? null}
              title={effectiveOgTitle}
              description={effectiveOgDesc}
              canonicalUrl={null}
            />
            <p className="cs-seo-advanced__hint">
              Approximation. Each platform crops + truncates differently and updates its rules
              over time; treat this as a sanity check, not a pixel-accurate render.
            </p>
          </div>

          {/* Twitter / X overrides — collapsed by default, most editors
              never need to touch this. The default fallback chain
              twitter:* → og:* → seo.* → doc.* is wired in the (future)
              HTML emitter. */}
          <div className="cs-seo-advanced__row">
            <button
              type="button"
              className="cs-seo-advanced__sub-toggle"
              aria-expanded={subOpen.twitter}
              onClick={() => toggleSub('twitter')}
            >
              <span className="cs-seo-advanced__label">X (Twitter) card overrides</span>
              <span
                className="cs-seo-advanced__chevron"
                aria-hidden="true"
                style={{ transform: subOpen.twitter ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              >
                <ChevronDown />
              </span>
            </button>
            {subOpen.twitter && (
              <div className="cs-seo-advanced__nested">
                <label className="cs-seo-advanced__toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(useAdvancedTwitter)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setUseAdvancedTwitter(e.target.checked)
                    }
                  />
                  <span>Use X-specific overrides</span>
                </label>
                {useAdvancedTwitter && (
                  <>
                    <span className="cs-seo-advanced__label">Card style</span>
                    <select
                      value={twitterCard ?? 'summary_large_image'}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setTwitterCard(
                          (e.target.value as 'summary' | 'summary_large_image') ||
                            'summary_large_image',
                        )
                      }
                      className="cs-seo-advanced__input"
                    >
                      <option value="summary_large_image">Summary with large image</option>
                      <option value="summary">Summary (small image)</option>
                    </select>

                    <div className="cs-seo-advanced__row-head">
                      <span className="cs-seo-advanced__label">twitter:title</span>
                      <CharCounter
                        value={twitterTitleValue ?? ''}
                        soft={OG_TITLE_MAX}
                        hard={OG_TITLE_HARD}
                      />
                    </div>
                    <input
                      type="text"
                      value={twitterTitleValue ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setTwitterTitle(e.target.value === '' ? null : e.target.value)
                      }
                      placeholder="Defaults to og:title"
                      className="cs-seo-advanced__input"
                    />

                    <div className="cs-seo-advanced__row-head">
                      <span className="cs-seo-advanced__label">twitter:description</span>
                      <CharCounter
                        value={twitterDescValue ?? ''}
                        soft={OG_DESC_MAX}
                        hard={OG_DESC_HARD}
                      />
                    </div>
                    <textarea
                      value={twitterDescValue ?? ''}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setTwitterDesc(e.target.value === '' ? null : e.target.value)
                      }
                      placeholder="Defaults to og:description"
                      rows={2}
                      className="cs-seo-advanced__input"
                    />

                    <span className="cs-seo-advanced__label">
                      twitter:image (falls back to og:image)
                    </span>
                    <div className="cs-seo-advanced__og-actions">
                      <button
                        type="button"
                        onClick={openTwitterImageDrawer}
                        className="cs-seo-advanced__og-pick"
                      >
                        {twitterImageValue ? 'Change X image' : 'Pick X image'}
                      </button>
                      {twitterImageValue && (
                        <button
                          type="button"
                          onClick={() => setTwitterImage(null)}
                          className="cs-seo-advanced__og-clear"
                          aria-label="Clear Twitter image"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="cs-seo-advanced__hint">
                      X clips at 2:1 (1200×600) — use a different crop here when the OG image
                      is portrait or letter-boxed.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Robots-meta directives — collapsed by default, advanced. */}
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

          {/* Speakable selectors — Schema.org Speakable. Demoted into
              a collapsed-by-default subsection because it's a Google
              pilot feature (US English news only) with no documented
              ranking impact — surfacing it prominently to non-news
              editors was misleading. The data still emits cleanly via
              JSON-LD Article (see lib/jsonld/article.ts:166). */}
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
      {/* Picker drawers — must mount inside the React tree for the
          useListDrawer hooks to render their portal content. The
          drawers themselves are visually hidden until opened. */}
      <OgImageListDrawer onSelect={onPickOgImage} />
      <TwitterImageListDrawer
        onSelect={(args: { doc: { id?: string | number } }) => {
          const id = args.doc?.id;
          if (id != null) setTwitterImage(typeof id === 'string' ? id : String(id));
          closeTwitterImageDrawer();
        }}
      />
    </div>
  );
};

// ─── CharCounter helper ──────────────────────────────────────────────
//
// Inline character-count chip shown next to a label. `soft` is the
// recommended cap (warns); `hard` is the platform clip point (errors).
// Pure presentation — does not block input.
const CharCounter = ({
  value,
  soft,
  hard,
}: {
  value: string;
  soft: number;
  hard: number;
}): ReactElement => {
  const len = value.length;
  let tone: 'ok' | 'warn' | 'bad' = 'ok';
  if (len > hard) tone = 'bad';
  else if (len > soft) tone = 'warn';
  return (
    <span
      className={`cs-seo-advanced__count cs-seo-advanced__count--${tone}`}
      aria-label={`${len} of ${soft} characters`}
    >
      {len} / {soft}
    </span>
  );
};
