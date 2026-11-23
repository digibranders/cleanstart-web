import { arc } from "d3-shape";
import { ChartFrame, Svg } from "./frame";
import { formatCompact, formatPercent, type Slice, sliceAngles, topSlices } from "./geometry";
import { categorical, INK, SURFACE } from "./palette";

const SIZE = 200;
const OUTER = 92;
const INNER = 62;

/** Part-to-whole, at most six slices then "Other". The centre shows the total; the legend carries names, shares and amounts. */
export function Donut({
  title,
  description,
  data,
  totalLabel,
  format = formatCompact,
}: {
  title: string;
  description: string;
  data: readonly Slice[];
  totalLabel: string;
  format?: (n: number) => string;
}): React.JSX.Element {
  const slices = topSlices(data, 6);
  const total = slices.reduce((n, s) => n + s.value, 0);
  const angles = sliceAngles(slices.map((s) => s.value));
  const path = arc().innerRadius(INNER).outerRadius(OUTER).cornerRadius(2);
  const colors = slices.map((s, i) => s.color ?? categorical(i));

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={slices.map((s, i) => ({
        label: `${s.label} ${formatPercent(total ? s.value / total : 0)}`,
        color: colors[i] ?? categorical(i),
      }))}
      table={{
        head: ["Name", "Value", "Share"],
        rows: slices.map((s) => [s.label, format(s.value), formatPercent(total ? s.value / total : 0)]),
      }}
    >
      <Svg width={SIZE} height={SIZE} label={`${title}, total ${format(total)}`}>
        <g transform={`translate(${SIZE / 2} ${SIZE / 2})`}>
          {slices.map((s, i) => {
            const a = angles[i];
            const d = a ? path({ ...a, innerRadius: INNER, outerRadius: OUTER }) : null;
            const share = formatPercent(total ? s.value / total : 0);
            return d ? (
              <path
                key={s.key}
                d={d}
                fill={colors[i]}
                stroke={SURFACE}
                strokeWidth={2}
                className="ch-mark"
                tabIndex={0}
                aria-label={`${s.label}: ${format(s.value)}, ${share}`}
                data-tip={`${s.label}\n${format(s.value)} (${share})`}
              />
            ) : null;
          })}
          <text textAnchor="middle" y={4} fontSize={28} fontWeight={700} fill={INK.primary}>
            {format(total)}
          </text>
          <text textAnchor="middle" y={24} fontSize={12} fontWeight={600} fill={INK.secondary}>
            {totalLabel}
          </text>
        </g>
      </Svg>
    </ChartFrame>
  );
}
