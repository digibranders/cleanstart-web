import type { ReactElement } from 'react';

interface Kpi {
  label: string;
  value: string;
  muted?: boolean;
}

export function KpiCards({ items }: { items: Kpi[] }): ReactElement {
  return (
    <div className="cs-analytics__kpis">
      {items.map((k) => (
        <div key={k.label} className="cs-analytics__kpi">
          <div className="cs-analytics__kpi-label">{k.label}</div>
          <div className={`cs-analytics__kpi-value${k.muted ? ' is-muted' : ''}`}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}

export default KpiCards;
