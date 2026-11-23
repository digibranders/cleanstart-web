import { scaleQuantize, scaleTime } from "d3-scale";
import { ChartFrame, Svg, truncate } from "./frame";
import { evenIndices, formatCompact, maxOf, roundedBarPath } from "./geometry";
import { ACCENT, INK, MUTED_MARK, STATUS_COLOR, TRACK, VIOLET_RAMP } from "./palette";

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
  const CELL = 16;
  const GAP = 2;
  const LEFT = 32;
  const TOP = 16;
  const top = maxOf(weeks.flatMap((w) => w.days.map((d) => d ?? 0))) || 1;
  const color = scaleQuantize<string>().domain([1, top]).range([...HEAT_STEPS]);
  const W = LEFT + weeks.length * (CELL + GAP);
  const H = TOP + 7 * (CELL + GAP);
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
      <Svg width={W} height={H} label={title}>
        {[0, 2, 4].map((d) => (
          <text key={d} x={0} y={TOP + d * (CELL + GAP) + 12} fontSize={11} fill={INK.muted}>
            {DAYS[d]}
          </text>
        ))}
        {evenIndices(weeks.length, Math.max(2, Math.floor(weeks.length / 4))).map((i) => (
          <text key={i} x={LEFT + i * (CELL + GAP)} y={10} fontSize={11} fill={INK.muted}>
            {weeks[i]?.label}
          </text>
        ))}
        {weeks.map((w, wi) =>
          DAYS.map((day, d) => {
            const v = w.days[d];
            if (v == null) return null;
            const text = `${w.label}, ${day}: ${formatCompact(v)} ${unit}`;
            return (
              <rect
                key={`${w.label}-${day}`}
                className="ch-mark"
                x={LEFT + wi * (CELL + GAP)}
                y={TOP + d * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={3}
                fill={v > 0 ? color(v) : EMPTY}
                tabIndex={0}
                aria-label={text}
                data-tip={`${w.label}, ${day}\n${formatCompact(v)} ${unit}`}
              />
            );
          }),
        )}
      </Svg>
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
  const W = 560;
  const LABEL = 150;
  const ROW = 28;
  const AXIS = 22;
  const lo = Math.min(today, ...bars.map((b) => b.start));
  const hi = Math.max(today, ...bars.map((b) => b.end));
  const x = scaleTime().domain([lo, hi]).range([LABEL, W - 8]);
  const H = bars.length * ROW + AXIS;
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
      <Svg width={W} height={H} label={title}>
        {bars.map((b, i) => {
          const text = `${b.label}: ${STATE_LABEL[b.state]}, ${dateText(b.start)} to ${dateText(b.end)}`;
          return (
            <g
              key={b.key}
              className="ch-mark"
              tabIndex={0}
              aria-label={text}
              data-tip={`${b.label}\n${STATE_LABEL[b.state]}\n${dateText(b.start)} to ${dateText(b.end)}`}
              transform={`translate(0 ${i * ROW})`}
            >
              <rect width={W} height={ROW} fill="transparent" />
              <text x={0} y={ROW / 2 + 4} fontSize={12.5} fill={INK.primary}>
                {truncate(b.label, 24)}
              </text>
              <rect x={LABEL} y={(ROW - 12) / 2} width={W - 8 - LABEL} height={12} rx={4} fill={TRACK} />
              <path d={roundedBarPath(x(b.start), (ROW - 12) / 2, Math.max(2, x(b.end) - x(b.start)), 12, "right")} fill={STATE_COLOR[b.state]} />
            </g>
          );
        })}
        <line x1={x(today)} x2={x(today)} y1={0} y2={bars.length * ROW} stroke={INK.primary} strokeWidth={1} />
        <text x={x(today)} y={bars.length * ROW + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={INK.primary}>
          Today
        </text>
      </Svg>
    </ChartFrame>
  );
}
