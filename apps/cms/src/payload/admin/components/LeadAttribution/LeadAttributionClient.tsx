'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type { AttributionReport } from '../../../lib/lead-attribution/aggregate';
import { RefreshButton } from '../Analytics/RefreshButton';
import { SplitTable } from './SplitTable';
import { TrendBars } from './TrendBars';

interface LeadAttributionResponse {
  ok: boolean;
  range: { since: string | null; until: string | null };
  truncated?: boolean;
  report?: AttributionReport;
}

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

export function LeadAttributionClient(): ReactElement {
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [report, setReport] = useState<AttributionReport | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (from: string, to: string): Promise<void> => {
    setState('loading');
    try {
      const qs = new URLSearchParams();
      if (from) qs.set('since', from);
      if (to) qs.set('until', to);
      const res = await fetch(`/api/lead-attribution?${qs.toString()}`, {
        credentials: 'include',
      });
      const j = (await res.json()) as LeadAttributionResponse;
      if (!j.ok || !j.report) return setState('error');
      setReport(j.report);
      setTruncated(j.truncated ?? false);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  // Default to the trailing 30 days. Set on mount (not initial state) to avoid
  // an SSR/CSR hydration mismatch on the date values.
  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromStr = isoDate(from);
    const toStr = isoDate(now);
    setSince(fromStr);
    setUntil(toStr);
    void load(fromStr, toStr);
  }, [load]);

  const apply = useCallback((): void => {
    setRefreshing(true);
    void load(since, until).finally(() => setRefreshing(false));
  }, [load, since, until]);

  return (
    <div className="cs-analytics cs-lead-attribution">
      <header className="cs-analytics__head">
        <h1>Lead attribution</h1>
        <RefreshButton onClick={apply} busy={refreshing} updatedAt={null} />
      </header>

      <div className="cs-lead-attribution__filters">
        <label>
          From
          <input type="date" value={since} max={until || undefined} onChange={(e) => setSince(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={until} min={since || undefined} onChange={(e) => setUntil(e.target.value)} />
        </label>
        <button type="button" className="cs-analytics__refresh-btn" onClick={apply} disabled={refreshing}>
          Apply
        </button>
      </div>

      {state === 'loading' && <div className="cs-analytics__empty">Aggregating leads…</div>}
      {state === 'error' && (
        <div className="cs-analytics__empty">Couldn’t load lead attribution. Try again shortly.</div>
      )}
      {state === 'ready' && report && (
        <>
          <div className="cs-lead-attribution__kpi">
            <span className="cs-lead-attribution__kpi-value">{report.totalLeads.toLocaleString()}</span>
            <span className="cs-lead-attribution__kpi-label">leads in range</span>
          </div>
          {truncated && (
            <div className="cs-analytics__empty">
              Showing the most recent 50,000 leads — narrow the date range for a complete count.
            </div>
          )}
          <TrendBars points={report.daily} />
          <div className="cs-lead-attribution__grid">
            <SplitTable title="By channel" keyLabel="Channel" rows={report.byChannel} />
            <SplitTable title="By form" keyLabel="Form" rows={report.byForm} />
            <SplitTable title="Top campaigns" keyLabel="utm_campaign" rows={report.byUtmCampaign} />
            <SplitTable title="Top sources (last touch)" keyLabel="utm_source" rows={report.lastTouchSource} />
            <SplitTable title="Top sources (first touch)" keyLabel="First-touch source" rows={report.firstTouchSource} />
            <SplitTable title="By medium" keyLabel="utm_medium" rows={report.byUtmMedium} />
            <SplitTable title="Top landing pages" keyLabel="First landing page" rows={report.byLandingPage} />
          </div>
        </>
      )}
    </div>
  );
}

export default LeadAttributionClient;
