import type { ReactElement } from 'react';

import type { LowCtrRow } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();
const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const pos = (n: number): string => n.toFixed(1);

export function LowCtr({ rows }: { rows: LowCtrRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Low CTR for position</h3>
      <p className="cs-content-insights__section-note">
        Queries earning fewer clicks than their rank should — usually a weak title or meta description. Rewrite
        to win the clicks already on the table.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No under-performing queries in the window.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--lc">
            <span>Query</span>
            <span className="is-right">Pos</span>
            <span className="is-right">CTR</span>
            <span className="is-right">Expected</span>
            <span className="is-right">Missed</span>
          </div>
          {rows.map((r) => (
            <div key={r.query} className="cs-content-insights__trow cs-content-insights__trow--lc">
              <span className="is-primary">{r.query}</span>
              <span className="is-right">{pos(r.position)}</span>
              <span className="is-right is-loss">{pct(r.ctr)}</span>
              <span className="is-right">{pct(r.expectedCtr)}</span>
              <span className="is-right">{fmt(r.missedClicks)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default LowCtr;
