import type { ReactElement } from 'react';

import type { VelocityBucket } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();

export function VelocityPanel({ buckets }: { buckets: VelocityBucket[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>New-content velocity</h3>
      <p className="cs-content-insights__section-note">
        Average sessions per doc by publish recency — how recent posts perform vs the back catalog.
      </p>
      <div className="cs-analytics__kpis">
        {buckets.map((b) => (
          <div key={b.label} className="cs-analytics__kpi">
            <div className="cs-analytics__kpi-label">
              {b.label} · {fmt(b.docCount)} docs
            </div>
            <div className="cs-analytics__kpi-value">{fmt(b.avgSessions)}</div>
            <div className="cs-content-insights__section-note">avg sessions / doc</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default VelocityPanel;
