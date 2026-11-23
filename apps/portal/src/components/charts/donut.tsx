import { type Datum, darken } from "./chart-style";
import { EChart } from "./echart";
import { ChartFrame } from "./frame";
import { formatCompact, formatPercent, type Slice, topSlices } from "./geometry";
import { categorical, INK } from "./palette";

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
  const colors = slices.map((s, i) => s.color ?? categorical(i));
  const share = (value: number): string => formatPercent(total ? value / total : 0);

  const option = {
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: ["68%", "90%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        startAngle: 90,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderRadius: 0, borderColor: "#FFFFFF", borderWidth: 2 },
        emphasis: { focus: "none", scale: false },
        data: slices.map((s, i): Datum & { name: string } => {
          const color = colors[i] ?? categorical(i);
          return {
            name: s.label,
            value: s.value,
            f: format(s.value),
            c: color,
            tip: {
              title: s.label,
              rows: [
                { label: "Amount", value: format(s.value), color },
                { label: "Share", value: share(s.value) },
              ],
            },
            itemStyle: { color },
            emphasis: { itemStyle: { color: darken(color, 0.14) } },
          };
        }),
      },
    ],
    graphic: [
      { type: "text", left: "center", top: "39%", style: { text: format(total), fontSize: 28, fontWeight: 700, fill: INK.primary, textAlign: "center" } },
      { type: "text", left: "center", top: "55%", style: { text: totalLabel, fontSize: 12, fontWeight: 600, fill: INK.secondary, textAlign: "center" } },
    ],
  };

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={slices.map((s, i) => ({ label: `${s.label} ${share(s.value)}`, color: colors[i] ?? categorical(i) }))}
      table={{ head: ["Name", "Value", "Share"], rows: slices.map((s) => [s.label, format(s.value), share(s.value)]) }}
    >
      <EChart option={option} height={230} label={`${title}, total ${format(total)}`} />
    </ChartFrame>
  );
}
