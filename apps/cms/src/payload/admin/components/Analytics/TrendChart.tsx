import type { ReactElement } from 'react';

interface Point {
  date: string;
  sessions: number;
}

export function TrendChart({ daily, color = '#8b7ff0' }: { daily: Point[]; color?: string }): ReactElement {
  const W = 640;
  const H = 180;
  const P = 8;
  if (daily.length < 2) return <div className="cs-analytics__empty">Not enough data yet.</div>;
  const max = Math.max(...daily.map((d) => d.sessions), 1);
  const x = (i: number): number => P + (i / (daily.length - 1)) * (W - 2 * P);
  const y = (v: number): number => H - P - (v / max) * (H - 2 * P);
  const line = daily.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.sessions).toFixed(1)}`).join(' ');
  const area = `${line} L${x(daily.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={`Sessions over the last ${daily.length} days`}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={area} fill={color} fillOpacity={0.14} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

export default TrendChart;
