'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

type PermalinkFieldProps = {
  /**
   * URL path prefix for this collection's public route on the marketing
   * site, e.g. `/blog`, `/webinar`, `/guides`. The component composes
   * `<siteUrl><pathPrefix>/<slug>` to build the live page URL. Pass an
   * empty string when `sourceField` already carries a full path (e.g.
   * Pages.path = `/solutions/pricing`).
   */
  pathPrefix?: string;
  /**
   * Optional override for the public site URL. Defaults to
   * `process.env.NEXT_PUBLIC_SITE_URL` and finally to
   * `https://cleanstart.com`.
   */
  siteUrl?: string;
  /**
   * Field to read the URL part from. Defaults to `slug` (single segment
   * concatenated under `pathPrefix`); pass `'path'` for collections like
   * Pages whose hook computes the full nested path.
   */
  sourceField?: string;
};

const DEFAULT_SITE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
  'https://cleanstart.com';

const trimSlash = (s: string): string => s.replace(/^\/+|\/+$/g, '');

const ClipboardIcon = ({ checked }: { checked: boolean }): ReactElement =>
  checked ? (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M3.5 8.5l3 3 6-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <rect
        x="4"
        y="3"
        width="8"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 3v-.5A1.5 1.5 0 0 1 7.5 1h1A1.5 1.5 0 0 1 10 2.5V3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );

const ExternalLinkIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M9 3h4v4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 3l-6 6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 9.5V12a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 3 12V7a1.5 1.5 0 0 1 1.5-1.5H7"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Sidebar-mounted UI field that surfaces the live public URL of the
 * current document. Reads the `slug` field reactively, composes the
 * URL from a configurable site root + collection path prefix, and
 * renders a single-row monospace preview with inline Copy / Visit
 * icon buttons (replaces the previous below-row action buttons that
 * spent two full rows on icons-with-labels).
 */
export const PermalinkField = (props: PermalinkFieldProps): ReactElement => {
  const { pathPrefix = '', siteUrl = DEFAULT_SITE_URL, sourceField = 'slug' } = props;
  const { value: sourceValue } = useField<string>({ path: sourceField });
  const { value: statusValue } = useField<string>({ path: '_status' });
  const [copied, setCopied] = useState(false);

  const fullUrl = useMemo(() => {
    if (!sourceValue) return '';
    const root = siteUrl.replace(/\/+$/, '');
    const prefix = pathPrefix ? `/${trimSlash(pathPrefix)}` : '';
    return `${root}${prefix}/${trimSlash(sourceValue)}`;
  }, [sourceValue, pathPrefix, siteUrl]);

  const isLive = statusValue === 'published';

  const handleCopy = useCallback(() => {
    if (!fullUrl) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [fullUrl]);

  if (!sourceValue) {
    return (
      <div className="cs-permalink cs-permalink--empty">
        {sourceField === 'path'
          ? 'URL will appear once the page is saved.'
          : 'Permalink will appear once a slug is set.'}
      </div>
    );
  }

  return (
    <div className="cs-permalink">
      <div className="cs-permalink__label">
        <span>Permalink</span>
        <span
          className="cs-permalink__chip"
          data-tone={isLive ? 'live' : 'draft'}
        >
          <span className="cs-permalink__dot" aria-hidden="true" />
          {isLive ? 'Live' : 'Draft'}
        </span>
      </div>
      <div className="cs-permalink__row">
        <span className="cs-permalink__url" title={fullUrl}>
          {fullUrl}
        </span>
        <button
          type="button"
          className="cs-permalink__icon-btn"
          onClick={handleCopy}
          aria-label={copied ? 'URL copied' : 'Copy URL'}
          title={copied ? 'Copied!' : 'Copy URL'}
          data-state={copied ? 'success' : 'idle'}
        >
          <ClipboardIcon checked={copied} />
        </button>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cs-permalink__icon-btn"
          aria-label="Open URL in new tab"
          title="Open in new tab"
        >
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
};
