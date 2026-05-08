'use client';

import type { ReactElement } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

import {
  formatRelativeDate,
  useDocPublicUrl,
  type RedirectRow,
} from './_redirects-shared';

type UrlChangeHistoryFieldProps = {
  pathPrefix?: string;
  sourceField?: string;
};

interface FetchState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  rows: readonly RedirectRow[];
  error?: string;
}

/**
 * Read-only timeline of `slug-change` redirects routing into this
 * page — i.e. every URL this doc has ever lived at, in chronological
 * order. Generated entirely from the `Redirects` collection rows
 * created automatically by the slug-change hook on republish.
 *
 * Why a separate panel:
 *  - Inbound redirects mixes manual + slug-change rows; editors need
 *    a quick "where did this page used to live?" view that's not
 *    polluted by promotional / vanity rules.
 *  - During migrations or re-orgs, this is the canonical answer to
 *    "wait, why is this URL different from when I last looked?" —
 *    cheap to build, high signal.
 *
 * Auto-collapsed by default (most pages have zero slug-change rows).
 * Each row deep-links to the underlying Redirects entry for editors
 * who want to inspect or annotate.
 */
export const UrlChangeHistoryField = (
  props: UrlChangeHistoryFieldProps,
): ReactElement | null => {
  const { pathPrefix = '', sourceField = 'slug' } = props;
  const headingId = useId();
  const { publicUrl, sitePath } = useDocPublicUrl({ pathPrefix, sourceField });

  const [fetchState, setFetchState] = useState<FetchState>({
    status: 'idle',
    rows: [],
  });
  const [expanded, setExpanded] = useState(false);

  const queryUrl = useMemo(() => {
    if (!publicUrl) return null;
    const params = new URLSearchParams();
    params.set('where[and][0][source][equals]', 'slug-change');
    params.set('where[and][1][or][0][to][equals]', publicUrl);
    if (sitePath) {
      params.set('where[and][1][or][1][to][equals]', sitePath);
    }
    params.set('sort', '-createdAt');
    params.set('limit', '20');
    return `/api/redirects?${params.toString()}`;
  }, [publicUrl, sitePath]);

  useEffect(() => {
    if (!queryUrl) {
      setFetchState({ status: 'idle', rows: [] });
      return undefined;
    }

    let cancelled = false;
    setFetchState((s) => ({ status: 'loading', rows: s.rows }));

    fetch(queryUrl, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ docs?: RedirectRow[] }>;
      })
      .then((body) => {
        if (cancelled) return;
        const rows = Array.isArray(body.docs) ? body.docs : [];
        setFetchState({ status: 'ok', rows });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setFetchState({ status: 'error', rows: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [queryUrl]);

  if (!publicUrl) return null;

  const count = fetchState.rows.length;

  const summaryText = (() => {
    if (fetchState.status === 'loading') return 'Checking…';
    if (fetchState.status === 'error') return 'Failed to load';
    if (count === 0) return 'No URL changes';
    if (count === 1) return '1 previous URL';
    return `${count} previous URLs`;
  })();

  return (
    <div
      className="cs-url-history"
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className="cs-url-history__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="cs-url-history__title">URL history</span>
        <span
          className="cs-url-history__summary"
          data-tone={
            fetchState.status === 'error'
              ? 'error'
              : count > 0
                ? 'active'
                : 'muted'
          }
        >
          {summaryText}
        </span>
        <span className="cs-url-history__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {expanded && (
        <div id={headingId} className="cs-url-history__body">
          {fetchState.status === 'error' && (
            <p
              className="cs-url-history__hint"
              style={{ color: 'var(--color-error-500, #ff5c5c)' }}
            >
              Couldn’t load history: {fetchState.error ?? 'unknown error'}
            </p>
          )}

          {fetchState.status === 'ok' && count === 0 && (
            <p className="cs-url-history__hint">
              This page hasn&rsquo;t changed URLs since it was first published.
              The slug-change hook auto-creates an entry here whenever an
              editor renames the slug of a published doc.
            </p>
          )}

          {count > 0 && (
            <>
              <p className="cs-url-history__hint">
                Auto-emitted by the slug-change hook every time the URL
                changed on a published version. Each previous URL still
                resolves via 301 to the current one.
              </p>
              <ol className="cs-url-history__list">
                {fetchState.rows.map((row) => (
                  <li key={String(row.id)} className="cs-url-history__row">
                    <a
                      href={`/admin/collections/redirects/${encodeURIComponent(String(row.id))}`}
                      className="cs-url-history__row-link"
                      title="Open underlying redirect rule"
                    >
                      <div className="cs-url-history__row-top">
                        <code className="cs-url-history__from">{row.from}</code>
                        <span className="cs-url-history__arrow" aria-hidden="true">
                          →
                        </span>
                        <code className="cs-url-history__to">{row.to ?? ''}</code>
                      </div>
                      <div className="cs-url-history__row-meta">
                        <span>{row.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeDate(row.createdAt)}</span>
                        {(row.hitCount ?? 0) > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{row.hitCount} hits</span>
                          </>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
};
