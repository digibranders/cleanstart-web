import type { ReactElement } from 'react';

import type { PositionBucket } from '../../../lib/dashboards/overview-types';

export function PositionHistogram({
  buckets,
  color = '#8b7ff0',
}: {
  buckets: PositionBucket[];
  color?: string;
}): ReactElement {
  if (buckets.length === 0) return <div className="cs-analytics__empty">No query data yet.</div>;
  const W = 320;
  const H = 160;
  const pad = { l: 8, r: 8, t: 12, b: 24 };
  const plotH = H - pad.t - pad.b;
  const plotW = W - pad.l - pad.r;
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const barW = plotW / buckets.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cs-analytics__chart-svg" role="img" aria-label="Query position distribution">
      {buckets.map((b, i) => {
        const h = (b.count / max) * plotH;
        const x = pad.l + i * barW + barW * 0.18;
        const w = barW * 0.64;
        const y = pad.t + (plotH - h);
        return (
          <g key={b.label}>
            <rect x={x} y={y} width={w} height={h} rx={3} fill={color} />
            <text x={x + w / 2} y={y - 4} textAnchor="middle" className="cs-analytics__chart-ylabel">
              {b.count}
            </text>
            <text x={x + w / 2} y={H - 8} textAnchor="middle" className="cs-analytics__chart-xlabel">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default PositionHistogram;
