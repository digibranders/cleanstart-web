import { scaleLinear } from "d3-scale";
import { ChartFrame, Svg, truncate } from "./frame";
import { barLayout, evenIndices, formatCompact, formatPercent, maxOf, niceMax, niceTicks, roundedBarPath } from "./geometry";
import { ACCENT, categorical, GRID, INK, SURFACE, TRACK, violetAt } from "./palette";

export interface Bar {
  key: string;
  label: string;
  value: number;
  color?: string;
}

type Fmt = (n: number) => string;

/** Horizontal ranked bars, largest first, with the value printed at each bar tip. One hue unless a bar carries its own entity colour. */
export function BarList({
  title,
  description,
  data,
  format = formatCompact,
  limit = 8,
}: {
  title: string;
  description: string;
  data: readonly Bar[];
  format?: Fmt;
  limit?: number;
}): React.JSX.Element {
  const rows = [...data].sort((a, b) => b.value - a.value).slice(0, limit);
  const W = 480;
  const LABEL = 150;
  const VALUE = 56;
  const ROW = 28;
  const x = scaleLinear().domain([0, maxOf(rows.map((r) => r.value)) || 1]).range([0, W - LABEL - VALUE]);
  return (
    <ChartFrame
      title={title}
      description={description}
      table={{ head: ["Name", "Value"], rows: rows.map((r) => [r.label, format(r.value)]) }}
    >
      <Svg width={W} height={Math.max(ROW, rows.length * ROW)} label={title}>
        {rows.map((r, i) => {
          const w = Math.max(0, x(r.value));
          return (
            <g
              key={r.key}
              className="ch-mark"
              tabIndex={0}
              aria-label={`${r.label}: ${format(r.value)}`}
              data-tip={`${r.label}\n${format(r.value)}`}
              transform={`translate(0 ${i * ROW})`}
            >
              <rect x={0} y={0} width={W} height={ROW} fill="transparent" />
              <text x={0} y={ROW / 2 + 4} fontSize={12.5} fill={INK.primary}>
                {truncate(r.label, 24)}
              </text>
              <path d={roundedBarPath(LABEL, (ROW - 12) / 2, w, 12, "right")} fill={r.color ?? ACCENT} />
              <text x={LABEL + w + 6} y={ROW / 2 + 4} fontSize={12} fontWeight={600} fill={INK.secondary} className="tnum">
                {format(r.value)}
              </text>
            </g>
          );
        })}
      </Svg>
    </ChartFrame>
  );
}

export interface ColumnSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ColumnRow {
  label: string;
  /** One value per series, in series order. */
  values: readonly number[];
}

/** Vertical bars: 4px rounded data ends, 2px surface gaps. One series is plain columns; `stacked` stacks several, in series order. */
export function Columns({
  title,
  description,
  rows,
  series,
  stacked = false,
  format = formatCompact,
}: {
  title: string;
  description: string;
  rows: readonly ColumnRow[];
  series: readonly ColumnSeries[];
  stacked?: boolean;
  format?: Fmt;
}): React.JSX.Element {
  const W = 480;
  const H = 220;
  const M = { top: 12, right: 8, bottom: 26, left: 40 };
  const colors = series.map((s, i) => s.color ?? categorical(i));
  const totals = rows.map((r) => r.values.reduce((n, v) => n + v, 0));
  const top = niceMax(maxOf(stacked ? totals : rows.flatMap((r) => [...r.values])));
  const y = scaleLinear().domain([0, top]).range([H - M.bottom, M.top]);
  const layout = barLayout(rows.length, W - M.left - M.right);
  const ticks = niceTicks(top);
  const base = H - M.bottom;
  const maxIndex = totals.indexOf(maxOf(totals));

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={series.map((s, i) => ({ label: s.label, color: colors[i] ?? categorical(i) }))}
      table={{
        head: ["Period", ...series.map((s) => s.label), ...(stacked && series.length > 1 ? ["Total"] : [])],
        rows: rows.map((r, i) => [
          r.label,
          ...r.values.map((v) => format(v)),
          ...(stacked && series.length > 1 ? [format(totals[i] ?? 0)] : []),
        ]),
      }}
    >
      <Svg width={W} height={H} label={title}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={M.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={INK.muted} className="tnum">
              {formatCompact(t)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const b = layout[i];
          if (!b) return null;
          const x0 = M.left + b.offset;
          const vals = stacked ? r.values : r.values.slice(0, 1);
          let acc = 0;
          const lastIdx = vals.reduce((l, v, k) => (v > 0 ? k : l), -1);
          const tip = `${r.label}\n${series.map((s, k) => `${s.label}: ${format(r.values[k] ?? 0)}`).join("\n")}`;
          return (
            <g
              key={r.label}
              className="ch-mark"
              tabIndex={0}
              aria-label={`${r.label}: ${series.map((s, k) => `${s.label} ${format(r.values[k] ?? 0)}`).join(", ")}`}
              data-tip={tip}
            >
              <rect x={x0 - 4} y={M.top} width={b.thickness + 8} height={base - M.top} fill="transparent" />
              {vals.map((v, k) => {
                const y1 = y(acc + v);
                const y0 = y(acc);
                acc += v;
                // The 2px gap is the surface colour: shave the lower edge of every segment that has one beneath it.
                const gap = k > 0 ? 2 : 0;
                return (
                  <path
                    key={series[k]?.key ?? k}
                    d={roundedBarPath(x0, y1, b.thickness, Math.max(0, y0 - y1 - gap), k === lastIdx ? "top" : "none")}
                    fill={colors[k]}
                  />
                );
              })}
              {i === maxIndex && !stacked ? (
                <text x={x0 + b.thickness / 2} y={y(totals[i] ?? 0) - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill={INK.secondary} className="tnum">
                  {format(totals[i] ?? 0)}
                </text>
              ) : null}
            </g>
          );
        })}
        <line x1={M.left} x2={W - M.right} y1={base} y2={base} stroke={GRID} strokeWidth={1} />
        {evenIndices(rows.length, 6).map((i) => {
          const b = layout[i];
          return b ? (
            <text key={i} x={M.left + b.offset + b.thickness / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={INK.muted}>
              {rows[i]?.label}
            </text>
          ) : null;
        })}
      </Svg>
    </ChartFrame>
  );
}

export interface FunnelStage {
  label: string;
  value: number;
}

/** Ordered stages as proportional bars on the violet ramp (light to dark). Each row also shows conversion from the stage above. */
export function Funnel({
  title,
  description,
  stages,
  format = formatCompact,
}: {
  title: string;
  description: string;
  stages: readonly FunnelStage[];
  format?: Fmt;
}): React.JSX.Element {
  const W = 480;
  const LABEL = 120;
  const VALUE = 96;
  const ROW = 34;
  const top = stages[0]?.value || 1;
  const x = scaleLinear().domain([0, top]).range([0, W - LABEL - VALUE]);
  return (
    <ChartFrame
      title={title}
      description={description}
      table={{
        head: ["Stage", "Count", "Of previous stage"],
        rows: stages.map((s, i) => [s.label, format(s.value), i === 0 ? "" : formatPercent(rate(s.value, stages[i - 1]?.value))]),
      }}
    >
      <Svg width={W} height={stages.length * ROW} label={title}>
        {stages.map((s, i) => {
          const conv = i === 0 ? "" : ` (${formatPercent(rate(s.value, stages[i - 1]?.value))})`;
          return (
            <g
              key={s.label}
              className="ch-mark"
              tabIndex={0}
              aria-label={`${s.label}: ${format(s.value)}${conv}`}
              data-tip={`${s.label}\n${format(s.value)}${conv}`}
              transform={`translate(0 ${i * ROW})`}
            >
              <rect width={W} height={ROW} fill="transparent" />
              <text x={0} y={ROW / 2 + 4} fontSize={12.5} fill={INK.primary}>
                {truncate(s.label, 18)}
              </text>
              <path
                d={roundedBarPath(LABEL, (ROW - 16) / 2, Math.max(0, x(s.value)), 16, "right")}
                fill={violetAt(stages.length > 1 ? 0.35 + (0.65 * i) / (stages.length - 1) : 0.7)}
              />
              <text x={LABEL + Math.max(0, x(s.value)) + 6} y={ROW / 2 + 4} fontSize={12} fontWeight={600} fill={INK.secondary} className="tnum">
                {format(s.value)}
                {conv}
              </text>
            </g>
          );
        })}
      </Svg>
    </ChartFrame>
  );
}

function rate(value: number, previous: number | undefined): number {
  return previous ? value / previous : 0;
}

export interface BulletRow {
  key: string;
  label: string;
  value: number;
  target: number;
}

/** Value against a target. The track is a lighter step of the bar's own hue; the target is a 2px tick. */
export function Bullet({
  title,
  description,
  rows,
  format = formatCompact,
}: {
  title: string;
  description: string;
  rows: readonly BulletRow[];
  format?: Fmt;
}): React.JSX.Element {
  const W = 480;
  const LABEL = 130;
  const VALUE = 110;
  const ROW = 32;
  const x = scaleLinear()
    .domain([0, maxOf(rows.flatMap((r) => [r.value, r.target])) || 1])
    .range([0, W - LABEL - VALUE]);
  const track = W - LABEL - VALUE;
  return (
    <ChartFrame
      title={title}
      description={description}
      table={{
        head: ["Name", "Value", "Target", "Of target"],
        rows: rows.map((r) => [r.label, format(r.value), format(r.target), formatPercent(rate(r.value, r.target))]),
      }}
    >
      <Svg width={W} height={rows.length * ROW} label={title}>
        {rows.map((r, i) => {
          const pct = formatPercent(rate(r.value, r.target));
          return (
            <g
              key={r.key}
              className="ch-mark"
              tabIndex={0}
              aria-label={`${r.label}: ${format(r.value)} of ${format(r.target)} target, ${pct}`}
              data-tip={`${r.label}\n${format(r.value)} of ${format(r.target)} (${pct})`}
              transform={`translate(0 ${i * ROW})`}
            >
              <rect width={W} height={ROW} fill="transparent" />
              <text x={0} y={ROW / 2 + 4} fontSize={12.5} fill={INK.primary}>
                {truncate(r.label, 20)}
              </text>
              <rect x={LABEL} y={(ROW - 14) / 2} width={track} height={14} rx={4} fill={TRACK} />
              <path d={roundedBarPath(LABEL, (ROW - 10) / 2, Math.max(0, x(r.value)), 10, "right")} fill={ACCENT} />
              <rect x={LABEL + x(r.target) - 1} y={(ROW - 20) / 2} width={2} height={20} fill={INK.primary} stroke={SURFACE} strokeWidth={0} />
              <text x={LABEL + track + 8} y={ROW / 2 + 4} fontSize={12} fontWeight={600} fill={INK.secondary} className="tnum">
                {format(r.value)} / {format(r.target)}
              </text>
            </g>
          );
        })}
      </Svg>
    </ChartFrame>
  );
}
