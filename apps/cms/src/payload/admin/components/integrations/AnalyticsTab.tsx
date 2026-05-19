'use client';

import { useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Per-document Analytics tab (Phase J2 L2).
 *
 * Mounted as a custom UI field on Pages, Blogs, News, Guides,
 * Resources, KnowledgeBase, Webinars, Events. Reads:
 *   - GA4 sparkline / totals from the cached global payload
 *     (one cached row covers the property; per-URL filtering is
 *     a J3+ refinement)
 *   - GSC top queries per URL via the on-demand per-doc endpoint
 *   - GSC URL Inspection on a button click
 *   - Clarity worst-pages from the cached global payload, filtered
 *     to this URL when available
 *
 * All reads are cache-or-on-demand — never blocks the editor on a
 * live external API call (URL Inspection is the only exception and
 * fires on explicit click).
 */

interface GscQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface InspectionResult {
  indexStatus?: string;
  coverageState?: string;
  lastCrawlTime?: string;
  mobileUsability?: string;
  richResultsState?: string;
}

interface ClarityUrlRow {
  url: string;
  deadClicks?: number;
  rageClicks?: number;
  scrollDepth?: number;
}

interface ClarityPayload {
  worstByDeadClicks?: ClarityUrlRow[];
  worstByRageClicks?: ClarityUrlRow[];
}

interface Ga4Payload {
  sessions: number;
  totalUsers: number;
  conversions: number;
  engagementRate: number;
  daily: Array<{ date: string; sessions: number }>;
}

interface CardResponse<T> {
  ok: boolean;
  hasData: boolean;
  configured?: boolean;
  stale?: boolean;
  capturedAt?: string;
  payload?: T;
}

interface GscQueriesResponse {
  ok: boolean;
  hasData: boolean;
  configured: boolean;
  inspectionConfigured: boolean;
  queries: GscQuery[];
}

const useDocUrl = (): string | null => {
  const slug = useFormFields(([fields]) => {
    const f = fields?.slug?.value;
    return typeof f === 'string' ? f : null;
  });
  return useMemo(() => {
    if (!slug) return null;
    const base =
      (typeof window !== 'undefined' && window.location.origin.replace(/\/admin.*/, '')) ||
      'https://cleanstart.com';
    return `${base.replace(/\/+$/, '')}/${slug.replace(/^\/+/, '')}`;
  }, [slug]);
};

const Sparkline = ({
  values,
}: {
  values: ReadonlyArray<number>;
}): ReactElement | null => {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const width = 220;
  const height = 36;
  const step = width / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(' ');
  return (
    <svg
      role="img"
      aria-label="28-day sessions sparkline"
      viewBox={`0 0 ${width} ${height}`}
      className="cs-analytics-tab__sparkline"
    >
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
    </svg>
  );
};

export const AnalyticsTab = (): ReactElement | null => {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const url = useDocUrl();

  const [ga4, setGa4] = useState<CardResponse<Ga4Payload> | null>(null);
  const [clarity, setClarity] = useState<CardResponse<ClarityPayload> | null>(null);
  const [gsc, setGsc] = useState<GscQueriesResponse | null>(null);
  const [inspect, setInspect] = useState<InspectionResult | null | 'loading'>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [g, c] = await Promise.all([
          fetch(`${serverURL}/api/dashboards/ga4DataApi`, { credentials: 'include' }).then(
            (r) => r.json() as Promise<CardResponse<Ga4Payload>>,
          ),
          fetch(`${serverURL}/api/dashboards/msClarity`, { credentials: 'include' }).then(
            (r) => r.json() as Promise<CardResponse<ClarityPayload>>,
          ),
        ]);
        if (cancelled) return;
        setGa4(g);
        setClarity(c);
      } catch {
        if (!cancelled) {
          setGa4({ ok: false, hasData: false });
          setClarity({ ok: false, hasData: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, serverURL]);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${serverURL}/api/dashboards/per-doc/gsc-queries?url=${encodeURIComponent(url)}`,
          { credentials: 'include' },
        );
        const body = (await res.json()) as GscQueriesResponse;
        if (!cancelled) setGsc(body);
      } catch {
        if (!cancelled)
          setGsc({
            ok: false,
            hasData: false,
            configured: false,
            inspectionConfigured: false,
            queries: [],
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, serverURL]);

  const handleInspect = useCallback(async () => {
    if (!url) return;
    setInspect('loading');
    try {
      const res = await fetch(`${serverURL}/api/dashboards/per-doc/gsc-inspect`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const body = (await res.json()) as { result?: InspectionResult | null };
      setInspect(body.result ?? null);
    } catch {
      setInspect(null);
    }
  }, [url, serverURL]);

  if (!id) {
    return (
      <div className="cs-analytics-tab cs-analytics-tab--empty">
        Save the document first to see analytics.
      </div>
    );
  }

  const ga4Body = ga4?.hasData ? ga4.payload : null;
  const clarityRow =
    url && clarity?.payload?.worstByDeadClicks?.find((r) => r.url === url);

  // Hide each section when its integration isn't configured + enabled.
  // While the request is in flight `configured` is undefined → section
  // stays hidden, so editors never see a flash of empty scaffolding
  // before the response arrives. When none of the three resolve to
  // configured, the whole panel collapses to nothing.
  const showGa4 = ga4?.configured === true;
  const showGsc = gsc?.configured === true;
  const showClarity = clarity?.configured === true;

  if (!showGa4 && !showGsc && !showClarity) {
    return null;
  }

  return (
    <div className="cs-analytics-tab">
      {showGa4 ? (
      <section className="cs-analytics-tab__section" aria-label="GA4 last 28 days">
        <h3 className="cs-analytics-tab__heading">
          Google Analytics — last 28 days
          {ga4?.stale ? <span className="cs-analytics-tab__stale"> · stale</span> : null}
        </h3>
        {ga4Body ? (
          <>
            <dl className="cs-analytics-tab__metrics">
              <div>
                <dt>Sessions</dt>
                <dd>{ga4Body.sessions.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Users</dt>
                <dd>{ga4Body.totalUsers.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Engagement</dt>
                <dd>{Math.round(ga4Body.engagementRate * 100)}%</dd>
              </div>
              <div>
                <dt>Conversions</dt>
                <dd>{ga4Body.conversions.toLocaleString()}</dd>
              </div>
            </dl>
            <Sparkline values={ga4Body.daily.map((d) => d.sessions)} />
          </>
        ) : (
          <p className="cs-analytics-tab__empty">No GA4 data cached yet — the next cron tick will populate it.</p>
        )}
      </section>
      ) : null}

      {showGsc ? (
      <section className="cs-analytics-tab__section" aria-label="GSC top queries">
        <h3 className="cs-analytics-tab__heading">Top Google Search queries</h3>
        {gsc === null ? (
          <p className="cs-analytics-tab__empty">Loading…</p>
        ) : gsc.queries.length === 0 ? (
          <p className="cs-analytics-tab__empty">
            No impressions recorded for this URL in the last 28 days.
          </p>
        ) : (
          <table className="cs-analytics-tab__table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Impr.</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Pos</th>
              </tr>
            </thead>
            <tbody>
              {gsc.queries.map((q) => (
                <tr key={q.query}>
                  <td>{q.query}</td>
                  <td>{q.impressions.toLocaleString()}</td>
                  <td>{q.clicks.toLocaleString()}</td>
                  <td>{Math.round(q.ctr * 100)}%</td>
                  <td>{q.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="cs-analytics-tab__inspect">
          {gsc?.inspectionConfigured ? (
          <button
            type="button"
            className="cs-btn cs-btn--subtle"
            onClick={handleInspect}
            disabled={!url || inspect === 'loading'}
          >
            {inspect === 'loading' ? 'Inspecting…' : 'Inspect URL in GSC'}
          </button>
          ) : null}
          {inspect && inspect !== 'loading' ? (
            <dl className="cs-analytics-tab__inspection">
              <div>
                <dt>Index status</dt>
                <dd>{inspect.indexStatus ?? '—'}</dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd>{inspect.coverageState ?? '—'}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{inspect.mobileUsability ?? '—'}</dd>
              </div>
              <div>
                <dt>Rich results</dt>
                <dd>{inspect.richResultsState ?? '—'}</dd>
              </div>
            </dl>
          ) : inspect === null && url ? null : null}
        </div>
      </section>
      ) : null}

      {showClarity ? (
      <section className="cs-analytics-tab__section" aria-label="MS Clarity UX signals">
        <h3 className="cs-analytics-tab__heading">
          UX signals (MS Clarity)
          {clarity?.stale ? <span className="cs-analytics-tab__stale"> · stale</span> : null}
        </h3>
        {clarityRow ? (
          <dl className="cs-analytics-tab__metrics">
            <div>
              <dt>Dead clicks</dt>
              <dd>{(clarityRow.deadClicks ?? 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Rage clicks</dt>
              <dd>{(clarityRow.rageClicks ?? 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Scroll depth</dt>
              <dd>
                {typeof clarityRow.scrollDepth === 'number'
                  ? `${Math.round(clarityRow.scrollDepth)}%`
                  : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="cs-analytics-tab__empty">
            No Clarity signals for this URL yet. Aggregates refresh daily.
          </p>
        )}
      </section>
      ) : null}
    </div>
  );
};

export default AnalyticsTab;
