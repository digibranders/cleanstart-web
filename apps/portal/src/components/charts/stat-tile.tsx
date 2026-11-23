import { Sparkline } from "./lines";
import { STATUS_COLOR, INK } from "./palette";

export interface Delta {
  /** Change as a fraction (0.124 is +12.4%). */
  change: number;
  /** The period compared against, for example "vs prior 90 days". */
  versus: string;
  /** Whether an increase is good news. Colour = direction x whether up is good. Default true. */
  upIsGood?: boolean;
}

/** Headline number with an optional signed delta and sparkline. Not a chart: no plot, no table toggle, no tooltip. */
export function StatTile({
  label,
  value,
  delta,
  trend,
  size = "md",
}: {
  label: string;
  value: string;
  delta?: Delta;
  trend?: readonly number[];
  size?: "md" | "hero";
}): React.JSX.Element {
  const dir = delta ? Math.sign(delta.change) : 0;
  const good = delta ? (delta.upIsGood ?? true) === (dir > 0) : false;
  const color = dir === 0 ? INK.muted : good ? STATUS_COLOR.accepted : STATUS_COLOR.rejected;
  const pct = delta ? `${delta.change > 0 ? "+" : delta.change < 0 ? "−" : ""}${Math.abs(delta.change * 100).toFixed(1)}%` : "";
  return (
    <div className={`st${size === "hero" ? " st-hero" : ""}`}>
      <div className="st-l">{label}</div>
      <div className="st-row">
        <div className="st-v">{value}</div>
        {trend ? <Sparkline values={trend} /> : null}
      </div>
      {delta ? (
        <div className="st-d">
          <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
            {dir > 0 ? <path d="M5 1.5 9 8.5H1Z" fill={color} /> : dir < 0 ? <path d="M5 8.5 1 1.5H9Z" fill={color} /> : <rect x={1} y={4} width={8} height={2} fill={color} />}
          </svg>
          <span className="tnum">
            <span className="sr">{dir > 0 ? "Up " : dir < 0 ? "Down " : "No change "}</span>
            {pct}
          </span>
          <span className="st-vs">{delta.versus}</span>
        </div>
      ) : null}
    </div>
  );
}
