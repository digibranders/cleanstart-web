import type { CSSProperties } from "react";

import type { DotColumns } from "./field";
import { InView } from "./InView";
import styles from "./visuals.module.css";

const STEP = 10;

interface DotFieldProps {
  columns: DotColumns;
  /** `estate` hollows the marked dots; `assure` lights them. */
  variant: "estate" | "assure";
  /** Circles for components, rounded squares for tested versions. */
  shape: "circle" | "square";
  label: string;
  /** Ambient pictures sit still and need no label or reveal. */
  ambient?: boolean;
  className?: string;
}

/**
 * A grid of dots as one SVG. Each column is a group so it can fade in on its own
 * delay, which gives a sweep across the field without a style per dot.
 */
export function DotField({ columns, variant, shape, label, ambient = false, className }: DotFieldProps): React.ReactElement {
  const rows = columns[0]?.length ?? 0;
  const half = STEP / 2;
  const svg = (
    <svg
      viewBox={`0 0 ${columns.length * STEP} ${rows * STEP}`}
      className="block h-auto w-full"
      role={ambient ? undefined : "img"}
      aria-label={ambient ? undefined : label}
      aria-hidden={ambient ? true : undefined}
    >
      {columns.map((column, c) => (
        <g key={c} className={styles.col} style={{ "--col": c } as CSSProperties}>
          {column.map((dot) => {
            const dotClass = dot.marked ? styles.marked : styles.base;
            return shape === "circle" ? (
              <circle key={dot.row} cx={c * STEP + half} cy={dot.row * STEP + half} r={3.1} className={dotClass} />
            ) : (
              <rect
                key={dot.row}
                x={c * STEP + 1.4}
                y={dot.row * STEP + 1.4}
                width={STEP - 2.8}
                height={STEP - 2.8}
                rx={2.2}
                className={dotClass}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );

  const rootClass = `${styles.root} ${styles[variant]} ${className ?? ""}`.trim();
  return ambient ? <div className={rootClass}>{svg}</div> : <InView className={rootClass}>{svg}</InView>;
}

interface GrowthBarsProps {
  from: number;
  to: number;
  label: string;
}

const BAR_AREA = 76;

/** The first value against the second, each bar as tall as its number. */
export function GrowthBars({ from, to, label }: GrowthBarsProps): React.ReactElement {
  const bars = [
    { value: from, tone: "rgba(255,255,255,0.22)", delay: 0 },
    { value: to, tone: "linear-gradient(180deg, #2CC1EB 0%, #6A3DF0 100%)", delay: 260 },
  ] as const;

  return (
    <InView className={`${styles.root} relative h-[116px] w-full shrink-0 sm:w-[220px]`}>
      <div role="img" aria-label={label} className="absolute inset-0">
        {bars.map((bar, index) => {
          const height = Math.round((bar.value / to) * BAR_AREA);
          return (
            <div
              key={bar.value}
              className="absolute bottom-0"
              style={{ left: index === 0 ? 0 : "calc(50% + 12px)", width: "calc(50% - 12px)", "--delay": `${bar.delay}ms` } as CSSProperties}
            >
              <span
                aria-hidden
                className={`${styles.barLabel} absolute left-0 right-0 text-center text-white`}
                style={{
                  bottom: height + 10,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h4)",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                }}
              >
                {bar.value}
              </span>
              <div aria-hidden className={`${styles.bar} rounded-t-[10px]`} style={{ height, background: bar.tone }} />
            </div>
          );
        })}
      </div>
    </InView>
  );
}
