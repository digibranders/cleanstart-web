import { area, line } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { ChartFrame, Svg } from "./frame";
import { evenIndices, formatCompact, maxOf, niceMax, niceTicks } from "./geometry";
import { ACCENT, categorical, GRID, INK, MUTED_MARK, SURFACE } from "./palette";

export interface LineSeries {
  key: string;
  label: string;
  color?: string;
  /** One value per x label. */
  values: readonly number[];
}

/**
 * Trend over time: 2px lines, optional 10% area wash, end dot with the latest value, and a crosshair column per x.
 * The crosshair and tooltip are pure CSS and focus: every x is a focusable column that lists every series.
 */
export function Line({
  title,
  description,
  labels,
  series,
  withArea = false,
  format = formatCompact,
}: {
  title: string;
  description: string;
  labels: readonly string[];
  series: readonly LineSeries[];
  withArea?: boolean;
  format?: (n: number) => string;
}): React.JSX.Element {
  const W = 480;
  const H = 220;
  const M = { top: 14, right: 44, bottom: 26, left: 40 };
  const n = labels.length;
  const colors = series.map((s, i) => s.color ?? categorical(i));
  const top = niceMax(maxOf(series.flatMap((s) => [...s.values])));
  const x = scaleLinear().domain([0, Math.max(1, n - 1)]).range([M.left, W - M.right]);
  const y = scaleLinear().domain([0, top]).range([H - M.bottom, M.top]);
  const path = line<number>().x((_, i) => x(i)).y((v) => y(v));
  const wash = area<number>().x((_, i) => x(i)).y0(y(0)).y1((v) => y(v));
  const step = n > 1 ? (W - M.left - M.right) / (n - 1) : W - M.left - M.right;

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={series.map((s, i) => ({ label: s.label, color: colors[i] ?? categorical(i) }))}
      table={{
        head: ["Period", ...series.map((s) => s.label)],
        rows: labels.map((l, i) => [l, ...series.map((s) => format(s.values[i] ?? 0))]),
      }}
    >
      <Svg width={W} height={H} label={title}>
        {niceTicks(top).map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={M.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={INK.muted} className="tnum">
              {formatCompact(t)}
            </text>
          </g>
        ))}
        {series.map((s, k) => (
          <g key={s.key}>
            {withArea ? <path d={wash([...s.values]) ?? ""} fill={colors[k]} fillOpacity={0.1} /> : null}
            <path d={path([...s.values]) ?? ""} fill="none" stroke={colors[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {series.map((s, k) => {
          const last = s.values[n - 1];
          return last === undefined ? null : (
            <g key={s.key}>
              <circle cx={x(n - 1)} cy={y(last)} r={4} fill={colors[k]} stroke={SURFACE} strokeWidth={2} />
              <text x={x(n - 1) + 8} y={y(last) + 4} fontSize={11} fontWeight={600} fill={INK.secondary} className="tnum">
                {format(last)}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) => (
          <g
            key={l}
            className="ch-col"
            tabIndex={0}
            aria-label={`${l}: ${series.map((s) => `${s.label} ${format(s.values[i] ?? 0)}`).join(", ")}`}
            data-tip={`${l}\n${series.map((s) => `${s.label}: ${format(s.values[i] ?? 0)}`).join("\n")}`}
          >
            <rect x={x(i) - step / 2} y={M.top} width={step} height={H - M.bottom - M.top} fill="transparent" />
            <line className="ch-xh" x1={x(i)} x2={x(i)} y1={M.top} y2={H - M.bottom} stroke={MUTED_MARK} strokeWidth={1} />
            {series.map((s, k) => (
              <circle key={s.key} className="ch-xh" cx={x(i)} cy={y(s.values[i] ?? 0)} r={4} fill={colors[k]} stroke={SURFACE} strokeWidth={2} />
            ))}
          </g>
        ))}
        {evenIndices(n, 6).map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={INK.muted}>
            {labels[i]}
          </text>
        ))}
      </Svg>
    </ChartFrame>
  );
}

/** Tiny trend for KPI tiles: muted line, current point in the accent. Decorative beside the tile's number, so it is hidden from assistive tech. */
export function Sparkline({
  values,
  width = 96,
  height = 28,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
}): React.JSX.Element | null {
  if (values.length < 2) return null;
  const hi = maxOf(values);
  const lo = Math.min(...values);
  const x = scaleLinear().domain([0, values.length - 1]).range([4, width - 4]);
  const y = scaleLinear().domain([lo, hi === lo ? lo + 1 : hi]).range([height - 4, 4]);
  const d = line<number>().x((_, i) => x(i)).y((v) => y(v))([...values]) ?? "";
  const last = values[values.length - 1] ?? 0;
  return (
    <svg className="ch-spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke={MUTED_MARK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={3} fill={ACCENT} stroke={SURFACE} strokeWidth={2} />
    </svg>
  );
}
