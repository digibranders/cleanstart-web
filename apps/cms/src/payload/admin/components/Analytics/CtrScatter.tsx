import type { ReactElement } from 'react';

import type { ScatterPoint } from '../../../lib/dashboards/overview-types';

export function CtrScatter({
  points,
  color = '#8b7ff0',
}: {
  points: ScatterPoint[];
  color?: string;
}): ReactElement {
  if (points.length === 0) return <div className="cs-analytics__empty">No query data yet.</div>;
  const W = 320;
  const H = 200;
  const pad = { l: 34, r: 10, t: 12, b: 28 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const maxPos = Math.min(30, Math.max(...points.map((p) => p.position), 10));
  const maxCtr = Math.max(...points.map((p) => p.ctr), 0.05);
  const maxImpr = Math.max(...points.map((p) => p.impressions), 1);

  // x = position (1 at left → maxPos at right); y = ctr (top = high)
  const x = (pos: number): number => pad.l + (Math.min(pos, maxPos) / maxPos) * plotW;
  const y = (ctr: number): number => pad.t + plotH - (ctr / maxCtr) * plotH;
  const r = (impr: number): number => 2 + Math.sqrt(impr / maxImpr) * 5;

  const yTicks = [0, maxCtr / 2, maxCtr];
  const xTicks = [1, Math.round(maxPos / 2), maxPos];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cs-analytics__chart-svg" role="img" aria-label="CTR vs position scatter">
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={pad.l} y1={y(t)} x2={W - pad.r} y2={y(t)} className="cs-analytics__chart-grid" vectorEffect="non-scaling-stroke" />
          <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" className="cs-analytics__chart-ylabel">
            {`${Math.round(t * 100)}%`}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={x(t)} y={H - 8} textAnchor="middle" className="cs-analytics__chart-xlabel">
          {t}
        </text>
      ))}
      {points.map((p, i) => (
        <circle
          key={`${p.position}-${p.ctr}-${p.impressions}-${i}`}
          cx={x(p.position)}
          cy={y(p.ctr)}
          r={r(p.impressions)}
          fill={color}
          fillOpacity={0.45}
        />
      ))}
    </svg>
  );
}

export default CtrScatter;
