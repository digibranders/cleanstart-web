"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "../icon";

// Phosphor table, 256 viewbox.
const TABLE =
  "M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM40,112H80v32H40Zm56,0H216v32H96ZM216,64V96H40V64ZM40,160H80v32H40Zm176,32H96V160H216v32Z";

/**
 * The body of a chart card. A two-button switch in the header shows either the chart or the same data as a table, in the same space:
 * the table replaces the chart and scrolls inside the chart's height instead of pushing the card taller.
 */
export function ChartViews({
  head,
  legend,
  chart,
  table,
}: {
  head: React.ReactNode;
  legend: React.ReactNode;
  chart: React.ReactNode;
  table: React.ReactNode;
}): React.JSX.Element {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [height, setHeight] = useState<number | undefined>(undefined);
  const chartBox = useRef<HTMLDivElement>(null);
  const tableId = useId();

  const show = (next: "chart" | "table"): void => {
    if (next === "table" && chartBox.current) setHeight(chartBox.current.offsetHeight);
    setView(next);
  };

  return (
    <>
      <div className="ch-head">
        {head}
        <div className="ch-switch" role="group" aria-label="Chart view">
          <button type="button" className="ch-sw-b" aria-pressed={view === "chart"} aria-label="Chart" data-hint="Chart" onClick={() => show("chart")}>
            <Icon name="chart" />
          </button>
          <button type="button" className="ch-sw-b" aria-pressed={view === "table"} aria-label="Table" aria-controls={tableId} data-hint="Table" onClick={() => show("table")}>
            <Icon d={TABLE} />
          </button>
        </div>
      </div>
      <div ref={chartBox} className="ch-body" hidden={view !== "chart"}>
        {legend}
        {chart}
      </div>
      <div id={tableId} className="ch-tablebox" hidden={view !== "table"} style={height ? { height } : undefined}>
        {table}
      </div>
    </>
  );
}
