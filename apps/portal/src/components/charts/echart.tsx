"use client";

import type { EChartsCoreOption, ECharts } from "echarts/core";
import { useEffect, useRef, useState } from "react";
import type { Tip } from "./chart-style";
import { loadEcharts } from "./echarts-setup";
import { formatCompact } from "./geometry";
import { INK } from "./palette";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

interface Param {
  name?: string;
  seriesName?: string;
  axisValueLabel?: string;
  data?: unknown;
}

const dataOf = (p: Param): { f?: string; c?: string; tip?: Tip } => (p.data && typeof p.data === "object" && !Array.isArray(p.data) ? (p.data as { f?: string; c?: string; tip?: Tip }) : {});

function tipHtml(tip: Tip): string {
  const rows = tip.rows
    .map(
      (r) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:4px"><span style="display:inline-flex;align-items:center;gap:7px;color:${INK.secondary}">${
          r.color ? `<i style="display:inline-block;width:8px;height:8px;border-radius:99px;background:${esc(r.color)}"></i>` : ""
        }${esc(r.label)}</span><b style="font-variant-numeric:tabular-nums;color:${INK.primary}">${esc(r.value)}</b></div>`,
    )
    .join("");
  return `<div style="min-width:132px"><div style="font-size:11.5px;font-weight:600;color:${INK.muted}">${esc(tip.title)}</div>${rows}</div>`;
}

/** One tooltip for every chart. A point with its own `tip` wins; otherwise each series in the hover becomes a row from the point's `f` text. */
function formatTip(raw: unknown): string {
  const list = (Array.isArray(raw) ? raw : [raw]) as Param[];
  const first = list[0];
  if (!first) return "";
  const own = dataOf(first).tip;
  if (own) return tipHtml(own);
  const rows = list.flatMap((p) => {
    const d = dataOf(p);
    return d.f === undefined ? [] : [{ label: p.seriesName ?? p.name ?? "", value: d.f, ...(d.c ? { color: d.c } : {}) }];
  });
  return tipHtml({ title: first.axisValueLabel ?? first.name ?? "", rows });
}

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  borderColor: "#EAECF0",
  borderWidth: 1,
  padding: [12, 14],
  textStyle: { color: INK.primary, fontSize: 12.5, fontFamily: "inherit" },
  extraCssText: "border-radius:10px;box-shadow:0 8px 24px rgba(20,20,30,.06);",
  confine: true,
  transitionDuration: 0.1,
} as const;

type Api = { value: (dim: number) => number; coord: (v: number[]) => number[]; size: (v: number[]) => number[]; style: () => Record<string, unknown> };
type Params = { coordSys: { x: number; y: number; width: number; height: number } };

/** Series whose drawing is a function cannot cross from a server component, so the option names one and this table supplies it. */
const RENDERERS = {
  gantt: (core: Awaited<ReturnType<typeof loadEcharts>>) => (params: Params, api: Api) => {
    const row = api.value(0);
    const start = api.coord([api.value(1), row]);
    const end = api.coord([api.value(2), row]);
    const height = (api.size([0, 1])[1] ?? 24) * 0.4;
    const rect = core.graphic.clipRectByRect(
      { x: start[0] ?? 0, y: (start[1] ?? 0) - height / 2, width: (end[0] ?? 0) - (start[0] ?? 0), height },
      { x: params.coordSys.x, y: params.coordSys.y, width: params.coordSys.width, height: params.coordSys.height },
    );
    return rect ? { type: "rect", transition: ["shape"], shape: { ...rect, r: 4 }, style: api.style() } : null;
  },
  cell: () => (_params: Params, api: Api) => {
    const at = api.coord([api.value(0), api.value(1)]);
    const [w = 16, h = 16] = api.size([1, 1]);
    return {
      type: "rect",
      shape: { x: (at[0] ?? 0) - w / 2 + 1.5, y: (at[1] ?? 0) - h / 2 + 1.5, width: Math.max(1, w - 3), height: Math.max(1, h - 3), r: 4 },
      style: api.style(),
    };
  },
} as const;

interface EChartProps {
  option: EChartsCoreOption;
  height: number;
  /** Names the chart for screen readers. The "View as table" toggle under it carries the data. */
  label: string;
  /** Which axis shows compact numbers (12.9K). */
  valueAxis?: "x" | "y" | undefined;
}

type Mutable = Record<string, unknown>;

function prepare(core: Awaited<ReturnType<typeof loadEcharts>>, option: EChartsCoreOption, valueAxis: "x" | "y" | undefined, reduced: boolean): EChartsCoreOption {
  const next = structuredClone(option) as Mutable;
  const font = getComputedStyle(document.body).fontFamily;
  next.textStyle = { fontFamily: font };
  next.animation = !reduced;
  next.animationDuration = 320;
  next.animationDurationUpdate = 200;
  next.animationEasing = "cubicOut";
  next.aria = { enabled: true };
  next.tooltip = { ...TOOLTIP_STYLE, ...((next.tooltip as Mutable | undefined) ?? {}), formatter: formatTip };
  if (valueAxis) {
    const axis = next[`${valueAxis}Axis`] as Mutable | undefined;
    if (axis) axis.axisLabel = { ...((axis.axisLabel as Mutable | undefined) ?? {}), formatter: (v: number) => formatCompact(v) };
  }
  next.series = ((next.series as Mutable[] | undefined) ?? []).map((s) => {
    const { renderer, ...rest } = s;
    return {
      ...rest,
      animationDelay: (i: number): number => i * 24,
      ...(typeof renderer === "string" && renderer in RENDERERS ? { renderItem: RENDERERS[renderer as keyof typeof RENDERERS](core) } : {}),
    };
  });
  return next as EChartsCoreOption;
}

/**
 * The shared canvas for every chart. It loads ECharts on first use, keeps the chart sized to its box, draws every tooltip from the
 * same formatter, and turns animation off for visitors who ask for reduced motion.
 */
export function EChart({ option, height, label, valueAxis }: EChartProps): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    void loadEcharts().then((core) => {
      if (cancelled || !box.current) return;
      const instance = core.init(box.current, undefined, { renderer: "canvas" });
      chart.current = instance;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      instance.setOption(prepare(core, option, valueAxis, reduced));
      observer = new ResizeObserver(() => instance.resize());
      observer.observe(box.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, [option, valueAxis]);

  return (
    <div className="ch-canvas" style={{ height }}>
      {ready ? null : <div className="ch-skel" aria-hidden="true" />}
      <div ref={box} role="img" aria-label={label} style={{ width: "100%", height }} />
    </div>
  );
}
