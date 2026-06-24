'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type { CruxPayload, CruxRecord, CwvMetric } from '../../../lib/dashboards/overview-types';

type LoadState = 'loading' | 'ready' | 'unconfigured' | 'error';

const fmtMetric = (m: CwvMetric | null, unit: 'ms' | ''): string => {
  if (!m) return '—';
  return unit === 'ms' ? `${Math.round(m.p75)} ms` : m.p75.toFixed(2);
};

const Tile = ({ label, metric, unit }: { label: string; metric: CwvMetric | null; unit: 'ms' | '' }): ReactElement => (
  <div className={`cs-analytics__cwv-tile${metric ? ` is-${metric.rating}` : ''}`}>
    <div className="cs-analytics__cwv-metric">{label}</div>
    <div className="cs-analytics__cwv-value">{fmtMetric(metric, unit)}</div>
  </div>
);

const RecordCard = ({ rec }: { rec: CruxRecord }): ReactElement => (
  <div className="cs-analytics__panel">
    <h3>
      {rec.scope === 'origin' ? 'Whole site' : rec.scope} · {rec.formFactor === 'PHONE' ? 'Mobile' : 'Desktop'}
    </h3>
    <div className="cs-analytics__cwv-tiles">
      <Tile label="LCP" metric={rec.lcp} unit="ms" />
      <Tile label="INP" metric={rec.inp} unit="ms" />
      <Tile label="CLS" metric={rec.cls} unit="" />
    </div>
  </div>
);

export function WebVitals(): ReactElement {
  const [data, setData] = useState<CruxPayload | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboards/crux', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) return setState('error');
        if (!j.configured) return setState('unconfigured');
        setData(j.payload as CruxPayload);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="cs-analytics__head">
        <h2>Core Web Vitals · field data (CrUX)</h2>
      </header>
      {state === 'loading' && <div className="cs-analytics__empty">Loading…</div>}
      {state === 'error' && <div className="cs-analytics__empty">Couldn’t load Core Web Vitals.</div>}
      {state === 'unconfigured' && (
        <div className="cs-analytics__empty">
          Needs setup — set <strong>CRUX_API_KEY</strong> (a Google Cloud API key with the Chrome UX Report API
          enabled, free) to see real-user LCP / INP / CLS here. This section activates automatically once the key is set.
        </div>
      )}
      {state === 'ready' && data && (
        data.records.length === 0 ? (
          <div className="cs-analytics__empty">No CrUX field data available for this site yet.</div>
        ) : (
          <div className="cs-analytics__cols">
            {data.records.map((rec) => (
              <RecordCard key={`${rec.scope}:${rec.formFactor}`} rec={rec} />
            ))}
          </div>
        )
      )}
    </>
  );
}

export default WebVitals;
