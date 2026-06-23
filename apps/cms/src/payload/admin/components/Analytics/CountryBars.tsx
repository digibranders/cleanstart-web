import type { ReactElement } from 'react';

export function CountryBars({ rows }: { rows: Array<{ country: string; sessions: number }> }): ReactElement {
  if (rows.length === 0) return <div className="cs-analytics__empty">No country data.</div>;
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <div className="cs-analytics__bars">
      {rows.map((r) => (
        <div key={r.country} className="cs-analytics__bar-row">
          <span className="cs-analytics__bar-label">{r.country}</span>
          <span className="cs-analytics__bar-track">
            <span className="cs-analytics__bar-fill" style={{ width: `${Math.round((r.sessions / max) * 100)}%` }} />
          </span>
          <span className="cs-analytics__bar-val">{r.sessions.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default CountryBars;
