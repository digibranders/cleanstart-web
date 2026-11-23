import { AXIS_LABEL, type Datum, emphasisOf, lifted, NO_LINE, SPLIT_LINE, type Tip } from "./chart-style";
import { EChart } from "./echart";
import { ChartFrame, truncate } from "./frame";
import { formatCompact, formatPercent, maxOf, niceMax } from "./geometry";
import { ACCENT, categorical, GRID, INK, TRACK, violetAt } from "./palette";

export interface Bar {
  key: string;
  label: string;
  value: number;
  color?: string;
}

type Fmt = (n: number) => string;

const BAR_LABEL = { show: true, position: "right", color: INK.secondary, fontWeight: 600, fontSize: 12 } as const;
const CATEGORY_AXIS = {
  type: "category",
  inverse: true,
  axisLine: NO_LINE,
  axisTick: NO_LINE,
  axisLabel: { color: INK.primary, fontSize: 12.5, width: 150, overflow: "truncate" },
} as const;

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
  const option = {
    grid: { left: 4, right: 72, top: 4, bottom: 4, containLabel: true },
    tooltip: { trigger: "item" },
    xAxis: { type: "value", show: false, max: maxOf(rows.map((r) => r.value)) || 1 },
    yAxis: { ...CATEGORY_AXIS, data: rows.map((r) => truncate(r.label, 28)) },
    series: [
      {
        type: "bar",
        barWidth: 14,
        showBackground: true,
        backgroundStyle: { color: "#F5F4F9", borderRadius: 5 },
        data: rows.map((r): Datum => {
          const color = r.color ?? ACCENT;
          return {
            value: r.value,
            f: format(r.value),
            c: color,
            tip: { title: r.label, rows: [{ label: "Value", value: format(r.value), color }] },
            itemStyle: { ...lifted(color, "right"), borderRadius: 5 },
            label: { formatter: format(r.value) },
          };
        }),
        label: BAR_LABEL,
        emphasis: emphasisOf(ACCENT),
      },
    ],
  };
  return (
    <ChartFrame title={title} description={description} table={{ head: ["Name", "Value"], rows: rows.map((r) => [r.label, format(r.value)]) }}>
      <EChart option={option} height={Math.max(32, rows.length * 38 + 8)} label={title} />
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

/** Vertical bars. One series is plain columns; `stacked` stacks several, in series order. Bars are lit from above and lifted by a tinted shadow. */
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
  const colors = series.map((s, i) => s.color ?? categorical(i));
  const totals = rows.map((r) => r.values.reduce((n, v) => n + v, 0));
  const top = niceMax(maxOf(stacked ? totals : rows.flatMap((r) => [...r.values])));
  const maxIndex = totals.indexOf(maxOf(totals));
  const shown = stacked ? series : series.slice(0, 1);

  const option = {
    grid: { left: 4, right: 8, top: 24, bottom: 4, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(112,83,232,0.05)" } } },
    xAxis: {
      type: "category",
      data: rows.map((r) => r.label),
      axisLine: { lineStyle: { color: GRID } },
      axisTick: NO_LINE,
      axisLabel: { ...AXIS_LABEL, hideOverlap: true },
    },
    yAxis: { type: "value", max: top, splitNumber: 4, axisLine: NO_LINE, axisTick: NO_LINE, splitLine: SPLIT_LINE, axisLabel: AXIS_LABEL },
    series: shown.map((s, k) => {
      const color = colors[k] ?? categorical(k);
      return {
        name: s.label,
        type: "bar",
        ...(stacked ? { stack: "total" } : {}),
        barWidth: 24,
        barMaxWidth: 28,
        data: rows.map((r, i): Datum => {
          const v = r.values[k] ?? 0;
          const lastIdx = stacked ? r.values.reduce((l, x, idx) => (x > 0 ? idx : l), -1) : 0;
          const showLabel = !stacked && i === maxIndex;
          return {
            value: v,
            f: format(v),
            c: color,
            itemStyle: {
              ...lifted(color),
              borderRadius: k === lastIdx ? [5, 5, 0, 0] : 0,
              ...(stacked && k > 0 ? { borderColor: "#FFFFFF", borderWidth: 1 } : {}),
            },
            ...(showLabel ? { label: { show: true, position: "top", formatter: format(v), color: INK.secondary, fontWeight: 600, fontSize: 11.5 } } : {}),
          };
        }),
        emphasis: emphasisOf(color),
      };
    }),
  };

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={series.map((s, i) => ({ label: s.label, color: colors[i] ?? categorical(i) }))}
      table={{
        head: ["Period", ...series.map((s) => s.label), ...(stacked && series.length > 1 ? ["Total"] : [])],
        rows: rows.map((r, i) => [r.label, ...r.values.map((v) => format(v)), ...(stacked && series.length > 1 ? [format(totals[i] ?? 0)] : [])]),
      }}
    >
      <EChart option={option} height={240} label={title} valueAxis="y" />
    </ChartFrame>
  );
}

export interface FunnelStage {
  label: string;
  value: number;
}

function rate(value: number, previous: number | undefined): number {
  return previous ? value / previous : 0;
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
  const option = {
    grid: { left: 4, right: 110, top: 4, bottom: 4, containLabel: true },
    tooltip: { trigger: "item" },
    xAxis: { type: "value", show: false, max: stages[0]?.value || 1 },
    yAxis: { ...CATEGORY_AXIS, data: stages.map((s) => truncate(s.label, 22)) },
    series: [
      {
        type: "bar",
        barWidth: 20,
        showBackground: true,
        backgroundStyle: { color: "#F5F4F9", borderRadius: 5 },
        data: stages.map((s, i): Datum => {
          const color = violetAt(stages.length > 1 ? 0.35 + (0.65 * i) / (stages.length - 1) : 0.7);
          const conv = i === 0 ? "" : ` (${formatPercent(rate(s.value, stages[i - 1]?.value))})`;
          return {
            value: s.value,
            f: format(s.value),
            c: color,
            tip: {
              title: s.label,
              rows: [
                { label: "Count", value: format(s.value), color },
                ...(i === 0 ? [] : [{ label: "Of previous stage", value: formatPercent(rate(s.value, stages[i - 1]?.value)) }]),
              ],
            },
            itemStyle: { ...lifted(color, "right"), borderRadius: 5 },
            label: { formatter: `${format(s.value)}${conv}` },
          };
        }),
        label: BAR_LABEL,
        emphasis: emphasisOf("#5B2FE2"),
      },
    ],
  };
  return (
    <ChartFrame
      title={title}
      description={description}
      table={{
        head: ["Stage", "Count", "Of previous stage"],
        rows: stages.map((s, i) => [s.label, format(s.value), i === 0 ? "" : formatPercent(rate(s.value, stages[i - 1]?.value))]),
      }}
    >
      <EChart option={option} height={stages.length * 44 + 8} label={title} />
    </ChartFrame>
  );
}

export interface BulletRow {
  key: string;
  label: string;
  value: number;
  target: number;
}

/** Value against a target. The track is a lighter step of the bar's own hue; the target is a tick. */
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
  const max = maxOf(rows.flatMap((r) => [r.value, r.target])) || 1;
  const tipOf = (r: BulletRow): Tip => ({
    title: r.label,
    rows: [
      { label: "Value", value: format(r.value), color: ACCENT },
      { label: "Target", value: format(r.target) },
      { label: "Of target", value: formatPercent(rate(r.value, r.target)) },
    ],
  });
  const option = {
    grid: { left: 4, right: 120, top: 4, bottom: 4, containLabel: true },
    tooltip: { trigger: "item" },
    xAxis: { type: "value", show: false, min: 0, max },
    yAxis: { ...CATEGORY_AXIS, data: rows.map((r) => truncate(r.label, 24)) },
    series: [
      {
        type: "bar",
        barWidth: 14,
        z: 2,
        showBackground: true,
        backgroundStyle: { color: TRACK, borderRadius: 5 },
        data: rows.map((r): Datum => ({ value: r.value, tip: tipOf(r), itemStyle: { ...lifted(ACCENT, "right"), borderRadius: 5 } })),
        emphasis: emphasisOf(ACCENT),
      },
      {
        type: "scatter",
        z: 3,
        symbol: "rect",
        symbolSize: [3, 22],
        itemStyle: { color: INK.primary, borderColor: "#FFFFFF", borderWidth: 1 },
        data: rows.map((r, i): Datum => ({ value: [r.target, i], tip: tipOf(r) })),
      },
      {
        type: "scatter",
        silent: true,
        symbolSize: 0,
        data: rows.map((r, i) => ({
          value: [max, i],
          label: { show: true, position: "right", formatter: `${format(r.value)} / ${format(r.target)}`, color: INK.secondary, fontWeight: 600, fontSize: 12 },
        })),
      },
    ],
  };
  return (
    <ChartFrame
      title={title}
      description={description}
      table={{
        head: ["Name", "Value", "Target", "Of target"],
        rows: rows.map((r) => [r.label, format(r.value), format(r.target), formatPercent(rate(r.value, r.target))]),
      }}
    >
      <EChart option={option} height={rows.length * 40 + 8} label={title} />
    </ChartFrame>
  );
}
