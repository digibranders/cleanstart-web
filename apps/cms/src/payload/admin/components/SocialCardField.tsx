'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { ChevronDown } from './icons/Chevron';
import { MediaBrowseDialog, type MediaBrowseDoc } from './MediaBrowseDialog';
import { SocialCardPreview } from './SocialCardPreview';

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
const OG_RATIO_TOLERANCE = 0.05;

// Social-platform char-count guides — same caps used by SeoAdvancedPanel.
const OG_TITLE_MAX = 60;
const OG_TITLE_HARD = 80;
const OG_DESC_MAX = 160;
const OG_DESC_HARD = 200;

const UPLOAD_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/gif',
] as const;
const UPLOAD_BYTES_LIMIT = 25 * 1024 * 1024;

const validateUploadFile = (file: File): string | null => {
  if (!UPLOAD_ALLOWED_MIMES.includes(file.type as (typeof UPLOAD_ALLOWED_MIMES)[number])) {
    return `Unsupported file type${file.type ? ` (${file.type})` : ''}.`;
  }
  if (file.size > UPLOAD_BYTES_LIMIT) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    const cap = (UPLOAD_BYTES_LIMIT / 1024 / 1024).toFixed(0);
    return `File too large (${mb} MB > ${cap} MB).`;
  }
  return null;
};

/**
 * Social Card sidebar field — promoted out of `SeoAdvancedPanel` so
 * the OG image (touched on ~40% of edits) is one click away instead
 * of three card-expansions deep. Renders an inline OG image picker +
 * upload, alt-text override, and the live Facebook / X / LinkedIn
 * preview using the same fallback chain the HTML emitter will use.
 *
 * Reads/writes through `useField` against the existing `seo.*` shape,
 * so no schema change.
 *
 * Includes the OG title / description override toggle (the social
 * card *is* the OG surface, so the override lives with the preview).
 * Twitter image upload + Twitter card style + robots / speakable
 * controls remain in `SeoAdvancedPanel` (Tier 5).
 */
export const SocialCardField = (): ReactElement => {
  const ogImageInputId = useId();
  const headingId = useId();
  const ogFileInputRef = useRef<HTMLInputElement | null>(null);
  const [ogBrowseOpen, setOgBrowseOpen] = useState(false);
  const [twBrowseOpen, setTwBrowseOpen] = useState(false);
  const twFileInputRef = useRef<HTMLInputElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [ogUpload, setOgUpload] = useState<{
    inFlight: boolean;
    progress: number;
    error: string | null;
  }>({ inFlight: false, progress: 0, error: null });
  const [twUpload, setTwUpload] = useState<{
    inFlight: boolean;
    progress: number;
    error: string | null;
  }>({ inFlight: false, progress: 0, error: null });

  const { value: ogImageValue, setValue: setOgImage } = useField<string | null>({
    path: 'seo.ogImage',
  });
  const { value: ogImageAltValue, setValue: setOgImageAlt } = useField<string | null>({
    path: 'seo.ogImageAlt',
  });

  // Effective-value sources for the social-card preview. Mirror the
  // fallback chain used elsewhere in the rail:
  //   og:title       = (advanced) seo.ogTitle || seo.title || doc.title
  //   og:description = (advanced) seo.ogDescription || seo.description || abstract
  //   og:image       = seo.ogImage || heroImage
  //   x:image        = seo.twitterImage || seo.ogImage || heroImage
  const { value: useAdvancedOg, setValue: setUseAdvancedOg } = useField<boolean>({
    path: 'seo.useAdvancedOg',
  });
  const { value: ogTitleValue, setValue: setOgTitle } = useField<string | null>({
    path: 'seo.ogTitle',
  });
  const { value: ogDescValue, setValue: setOgDesc } = useField<string | null>({
    path: 'seo.ogDescription',
  });
  const { value: docTitle } = useField<string>({ path: 'title' });
  const { value: seoTitle } = useField<string>({ path: 'seo.title' });
  const { value: seoDesc } = useField<string>({ path: 'seo.description' });
  const { value: docAbstract } = useField<string>({ path: 'abstract' });
  const { value: useAdvancedTwitter, setValue: setUseAdvancedTwitter } = useField<boolean>({
    path: 'seo.useAdvancedTwitter',
  });
  const { value: twitterTitleValue, setValue: setTwitterTitle } = useField<string | null>({
    path: 'seo.twitterTitle',
  });
  const { value: twitterDescValue, setValue: setTwitterDesc } = useField<string | null>({
    path: 'seo.twitterDescription',
  });
  const { value: twitterImageValue, setValue: setTwitterImage } = useField<string | null>({
    path: 'seo.twitterImage',
  });
  const { value: twitterCard, setValue: setTwitterCard } = useField<
    'summary' | 'summary_large_image' | null
  >({ path: 'seo.twitterCard' });
  const { value: heroImageRaw } = useField<unknown>({ path: 'heroImage' });

  const heroImageId: string | null = useMemo(() => {
    if (heroImageRaw == null) return null;
    if (typeof heroImageRaw === 'string' || typeof heroImageRaw === 'number') {
      return String(heroImageRaw);
    }
    if (typeof heroImageRaw === 'object' && heroImageRaw !== null) {
      const id = (heroImageRaw as { id?: string | number }).id;
      return id == null ? null : String(id);
    }
    return null;
  }, [heroImageRaw]);

  const fetchMedia = useCallback(
    (
      mediaId: string,
      onDone: (preview: MediaPreview | null) => void,
    ): (() => void) => {
      let cancelled = false;
      fetch(`/api/media/${encodeURIComponent(mediaId)}?depth=0`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            doc:
              | {
                  id?: string | number;
                  url?: string;
                  filename?: string;
                  alt?: string;
                  width?: number;
                  height?: number;
                }
              | null,
          ) => {
            if (cancelled) return;
            if (!doc) {
              onDone(null);
            } else {
              onDone({
                id: typeof doc.id === 'string' ? doc.id : String(doc.id ?? mediaId),
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
          if (!cancelled) onDone(null);
        });
      return () => {
        cancelled = true;
      };
    },
    [],
  );

  const [ogPreview, setOgPreview] = useState<MediaPreview | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [heroPreview, setHeroPreview] = useState<MediaPreview | null>(null);
  const [twImagePreview, setTwImagePreview] = useState<MediaPreview | null>(null);

  useEffect(() => {
    if (!ogImageValue) {
      setOgPreview(null);
      return;
    }
    setOgLoading(true);
    const cancel = fetchMedia(ogImageValue, (preview) => {
      setOgPreview(preview);
      setOgLoading(false);
    });
    return cancel;
  }, [ogImageValue, fetchMedia]);

  useEffect(() => {
    if (!heroImageId) {
      setHeroPreview(null);
      return;
    }
    return fetchMedia(heroImageId, setHeroPreview);
  }, [heroImageId, fetchMedia]);

  useEffect(() => {
    if (!twitterImageValue) {
      setTwImagePreview(null);
      return;
    }
    return fetchMedia(twitterImageValue, setTwImagePreview);
  }, [twitterImageValue, fetchMedia]);

  const onPickOgImage = useCallback(
    (doc: MediaBrowseDoc) => {
      setOgImage(doc.id);
    },
    [setOgImage],
  );

  const performUpload = useCallback(
    (
      file: File,
      onProgress: (next: { inFlight: boolean; progress: number; error: string | null }) => void,
      onSuccess: (newId: string) => void,
    ) => {
      const v = validateUploadFile(file);
      if (v) {
        onProgress({ inFlight: false, progress: 0, error: v });
        return;
      }
      onProgress({ inFlight: true, progress: 0, error: null });

      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('_payload', JSON.stringify({ folder: 'web/general' }));

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          onProgress({
            inFlight: true,
            progress: ev.loaded / Math.max(1, ev.total),
            error: null,
          });
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText) as
              | { doc?: { id?: string | number } }
              | { id?: string | number };
            const newDoc = ('doc' in json && json.doc) ? json.doc : (json as { id?: string | number });
            if (newDoc?.id != null) {
              const id = typeof newDoc.id === 'string' ? newDoc.id : String(newDoc.id);
              onSuccess(id);
              onProgress({ inFlight: false, progress: 1, error: null });
            } else {
              onProgress({
                inFlight: false,
                progress: 0,
                error: 'Upload succeeded but the response was malformed.',
              });
            }
          } catch {
            onProgress({
              inFlight: false,
              progress: 0,
              error: 'Upload succeeded but the response was unparseable.',
            });
          }
        } else {
          let msg = `Upload failed (${xhr.status}).`;
          try {
            const body = JSON.parse(xhr.responseText) as
              | { errors?: { message?: string }[]; message?: string };
            if (body?.errors?.[0]?.message) msg = body.errors[0].message ?? msg;
            else if (body?.message) msg = body.message;
          } catch {
            // ignore
          }
          onProgress({ inFlight: false, progress: 0, error: msg });
        }
      };
      xhr.onerror = () => {
        onProgress({ inFlight: false, progress: 0, error: 'Network error during upload.' });
      };
      xhr.open('POST', '/api/media');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.withCredentials = true;
      xhr.send(fd);
    },
    [],
  );

  const onPickOgFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      performUpload(file, setOgUpload, (id) => setOgImage(id));
    },
    [performUpload, setOgImage],
  );

  const onPickTwFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      performUpload(file, setTwUpload, (id) => setTwitterImage(id));
    },
    [performUpload, setTwitterImage],
  );

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

  return (
    <div className="cs-social-card" data-expanded={expanded ? 'true' : 'false'}>
      <button
        type="button"
        className="cs-social-card__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="cs-social-card__title">Social card</span>
        {ogImageValue ? (
          <span className="cs-social-card__chip" data-tone="active">
            <span className="cs-social-card__dot" aria-hidden="true" />
            Custom image
          </span>
        ) : null}
        <span className="cs-social-card__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {expanded && (
      <div id={headingId} className="cs-social-card__body">
        <div className="cs-social-card__og-row">
          {ogLoading ? (
            <div className="cs-social-card__og-skel" aria-label="Loading preview" />
          ) : ogPreview?.url ? (
            <a
              href={ogPreview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cs-social-card__og-thumb"
              title={ogPreview.filename ?? 'Open image'}
            >
              <img src={ogPreview.url} alt={ogPreview.alt ?? ''} loading="lazy" />
            </a>
          ) : (
            <div className="cs-social-card__og-empty" aria-hidden="true">
              No image
            </div>
          )}
          <div className="cs-social-card__og-meta">
            <div className="cs-social-card__og-actions">
              <button
                type="button"
                id={ogImageInputId}
                onClick={() => setOgBrowseOpen(true)}
                className="cs-social-card__btn"
                disabled={ogUpload.inFlight}
              >
                {ogImageValue ? 'Change' : 'Pick'}
              </button>
              <button
                type="button"
                onClick={() => ogFileInputRef.current?.click()}
                className="cs-social-card__btn"
                disabled={ogUpload.inFlight}
              >
                {ogUpload.inFlight
                  ? `Uploading ${Math.round(ogUpload.progress * 100)}%`
                  : 'Upload'}
              </button>
              <input
                ref={ogFileInputRef}
                type="file"
                accept={UPLOAD_ALLOWED_MIMES.join(',')}
                onChange={onPickOgFile}
                tabIndex={-1}
                style={{ display: 'none' }}
              />
              {ogImageValue && !ogUpload.inFlight && (
                <button
                  type="button"
                  onClick={() => {
                    setOgImage(null);
                    setOgImageAlt(null);
                  }}
                  className="cs-social-card__btn cs-social-card__btn--ghost"
                  aria-label="Clear OG image"
                >
                  Clear
                </button>
              )}
            </div>
            {ogUpload.error && (
              <p className="cs-social-card__error">✗ {ogUpload.error}</p>
            )}
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
                className="cs-social-card__input"
              />
            )}
          </div>
        </div>

        <p className="cs-social-card__hint">
          Falls back to the hero image. Recommended 1200×630 (OGP) or 1200×675 (Discover).
        </p>
        {ogPreview?.width != null && ogPreview?.height != null && (
          <p className="cs-social-card__hint cs-social-card__hint--meta">
            {ogPreview.width}×{ogPreview.height} px ·{' '}
            {(ogPreview.width / Math.max(ogPreview.height, 1)).toFixed(2)}:1
          </p>
        )}
        {ogDimWarnings.length > 0 && (
          <ul className="cs-social-card__warnings">
            {ogDimWarnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}

        <div className="cs-social-card__override">
          <label className="cs-social-card__toggle">
            <input
              type="checkbox"
              checked={Boolean(useAdvancedOg)}
              onChange={(e) => setUseAdvancedOg(e.target.checked)}
            />
            <span>Override Facebook / LinkedIn (og:title, og:description)</span>
          </label>
          {useAdvancedOg && (
            <div className="cs-social-card__override-fields">
              <div className="cs-social-card__field-head">
                <span className="cs-social-card__field-label">og:title</span>
                <CharCounter
                  value={ogTitleValue ?? ''}
                  soft={OG_TITLE_MAX}
                  hard={OG_TITLE_HARD}
                />
              </div>
              <input
                type="text"
                value={ogTitleValue ?? ''}
                onChange={(e) =>
                  setOgTitle(e.target.value === '' ? null : e.target.value)
                }
                placeholder="Defaults to the SEO title"
                className="cs-social-card__input"
              />
              <div className="cs-social-card__field-head">
                <span className="cs-social-card__field-label">og:description</span>
                <CharCounter
                  value={ogDescValue ?? ''}
                  soft={OG_DESC_MAX}
                  hard={OG_DESC_HARD}
                />
              </div>
              <textarea
                value={ogDescValue ?? ''}
                onChange={(e) =>
                  setOgDesc(e.target.value === '' ? null : e.target.value)
                }
                placeholder="Defaults to the SEO description"
                rows={2}
                className="cs-social-card__input cs-social-card__input--textarea"
              />
            </div>
          )}

          <label className="cs-social-card__toggle">
            <input
              type="checkbox"
              checked={Boolean(useAdvancedTwitter)}
              onChange={(e) => setUseAdvancedTwitter(e.target.checked)}
            />
            <span>Override X / Twitter card</span>
          </label>
          {useAdvancedTwitter && (
            <div className="cs-social-card__override-fields">
              <div className="cs-social-card__field-head">
                <span className="cs-social-card__field-label">Card style</span>
              </div>
              <select
                value={twitterCard ?? 'summary_large_image'}
                onChange={(e) =>
                  setTwitterCard(
                    (e.target.value as 'summary' | 'summary_large_image') ||
                      'summary_large_image',
                  )
                }
                className="cs-social-card__input"
              >
                <option value="summary_large_image">Summary with large image</option>
                <option value="summary">Summary (small image)</option>
              </select>

              <div className="cs-social-card__field-head">
                <span className="cs-social-card__field-label">twitter:title</span>
                <CharCounter
                  value={twitterTitleValue ?? ''}
                  soft={OG_TITLE_MAX}
                  hard={OG_TITLE_HARD}
                />
              </div>
              <input
                type="text"
                value={twitterTitleValue ?? ''}
                onChange={(e) =>
                  setTwitterTitle(e.target.value === '' ? null : e.target.value)
                }
                placeholder="Defaults to og:title"
                className="cs-social-card__input"
              />

              <div className="cs-social-card__field-head">
                <span className="cs-social-card__field-label">twitter:description</span>
                <CharCounter
                  value={twitterDescValue ?? ''}
                  soft={OG_DESC_MAX}
                  hard={OG_DESC_HARD}
                />
              </div>
              <textarea
                value={twitterDescValue ?? ''}
                onChange={(e) =>
                  setTwitterDesc(e.target.value === '' ? null : e.target.value)
                }
                placeholder="Defaults to og:description"
                rows={2}
                className="cs-social-card__input cs-social-card__input--textarea"
              />

              <div className="cs-social-card__field-head">
                <span className="cs-social-card__field-label">
                  twitter:image (falls back to og:image)
                </span>
              </div>
              <div className="cs-social-card__og-actions">
                <button
                  type="button"
                  onClick={() => setTwBrowseOpen(true)}
                  className="cs-social-card__btn"
                  disabled={twUpload.inFlight}
                >
                  {twitterImageValue ? 'Change' : 'Pick'}
                </button>
                <button
                  type="button"
                  onClick={() => twFileInputRef.current?.click()}
                  className="cs-social-card__btn"
                  disabled={twUpload.inFlight}
                >
                  {twUpload.inFlight
                    ? `Uploading ${Math.round(twUpload.progress * 100)}%`
                    : 'Upload'}
                </button>
                <input
                  ref={twFileInputRef}
                  type="file"
                  accept={UPLOAD_ALLOWED_MIMES.join(',')}
                  onChange={onPickTwFile}
                  tabIndex={-1}
                  style={{ display: 'none' }}
                />
                {twitterImageValue && !twUpload.inFlight && (
                  <button
                    type="button"
                    onClick={() => setTwitterImage(null)}
                    className="cs-social-card__btn cs-social-card__btn--ghost"
                    aria-label="Clear X image"
                  >
                    Clear
                  </button>
                )}
              </div>
              {twUpload.error && (
                <p className="cs-social-card__error">✗ {twUpload.error}</p>
              )}
              <p className="cs-social-card__hint">
                X clips at 2:1 (1200×600) — use a different crop here when the OG image is portrait or letter-boxed.
              </p>
            </div>
          )}
        </div>

        <div className="cs-social-card__preview">
          <SocialCardPreview
            ogImageUrl={ogPreview?.url ?? heroPreview?.url ?? null}
            xImageUrl={
              twImagePreview?.url ??
              ogPreview?.url ??
              heroPreview?.url ??
              null
            }
            title={effectiveOgTitle}
            description={effectiveOgDesc}
            canonicalUrl={null}
          />
        </div>
      </div>
      )}

      <MediaBrowseDialog
        open={ogBrowseOpen}
        onClose={() => setOgBrowseOpen(false)}
        onSelect={onPickOgImage}
        ariaLabel="Browse media for social card image"
      />
      <MediaBrowseDialog
        open={twBrowseOpen}
        onClose={() => setTwBrowseOpen(false)}
        onSelect={(doc) => setTwitterImage(doc.id)}
        ariaLabel="Browse media for X (Twitter) image"
      />
    </div>
  );
};

// Inline character-count chip shown next to a label.
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
      className={`cs-social-card__counter cs-social-card__counter--${tone}`}
      aria-label={`${len} of ${soft} characters`}
    >
      {len} / {soft}
    </span>
  );
};

export default SocialCardField;
