import type { ReactElement } from 'react';

interface Kpi {
  label: string;
  value: string;
  muted?: boolean;
  /** Percent change vs prior period; null/undefined renders no chip. */
  deltaPct?: number | null;
}

export function KpiCards({ items }: { items: Kpi[] }): ReactElement {
  return (
    <div className="cs-analytics__kpis">
      {items.map((k) => (
        <div key={k.label} className="cs-analytics__kpi">
          <div className="cs-analytics__kpi-label">{k.label}</div>
          <div className="cs-analytics__kpi-valuerow">
            <span className={`cs-analytics__kpi-value${k.muted ? ' is-muted' : ''}`}>{k.value}</span>
            {typeof k.deltaPct === 'number' && (
              <span
                className={`cs-analytics__kpi-delta${k.deltaPct >= 0 ? ' is-up' : ' is-down'}`}
                title="vs previous period"
              >
                {k.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(Math.round(k.deltaPct * 100))}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KpiCards;
