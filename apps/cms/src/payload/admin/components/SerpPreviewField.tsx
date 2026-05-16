'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

type SerpPreviewFieldProps = {
  /**
   * URL path prefix for this collection, e.g. `/blog`, `/guides`.
   * Used to build the displayed URL alongside the slug.
   */
  pathPrefix?: string;
  /**
   * Source field for the title fallback when `seo.title` is empty.
   * Defaults to `title`. Authors / Categories use `name` instead.
   */
  titleSource?: string;
  /**
   * Source field for the description fallback when `seo.description`
   * is empty. Defaults to `abstract`.
   */
  descriptionSource?: string;
  /**
   * Doc-level field that owns the URL part. `slug` for almost every
   * collection — Pages override to `path` because they compute a
   * full nested path on save. When `urlSource` is `path`, the field's
   * value already contains the leading slash, so the rendered URL
   * skips the `pathPrefix` prepending.
   */
  urlSource?: string;
  /**
   * Public site URL. Defaults to `process.env.NEXT_PUBLIC_SITE_URL`
   * then `https://cleanstart.com`.
   */
  siteUrl?: string;
};

const DEFAULT_SITE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
  'https://cleanstart.com';

const trimSlash = (s: string): string => s.replace(/^\/+|\/+$/g, '');

// Google's desktop SERP title cell is ~600px wide; we budget a little
// under that to leave room for the rendered ellipsis and account for
// minor font-metric drift between Arial here and Google's Roboto/Arial.
const TITLE_PIXEL_BUDGET = 560;
const TITLE_FONT = '18px arial, sans-serif';
// Roughly the 2-line clamp boundary on desktop. Used only to decide
// whether to surface the "Google may rewrite" advisory — the actual
// clamp is CSS-driven.
const DESC_CHAR_BOUNDARY = 160;

type TruncResult = { display: string; truncated: boolean };

const ssrFallback = (text: string, charCap: number): TruncResult =>
  text.length <= charCap
    ? { display: text, truncated: false }
    : { display: `${text.slice(0, charCap - 1).trimEnd()}…`, truncated: true };

/**
 * Truncate a string so it renders within `budgetPx` at the given font,
 * preferring a word-boundary cut and falling back to a character-level
 * cut when no word boundary fits (long unbroken strings like `TTTT…`).
 *
 * Mirrors Google's actual SERP rendering behaviour: pixel-budget cap,
 * ellipsis at the last whole word, no mid-word breaks when avoidable.
 */
const truncateToPixelBudget = (
  text: string,
  budgetPx: number,
  font: string,
): TruncResult => {
  if (typeof document === 'undefined') return ssrFallback(text, 60);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return ssrFallback(text, 60);

  ctx.font = font;
  if (ctx.measureText(text).width <= budgetPx) {
    return { display: text, truncated: false };
  }

  // Word-boundary binary search. `split(/(\s+)/)` keeps whitespace tokens
  // so joining a prefix preserves the original spacing exactly.
  const words = text.split(/(\s+)/);
  let lo = 0;
  let hi = words.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    const candidate = `${words.slice(0, mid).join('').trimEnd()}…`;
    if (ctx.measureText(candidate).width <= budgetPx) lo = mid;
    else hi = mid - 1;
  }

  if (lo > 0) {
    return {
      display: `${words.slice(0, lo).join('').trimEnd()}…`,
      truncated: true,
    };
  }

  // No word boundary fits (e.g. `TTTT…`). Fall back to char-level cut.
  let charLo = 0;
  let charHi = text.length;
  while (charLo < charHi) {
    const mid = (charLo + charHi + 1) >> 1;
    const candidate = `${text.slice(0, mid)}…`;
    if (ctx.measureText(candidate).width <= budgetPx) charLo = mid;
    else charHi = mid - 1;
  }
  return { display: `${text.slice(0, charLo)}…`, truncated: true };
};

/**
 * Sidebar-mounted SERP (Google search result) mockup. Shows editors
 * exactly how their content will render in Google before they publish.
 *
 * Auto-fallbacks (matches what the public site emits in the meta
 * tags + JSON-LD): if `seo.title` is empty, use the document title;
 * if `seo.description` is empty, use the source field (`abstract`,
 * `summary`, etc); URL is composed from `siteUrl + pathPrefix + slug`.
 *
 * Length handling is intentionally honest about Google's behaviour
 * since the publish gate no longer hard-blocks on long meta values:
 * title is pixel-budget truncated, description is CSS-clamped to 2
 * lines, and both rows allow break-anywhere on adversarial unbroken
 * strings so the sidebar layout never gets distorted.
 */
export const SerpPreviewField = (props: SerpPreviewFieldProps): ReactElement => {
  const {
    pathPrefix = '',
    titleSource = 'title',
    descriptionSource = 'abstract',
    urlSource = 'slug',
    siteUrl = DEFAULT_SITE_URL,
  } = props;

  const { value: docTitle } = useField<string>({ path: titleSource });
  const { value: seoTitle } = useField<string>({ path: 'seo.title' });
  const { value: seoDesc } = useField<string>({ path: 'seo.description' });
  const { value: sourceDesc } = useField<string>({ path: descriptionSource });
  const { value: urlPart } = useField<string>({ path: urlSource });

  // Mark hydration so the pixel-budget truncator runs only on the
  // client; the first render uses the SSR-safe char fallback to avoid
  // a hydration mismatch when canvas-measured width differs from the
  // char heuristic.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const titleRaw = useMemo(
    () => (seoTitle?.trim() || docTitle?.trim() || ''),
    [seoTitle, docTitle],
  );

  const descRaw = useMemo(
    () => (seoDesc?.trim() || sourceDesc?.trim() || ''),
    [seoDesc, sourceDesc],
  );

  const title = useMemo<TruncResult>(() => {
    if (!titleRaw) return { display: '', truncated: false };
    if (!hydrated) return ssrFallback(titleRaw, 60);
    return truncateToPixelBudget(titleRaw, TITLE_PIXEL_BUDGET, TITLE_FONT);
  }, [titleRaw, hydrated]);

  const descOverBoundary = descRaw.length > DESC_CHAR_BOUNDARY;

  // Pages compute a `path` on save that already starts with `/` and
  // contains the full nested chain (e.g. `/solutions/pricing`). Every
  // other collection stores a bare `slug` — we glue the prefix on.
  const urlResolved = useMemo(() => {
    if (!urlPart) return '';
    const root = siteUrl.replace(/\/+$/, '');
    if (urlSource === 'path') {
      const path = urlPart.startsWith('/') ? urlPart : `/${urlPart}`;
      return `${root}${path}`;
    }
    const prefix = pathPrefix ? `/${trimSlash(pathPrefix)}` : '';
    return `${root}${prefix}/${trimSlash(urlPart)}`;
  }, [urlPart, urlSource, pathPrefix, siteUrl]);

  // Google renders the URL as a breadcrumb-ish path, e.g. `cleanstart.com › blog › sebi-cscrf-audit`
  const displayUrl = useMemo(() => {
    if (!urlResolved) return '';
    try {
      const u = new URL(urlResolved);
      const segments = u.pathname.split('/').filter(Boolean);
      return [u.host, ...segments].join(' › ');
    } catch {
      return urlResolved;
    }
  }, [urlResolved]);

  const advisoryParts: string[] = [];
  if (title.truncated) {
    advisoryParts.push('Google will truncate this title at ~600px.');
  }
  if (descOverBoundary) {
    advisoryParts.push(
      'Google often rewrites descriptions; the displayed text may differ.',
    );
  }

  return (
    <div
      className="field-type serp-preview-field"
      style={{ marginBottom: 'var(--cs-space-3, 12px)', minWidth: 0 }}
    >
      <div
        className="field-label"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--theme-text-soft, #a4a7af)',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>SERP preview</span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--theme-text-disabled, #6b6e77)',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          Google
        </span>
      </div>
      <div
        style={{
          background: 'var(--theme-elevation-50, #1c1d21)',
          border: '1px solid var(--theme-elevation-150, #2a2c33)',
          borderRadius: 8,
          padding: '12px 14px',
          fontFamily: 'arial, sans-serif',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            color: 'var(--theme-text-soft, #a4a7af)',
            fontSize: 12,
            marginBottom: 4,
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}
        >
          {displayUrl || (
            <em style={{ opacity: 0.6 }}>(set a slug to preview the URL)</em>
          )}
        </div>
        <div
          style={{
            color: '#8ab4f8' /* Google dark-mode blue link */,
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.3,
            marginBottom: 4,
            cursor: 'default',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {title.display || (
            <em style={{ opacity: 0.6, color: 'var(--theme-text-disabled, #6b6e77)' }}>
              (set a title to preview)
            </em>
          )}
        </div>
        <div
          style={{
            color: 'var(--theme-text, #e8e9eb)',
            fontSize: 13,
            lineHeight: 1.5,
            opacity: 0.85,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {descRaw || (
            <em style={{ opacity: 0.6, color: 'var(--theme-text-disabled, #6b6e77)' }}>
              (set an abstract or SEO description to preview)
            </em>
          )}
        </div>
      </div>
      <p
        className="field-description"
        style={{
          margin: '6px 0 0 0',
          fontSize: 11,
          color: 'var(--theme-text-disabled, #6b6e77)',
        }}
      >
        {advisoryParts.length > 0
          ? advisoryParts.join(' · ')
          : 'Approximation. Google may rewrite titles / descriptions based on the search query.'}
      </p>
    </div>
  );
};
