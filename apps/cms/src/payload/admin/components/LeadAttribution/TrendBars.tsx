import type { ReactElement } from 'react';

import type { DailyPoint } from '../../../lib/lead-attribution/aggregate';

/** Simple daily-volume column chart — leads captured per day in the window. */
export function TrendBars({ points }: { points: DailyPoint[] }): ReactElement {
  const max = points.reduce((m, p) => Math.max(m, p.count), 0);
  return (
    <section className="cs-analytics__panel">
      <h3>Leads per day</h3>
      {points.length === 0 ? (
        <div className="cs-analytics__empty">No leads in the selected window.</div>
      ) : (
        <div className="cs-lead-attribution__trend">
          {points.map((p) => (
            <div
              key={p.date}
              className="cs-lead-attribution__trend-col"
              title={`${p.date}: ${p.count.toLocaleString()}`}
            >
              <span
                className="cs-lead-attribution__trend-bar"
                style={{ height: `${max > 0 ? (p.count / max) * 100 : 0}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TrendBars;
