import type { ReactElement } from 'react';

import type { StrikingDistanceRow } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();
const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const pos = (n: number): string => n.toFixed(1);

export function StrikingDistance({ rows }: { rows: StrikingDistanceRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Striking-distance queries</h3>
      <p className="cs-content-insights__section-note">
        Queries ranking positions 5–15 with high impressions — small ranking gains here convert to real clicks.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No striking-distance queries in the window.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--sd">
            <span>Query</span>
            <span className="is-right">Pos</span>
            <span className="is-right">Impr.</span>
            <span className="is-right">Clicks</span>
            <span className="is-right">CTR</span>
          </div>
          {rows.map((r) => (
            <div key={r.query} className="cs-content-insights__trow cs-content-insights__trow--sd">
              <span className="is-primary">{r.query}</span>
              <span className="is-right">{pos(r.position)}</span>
              <span className="is-right">{fmt(r.impressions)}</span>
              <span className="is-right">{fmt(r.clicks)}</span>
              <span className="is-right">{pct(r.ctr)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default StrikingDistance;
