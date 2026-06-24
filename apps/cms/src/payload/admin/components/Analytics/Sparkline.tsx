import type { ReactElement } from 'react';

export function Sparkline({
  daily,
  color = '#8b7ff0',
}: {
  daily?: Array<{ date: string; sessions: number }> | undefined;
  color?: string;
}): ReactElement {
  if (!daily || daily.length < 2) return <span className="cs-analytics__spark-empty">—</span>;
  const W = 88;
  const H = 22;
  const P = 2;
  const max = Math.max(...daily.map((d) => d.sessions), 1);
  const x = (i: number): number => P + (i / (daily.length - 1)) * (W - 2 * P);
  const y = (v: number): number => H - P - (v / max) * (H - 2 * P);
  const line = daily.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.sessions).toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="cs-analytics__spark" aria-hidden="true">
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default Sparkline;
