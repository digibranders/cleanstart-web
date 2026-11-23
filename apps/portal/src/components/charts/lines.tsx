import { line } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { AXIS_LABEL, type Datum, NO_LINE, gradient, rgba, SPLIT_LINE } from "./chart-style";
import { EChart } from "./echart";
import { ChartFrame } from "./frame";
import { formatCompact, maxOf, niceMax } from "./geometry";
import { ACCENT, categorical, GRID, INK, SURFACE } from "./palette";

export interface LineSeries {
  key: string;
  label: string;
  color?: string;
  /** One value per x label. */
  values: readonly number[];
}

/**
 * Trend over time: smooth glowing lines, a soft gradient wash under a single series (or under every series with `withArea`), a
 * dot and label on the latest value, and a dashed crosshair with a tooltip listing every series.
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
  const n = labels.length;
  const colors = series.map((s, i) => s.color ?? categorical(i));
  const top = niceMax(maxOf(series.flatMap((s) => [...s.values])));
  const washed = withArea;

  const option = {
    grid: { left: 4, right: 58, top: 18, bottom: 4, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "line", lineStyle: { color: "#D0D5DD", type: "solid", width: 1 } } },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: [...labels],
      axisLine: { lineStyle: { color: GRID } },
      axisTick: NO_LINE,
      axisLabel: { ...AXIS_LABEL, hideOverlap: true },
    },
    yAxis: { type: "value", max: top, splitNumber: 4, axisLine: NO_LINE, axisTick: NO_LINE, splitLine: SPLIT_LINE, axisLabel: AXIS_LABEL },
    series: series.map((s, k) => {
      const color = colors[k] ?? categorical(k);
      const last = s.values[n - 1];
      return {
        name: s.label,
        type: "line",
        smooth: false,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 2.5, color, cap: "round", join: "round" },
        itemStyle: { color, borderColor: SURFACE, borderWidth: 2 },
        ...(washed ? { areaStyle: { color: gradient(rgba(color, 0.14), rgba(color, 0)) } } : {}),
        emphasis: { focus: "none" },
        data: s.values.map((v): Datum => ({ value: v, f: format(v), c: color })),
        ...(last === undefined
          ? {}
          : {
              markPoint: {
                silent: true,
                symbol: "circle",
                label: { show: false },
                data: [{ coord: [n - 1, last], symbolSize: 9, itemStyle: { color, borderColor: SURFACE, borderWidth: 2 } }],
              },
              endLabel: { show: true, formatter: format(last), color: INK.secondary, fontWeight: 700, fontSize: 11.5, distance: 10 },
            }),
      };
    }),
  };

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
      <EChart option={option} height={240} label={title} valueAxis="y" />
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
      <path d={d} fill="none" stroke={ACCENT} strokeOpacity={0.5} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={3} fill={ACCENT} stroke={SURFACE} strokeWidth={2} />
    </svg>
  );
}
