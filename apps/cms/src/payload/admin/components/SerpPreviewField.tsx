'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

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

// Google typically truncates titles around 580px which roughly maps to
// ~60 characters of average sans-serif width. Description truncates
// around 160 characters. We hard-truncate the preview at these caps.
const truncate = (input: string, max: number): string =>
  input.length > max ? `${input.slice(0, max - 1).trimEnd()}…` : input;

/**
 * Sidebar-mounted SERP (Google search result) mockup. Shows editors
 * exactly how their content will render in Google before they publish.
 *
 * Auto-fallbacks (matches what the public site emits in the meta
 * tags + JSON-LD): if `seo.title` is empty, use the document title;
 * if `seo.description` is empty, use the source field (`abstract`,
 * `summary`, etc); URL is composed from `siteUrl + pathPrefix + slug`.
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

  const titleResolved = useMemo(() => {
    const t = seoTitle?.trim() || docTitle?.trim() || '';
    return truncate(t, 60);
  }, [seoTitle, docTitle]);

  const descResolved = useMemo(() => {
    const d = seoDesc?.trim() || sourceDesc?.trim() || '';
    return truncate(d, 160);
  }, [seoDesc, sourceDesc]);

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

  return (
    <div className="field-type serp-preview-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
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
          }}
        >
          {titleResolved || (
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
          }}
        >
          {descResolved || (
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
        Approximation. Google may rewrite titles / descriptions based on the search query.
      </p>
    </div>
  );
};
