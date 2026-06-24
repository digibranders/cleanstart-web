import type { ReactElement } from 'react';

import type { SplitRow } from '../../../lib/dashboards/overview-types';

export function Split({ title, rows }: { title: string; rows: SplitRow[] }): ReactElement {
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <div className="cs-analytics__panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No data.</div>
      ) : (
        <div className="cs-analytics__bars">
          {rows.map((r) => (
            <div key={r.label} className="cs-analytics__bar-row">
              <span className="cs-analytics__bar-label">{r.label || '(none)'}</span>
              <span className="cs-analytics__bar-track">
                <span className="cs-analytics__bar-fill" style={{ width: `${Math.round((r.sessions / max) * 100)}%` }} />
              </span>
              <span className="cs-analytics__bar-val">{r.sessions.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Split;
