'use client';

import { useDocumentInfo, useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

type DocHeaderProps = {
  /** Show the publishedAt timestamp. */
  showPublishedAt?: boolean;
  /** Show the wordCount + readingMinutes pair. */
  showStats?: boolean;
  /**
   * Field whose value drives the document title in the header. Defaults
   * to `title`. Pass `'name'` for collections like Authors where the
   * primary identifier sits on `name`.
   */
  titleField?: string;
};

const formatRelative = (iso: string | Date | null | undefined): string => {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return '—';
  const diffSec = Math.round((Date.now() - ms) / 1000);
  if (diffSec < 45) return 'just now';
  if (diffSec < 60 * 60) return `${Math.round(diffSec / 60)} min ago`;
  if (diffSec < 60 * 60 * 24) return `${Math.round(diffSec / 3600)} h ago`;
  if (diffSec < 60 * 60 * 24 * 7) return `${Math.round(diffSec / 86400)} d ago`;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatPublished = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Custom document header. Mounted via
 * `admin.components.edit.beforeDocumentControls` and combined with CSS
 * that hides Payload's native title + tab strip — together replacing
 * the four-row default chrome (breadcrumb · title+tabs · status meta ·
 * actions) with a single dense strip:
 *
 *   [●LIVE  Title              meta inline]   [Versions · API · (Preview)] [Save Draft] [Publish] [⋮]
 *
 * The native Save / Publish / kebab buttons are untouched — Payload
 * still owns those state machines. Versions and API tabs are rendered
 * by Payload as part of the (now-hidden) tab strip; we restyle them
 * via SCSS to look like inline auxiliary links instead of full tabs.
 */
export const DocHeader = (props: DocHeaderProps): ReactElement => {
  const { showPublishedAt = true, showStats = false, titleField = 'title' } = props;

  const { id } = useDocumentInfo();
  const { value: docTitle } = useField<string>({ path: titleField });
  const { value: status } = useField<string>({ path: '_status' });
  const { value: updatedAt } = useField<string>({ path: 'updatedAt' });
  const { value: publishedAt } = useField<string>({ path: 'publishedAt' });
  const { value: wordCount } = useField<number>({ path: 'wordCount' });
  const { value: readingMinutes } = useField<number>({ path: 'readingMinutes' });

  const isLive = status === 'published';
  const updatedLabel = useMemo(() => formatRelative(updatedAt), [updatedAt]);
  const publishedLabel = useMemo(() => formatPublished(publishedAt), [publishedAt]);

  const words = typeof wordCount === 'number' ? wordCount : 0;
  const minutes = typeof readingMinutes === 'number' ? readingMinutes : 0;
  const hasStats = showStats && (words > 0 || minutes > 0);

  // For new docs (no id yet) the title field can briefly be empty;
  // fall back to "Untitled" so the header doesn't collapse to zero
  // height before the first character is typed.
  const title =
    typeof docTitle === 'string' && docTitle.trim().length > 0
      ? docTitle
      : id == null
        ? 'New document'
        : 'Untitled';

  return (
    <div className="cs-doc-header">
      <div className="cs-doc-header__top">
        <span
          className="cs-doc-header__badge"
          data-tone={isLive ? 'live' : 'draft'}
          title={isLive ? 'Published — visible on the public site.' : 'Draft — not yet visible on the public site.'}
        >
          <span className="cs-doc-header__badge-dot" aria-hidden="true" />
          {isLive ? 'Published' : 'Draft'}
        </span>
        <h1 className="cs-doc-header__title" title={title}>
          {title}
        </h1>
      </div>
      <ul className="cs-doc-header__meta" aria-label="Document timestamps and stats">
        <li title={typeof updatedAt === 'string' ? updatedAt : undefined}>
          <span className="cs-doc-header__meta-label">Modified</span>
          <span className="cs-doc-header__meta-value">{updatedLabel}</span>
        </li>
        {showPublishedAt ? (
          <li title={typeof publishedAt === 'string' ? publishedAt : undefined}>
            <span className="cs-doc-header__meta-label">Published</span>
            <span className="cs-doc-header__meta-value">{publishedLabel}</span>
          </li>
        ) : null}
        {showStats ? (
          <>
            <li title="Total words in the body. Computed on save.">
              <span className="cs-doc-header__meta-value">
                {hasStats ? words.toLocaleString() : '—'}
              </span>
              <span className="cs-doc-header__meta-label">words</span>
            </li>
            <li title="Estimated reading time. Computed from word count on save.">
              <span className="cs-doc-header__meta-value">
                {hasStats ? `${minutes} min` : '—'}
              </span>
              <span className="cs-doc-header__meta-label">read</span>
            </li>
          </>
        ) : null}
      </ul>
    </div>
  );
};

export default DocHeader;
