'use client';

import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';

interface Point {
  date: string;
  sessions: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "20260603" → "Jun 3". GA4 daily dates are YYYYMMDD strings.
const fmtDate = (d: string): string => {
  if (d.length !== 8) return d;
  const month = MONTHS[Number(d.slice(4, 6)) - 1] ?? '';
  return `${month} ${Number(d.slice(6, 8))}`;
};

const fmtCompact = (n: number): string => {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(Math.round(n));
};

// Round the axis maximum up to a "nice" number and return evenly spaced ticks
// (the 0, 25%, 50%, 75%, 100% gridline values) — standard axis quantisation.
const niceScale = (max: number): { top: number; ticks: number[] } => {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const rough = max / 4;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { top, ticks };
};

export function TrendChart({
  daily,
  color = '#8b7ff0',
}: {
  daily: Point[];
  color?: string;
}): ReactElement {
  const gradId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (daily.length < 2) return <div className="cs-analytics__empty">Not enough data yet.</div>;

  const W = 1000;
  const H = 280;
  const mL = 48;
  const mR = 16;
  const mT = 16;
  const mB = 34;
  const plotL = mL;
  const plotR = W - mR;
  const plotT = mT;
  const plotB = H - mB;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  const rawMax = Math.max(...daily.map((d) => d.sessions), 1);
  const { top, ticks } = niceScale(rawMax);

  const x = (i: number): number => plotL + (i / (daily.length - 1)) * plotW;
  const y = (v: number): number => plotB - (v / top) * plotH;

  const line = daily
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.sessions).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${x(daily.length - 1).toFixed(1)},${plotB} L${plotL.toFixed(1)},${plotB} Z`;

  // Show ~6 x-axis date labels, always including the first and last day.
  const xStep = Math.max(1, Math.ceil((daily.length - 1) / 5));
  const xTickIdx: number[] = [];
  for (let i = 0; i < daily.length; i += xStep) xTickIdx.push(i);
  if (xTickIdx[xTickIdx.length - 1] !== daily.length - 1) xTickIdx.push(daily.length - 1);

  const total = daily.reduce((s, d) => s + d.sessions, 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (px - plotL) / plotW;
    const idx = Math.round(ratio * (daily.length - 1));
    setHover(Math.min(daily.length - 1, Math.max(0, idx)));
  };

  const hoverPoint = hover === null ? null : daily[hover];
  const last = daily[daily.length - 1];

  return (
    <div className="cs-analytics__chart">
      <div className="cs-analytics__legend">
        <span className="cs-analytics__legend-item">
          <span className="cs-analytics__legend-swatch" style={{ background: color }} aria-hidden="true" />
          Sessions
        </span>
        <span className="cs-analytics__legend-total">{total.toLocaleString()} total</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="cs-analytics__chart-svg"
        role="img"
        aria-label={`Sessions per day over the last ${daily.length} days`}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={plotL}
              y1={y(t)}
              x2={plotR}
              y2={y(t)}
              className="cs-analytics__chart-grid"
              vectorEffect="non-scaling-stroke"
            />
            <text x={plotL - 8} y={y(t) + 3.5} className="cs-analytics__chart-ylabel" textAnchor="end">
              {fmtCompact(t)}
            </text>
          </g>
        ))}

        {xTickIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={plotB + 20}
            className="cs-analytics__chart-xlabel"
            textAnchor={i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'}
          >
            {fmtDate(daily[i]?.date ?? '')}
          </text>
        ))}

        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {last && <circle cx={x(daily.length - 1)} cy={y(last.sessions)} r={3.5} fill={color} />}

        {hoverPoint && (
          <g>
            <line
              x1={x(hover ?? 0)}
              y1={plotT}
              x2={x(hover ?? 0)}
              y2={plotB}
              className="cs-analytics__chart-cursor"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={x(hover ?? 0)}
              cy={y(hoverPoint.sessions)}
              r={4}
              fill={color}
              stroke="var(--theme-input-bg)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>

      {hoverPoint && (
        <div className="cs-analytics__chart-tip" aria-hidden="true">
          <span className="cs-analytics__chart-tip-date">{fmtDate(hoverPoint.date)}</span>
          <span className="cs-analytics__chart-tip-val">{hoverPoint.sessions.toLocaleString()} sessions</span>
        </div>
      )}
    </div>
  );
}

export default TrendChart;
