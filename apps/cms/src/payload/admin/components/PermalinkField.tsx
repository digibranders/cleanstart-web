'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

type PermalinkFieldProps = {
  /**
   * URL path prefix for this collection's public route on the marketing
   * site, e.g. `/blog`, `/webinar`, `/guides`. The component composes
   * `<siteUrl><pathPrefix>/<slug>` to build the live page URL.
   */
  pathPrefix?: string;
  /**
   * Optional override for the public site URL. Defaults to
   * `process.env.NEXT_PUBLIC_SITE_URL` and finally to
   * `https://cleanstart.com`.
   */
  siteUrl?: string;
};

const DEFAULT_SITE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
  'https://cleanstart.com';

const trimSlash = (s: string): string => s.replace(/^\/+|\/+$/g, '');

/**
 * Sidebar-mounted UI field that surfaces the live public URL of the
 * current document. Reads the `slug` field reactively, composes the
 * URL from a configurable site root + collection path prefix, and
 * renders a monospace preview with Copy / Visit affordances.
 *
 * Wire on a collection via:
 *   {
 *     name: 'permalink',
 *     type: 'ui',
 *     admin: {
 *       position: 'sidebar',
 *       components: {
 *         Field: {
 *           path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
 *           clientProps: { pathPrefix: '/blog' },
 *         },
 *       },
 *     },
 *   },
 */
export const PermalinkField = (props: PermalinkFieldProps): ReactElement => {
  const { pathPrefix = '', siteUrl = DEFAULT_SITE_URL } = props;
  const { value: slugValue } = useField<string>({ path: 'slug' });
  const { value: statusValue } = useField<string>({ path: '_status' });
  const [copied, setCopied] = useState(false);

  const fullUrl = useMemo(() => {
    if (!slugValue) return '';
    const root = siteUrl.replace(/\/+$/, '');
    const prefix = pathPrefix ? `/${trimSlash(pathPrefix)}` : '';
    return `${root}${prefix}/${trimSlash(slugValue)}`;
  }, [slugValue, pathPrefix, siteUrl]);

  const isLive = statusValue === 'published';

  const handleCopy = useCallback(() => {
    if (!fullUrl) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [fullUrl]);

  if (!slugValue) {
    return (
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          border: '1px dashed var(--theme-elevation-200, #34363d)',
          borderRadius: '6px',
          background: 'var(--theme-elevation-50, #1c1d21)',
          color: 'var(--theme-text-disabled, #6b6e77)',
          fontSize: '12px',
        }}
      >
        Permalink will appear once a slug is set.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--theme-text-soft, #a4a7af)',
          marginBottom: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>Permalink</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.05rem 0.45rem',
            borderRadius: '999px',
            background: isLive
              ? 'rgba(0, 196, 106, 0.14)'
              : 'rgba(164, 167, 175, 0.14)',
            color: isLive ? 'var(--color-success-500, #00c46a)' : 'var(--theme-text-soft, #a4a7af)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'currentColor',
            }}
          />
          {isLive ? 'Live' : 'Draft'}
        </span>
      </div>
      <div
        style={{
          background: 'var(--theme-input-bg, #14151a)',
          border: '1px solid var(--theme-elevation-200, #34363d)',
          borderRadius: '6px',
          padding: '0.55rem 0.65rem',
          fontFamily:
            '"JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontSize: '12px',
          color: 'var(--theme-text, #e8e9eb)',
          wordBreak: 'break-all',
          lineHeight: 1.5,
          userSelect: 'all',
        }}
      >
        {fullUrl}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            flex: 1,
            padding: '0.4rem 0.65rem',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
            border: '1px solid var(--theme-elevation-250, #3e4048)',
            background: 'transparent',
            color: copied ? 'var(--color-success-500, #00c46a)' : 'var(--theme-text, #e8e9eb)',
            transition: 'border-color 120ms ease, color 120ms ease',
          }}
        >
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '0.4rem 0.65rem',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 500,
            textAlign: 'center',
            border: '1px solid var(--theme-elevation-250, #3e4048)',
            background: 'transparent',
            color: 'var(--theme-text, #e8e9eb)',
            textDecoration: 'none',
            transition: 'border-color 120ms ease, color 120ms ease, background-color 120ms ease',
          }}
        >
          Visit ↗
        </a>
      </div>
    </div>
  );
};
