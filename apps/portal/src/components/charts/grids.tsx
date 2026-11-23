import { scaleQuantize } from "d3-scale";
import { AXIS_LABEL, type Datum, lifted, NO_LINE, SPLIT_LINE } from "./chart-style";
import { EChart } from "./echart";
import { ChartFrame, truncate } from "./frame";
import { formatCompact, maxOf } from "./geometry";
import { ACCENT, GRID, INK, MUTED_MARK, STATUS_COLOR, VIOLET_RAMP } from "./palette";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const HEAT_STEPS = [VIOLET_RAMP[1], VIOLET_RAMP[2], VIOLET_RAMP[3], VIOLET_RAMP[4], VIOLET_RAMP[6]] as const;
const EMPTY = "#F1F0F4";

export interface HeatWeek {
  /** Label for the week, for example "3 Nov". */
  label: string;
  /** Monday to Sunday. null means no data for that day. */
  days: readonly (number | null)[];
}

/** Activity by week (columns) and weekday (rows). One hue, light to dark; zero and missing are neutral. */
export function Heatmap({
  title,
  description,
  weeks,
  unit = "events",
}: {
  title: string;
  description: string;
  weeks: readonly HeatWeek[];
  unit?: string;
}): React.JSX.Element {
  const top = maxOf(weeks.flatMap((w) => w.days.map((d) => d ?? 0))) || 1;
  const color = scaleQuantize<string>().domain([1, top]).range([...HEAT_STEPS]);
  const cells: Datum[] = weeks.flatMap((w, wi) =>
    DAYS.flatMap((day, d): Datum[] => {
      const v = w.days[d];
      if (v == null) return [];
      const fill = v > 0 ? color(v) : EMPTY;
      return [
        {
          value: [wi, d, v],
          f: `${formatCompact(v)} ${unit}`,
          c: fill,
          tip: { title: `${w.label}, ${day}`, rows: [{ label: unit.charAt(0).toUpperCase() + unit.slice(1), value: formatCompact(v), color: fill }] },
          itemStyle: { color: fill },
        },
      ];
    }),
  );
  const option = {
    grid: { left: 34, right: 4, top: 4, bottom: 22 },
    tooltip: { trigger: "item" },
    xAxis: {
      type: "category",
      data: weeks.map((w) => w.label),
      axisLine: NO_LINE,
      axisTick: NO_LINE,
      axisLabel: { ...AXIS_LABEL, hideOverlap: true },
    },
    yAxis: { type: "category", inverse: true, data: [...DAYS], axisLine: NO_LINE, axisTick: NO_LINE, axisLabel: { ...AXIS_LABEL, interval: 1 } },
    series: [
      {
        type: "custom",
        renderer: "cell",
        encode: { x: 0, y: 1 },
        data: cells,
        emphasis: { focus: "none", itemStyle: { opacity: 0.82 } },
      },
    ],
  };
  return (
    <ChartFrame
      title={title}
      description={description}
      scaleKey={
        <div className="ch-scale" aria-hidden="true">
          Fewer
          {[EMPTY, ...HEAT_STEPS].map((c) => (
            <span key={c} className="ch-sw" style={{ background: c }} />
          ))}
          More
        </div>
      }
      table={{
        head: ["Week", ...DAYS],
        rows: weeks.map((w) => [w.label, ...DAYS.map((_, d) => (w.days[d] == null ? "" : formatCompact(w.days[d] ?? 0)))]),
      }}
    >
      <EChart option={option} height={7 * 24 + 36} label={title} />
    </ChartFrame>
  );
}

export type ProtectionState = "active" | "expiring" | "expired";

export interface ProtectionBar {
  key: string;
  label: string;
  /** Epoch milliseconds. */
  start: number;
  end: number;
  state: ProtectionState;
}

const STATE_COLOR: Record<ProtectionState, string> = {
  active: ACCENT,
  expiring: STATUS_COLOR.pending,
  expired: MUTED_MARK,
};
const STATE_LABEL: Record<ProtectionState, string> = { active: "Protected", expiring: "Expiring soon", expired: "Expired" };

const dateText = (ms: number): string =>
  new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** One bar per deal across its protection window, with a line for today. `today` is passed in so the render is deterministic. */
export function Timeline({
  title,
  description,
  bars,
  today,
}: {
  title: string;
  description: string;
  bars: readonly ProtectionBar[];
  today: number;
}): React.JSX.Element {
  const lo = Math.min(today, ...bars.map((b) => b.start));
  const hi = Math.max(today, ...bars.map((b) => b.end));
  const pad = Math.max(1, (hi - lo) * 0.03);
  const option = {
    grid: { left: 4, right: 20, top: 26, bottom: 4, containLabel: true },
    tooltip: { trigger: "item" },
    xAxis: {
      type: "time",
      min: lo - pad,
      max: hi + pad,
      axisLine: { lineStyle: { color: GRID } },
      axisTick: NO_LINE,
      splitLine: SPLIT_LINE,
      axisLabel: { ...AXIS_LABEL, hideOverlap: true },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: bars.map((b) => truncate(b.label, 26)),
      axisLine: NO_LINE,
      axisTick: NO_LINE,
      axisLabel: { color: INK.primary, fontSize: 12.5, width: 150, overflow: "truncate" },
    },
    series: [
      {
        type: "custom",
        renderer: "gantt",
        encode: { x: [1, 2], y: 0 },
        z: 2,
        data: bars.map((b, i): Datum => ({
          value: [i, b.start, b.end],
          tip: {
            title: b.label,
            rows: [
              { label: "Status", value: STATE_LABEL[b.state], color: STATE_COLOR[b.state] },
              { label: "From", value: dateText(b.start) },
              { label: "Until", value: dateText(b.end) },
            ],
          },
          itemStyle: lifted(STATE_COLOR[b.state], "right"),
        })),
      },
      {
        type: "line",
        silent: true,
        data: [],
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: INK.primary, width: 1.5, type: "solid" },
          label: { formatter: "Today", position: "start", distance: 6, color: INK.primary, fontWeight: 600, fontSize: 11.5 },
          data: [{ xAxis: today }],
        },
      },
    ],
  };
  return (
    <ChartFrame
      title={title}
      description={description}
      legend={(["active", "expiring", "expired"] as const).map((s) => ({ label: STATE_LABEL[s], color: STATE_COLOR[s] }))}
      table={{
        head: ["Deal", "Status", "Protected from", "Protected until"],
        rows: bars.map((b) => [b.label, STATE_LABEL[b.state], dateText(b.start), dateText(b.end)]),
      }}
    >
      <EChart option={option} height={bars.length * 30 + 52} label={title} />
    </ChartFrame>
  );
}

