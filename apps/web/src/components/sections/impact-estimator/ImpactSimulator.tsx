"use client";

/*
 * The interactive centrepiece of /impact-estimator. A four-part narrative:
 *   Your environment (inputs) → Operational Burden Score (gauge)
 *   → Expected improvements (KPIs) → Engineering Hours Recovered
 * Numbers tween smoothly; technical terms carry accessible tooltips. Math and
 * the client-owned naming both live in ./model.ts; the shareable-link state
 * lives in ./url-state.ts. Inputs stay sticky beside the results on desktop;
 * on smaller screens a fixed summary strip keeps the result in view while the
 * user is still on the inputs card.
 *
 * Input labels stay sentence case (they are form fields); outcome labels are
 * Title Case because they are the client's proper metric names; see model.ts.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { copyText } from "@/lib/clipboard";
import {
  ANNUAL_ENG_HOURS,
  BURDEN_SCALE,
  computeImpact,
  IMAGE_WEIGHT_THRESHOLDS,
  INPUT_BOUNDS,
  REMEDIATION_OPTIONS,
  RELEASE_OPTIONS,
  TEAM_WEIGHT_THRESHOLDS,
  TIER_NAMES,
  type RoiInput,
  type TierName,
} from "./model";
import { buildEstimatorSearch, DEFAULT_INPUT, INPUT_STEP, parseEstimatorSearch } from "./url-state";

/* ── colour system (AA-compliant text on white / #F6F6F6) ── */
const INK = "#111111";
const SUB = "#3a3f4c"; // ~9:1
const MUTED = "#5b6070"; // ~6:1, safe for small captions
const ACCENT = "#3960F9";

const TIER_COLOR: Record<TierName, string> = {
  Low: "#2cc1eb",
  Moderate: "#3960F9",
  High: "#471ec0",
  Extreme: "#8b1fc3",
};
const TIER_SPAN: Record<TierName, number> = { Low: 20, Moderate: 100, High: 100, Extreme: 40 };
const SPAN_TOTAL = 260;
/*
 * Verbatim from ROI 1.xlsx §"Background Scoring & Logic" item 1, which pairs one
 * of these descriptions with each Runtime Complexity band. Only the terminal
 * full stops are ours; the sheet omits them because they are cell values.
 */
const TIER_BLURB: Record<TierName, string> = {
  Low: "Small stable runtimes with limited inherited complexity.",
  Moderate: "Growing container adoption with increasing remediation overhead.",
  High: "Large runtime sprawl with frequent vulnerability management cycles.",
  Extreme: "High-frequency enterprise delivery with significant inherited operational burden.",
};

/* ── tween: animates a display number toward `target`, retargeting on change ── */
function useTweenNumber(target: number, active: boolean, duration = 500): number {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();
  const current = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!active) return;
    if (reduce) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const from = current.current;
    const start = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (now: number): void => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      const value = from + (target - from) * eased;
      current.current = value;
      setDisplay(value);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active, reduce, duration]);

  return display;
}

/* ── accessible tooltip for jargon (hover + focus + tap, Esc to dismiss) ── */
function InfoTip({ label, text }: { label: string; text: string }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", marginLeft: "2px", borderRadius: "50%", border: "none", background: "transparent", color: "#8b91a1", cursor: "pointer", padding: 0 }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: "224px", background: "#151021", color: "rgba(255,255,255,0.92)", fontFamily: "var(--font-sans)", fontSize: "12.5px", lineHeight: 1.45, fontWeight: 400, letterSpacing: 0, textTransform: "none", padding: "10px 12px", borderRadius: "10px", boxShadow: "0 10px 28px -10px rgba(17,17,17,0.5)", zIndex: 30 }}
        >
          {text}
          <span aria-hidden style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #151021" }} />
        </span>
      )}
    </span>
  );
}

/* ── SVG arc helpers for the radial gauge (angle: 0 = top, clockwise) ── */
function polar(cx: number, cy: number, r: number, angle: number): { x: number; y: number } {
  const a = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arcPath(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const start = polar(cx, cy, r, a2);
  const end = polar(cx, cy, r, a1);
  const large = a2 - a1 <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

const GAUGE = { w: 240, cx: 120, cy: 118, r: 94, stroke: 15 } as const;

function RadialGauge({ progress, tier, burden }: { progress: number; tier: TierName; burden: number }): React.ReactElement {
  const { cx, cy, r } = GAUGE;
  const needleAngle = -90 + progress * 180;
  const tip = polar(cx, cy, r - 20, needleAngle);

  let cursor = -90;
  const zones = TIER_NAMES.map((name) => {
    const start = cursor;
    const end = cursor + (TIER_SPAN[name] / SPAN_TOTAL) * 180;
    cursor = end;
    return { name, start, end };
  });

  return (
    <div className="w-full" style={{ maxWidth: "208px" }}>
      <div className="relative">
        <svg viewBox={`0 0 ${GAUGE.w} 128`} width="100%" role="img" aria-label={`Operational Burden Score ${Math.round(burden)} of ${BURDEN_SCALE.max}, Runtime Complexity ${tier}.`}>
          <defs>
            {/* userSpaceOnUse, not the default objectBoundingBox: at burden 100
                and 360 the needle is exactly horizontal, so its bounding box has
                zero height. Percentage filter regions resolve against that box,
                making the region collapse and the needle disappear entirely at
                both ends of the scale. A fixed region in user units is immune. */}
            <filter id="impact-needle-shadow" filterUnits="userSpaceOnUse" x="-4" y="-4" width={GAUGE.w + 8} height="136">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(17,17,17,0.35)" />
            </filter>
          </defs>
          <path d={arcPath(cx, cy, r, -90, 90)} fill="none" stroke="rgba(17,17,17,0.06)" strokeWidth={GAUGE.stroke} strokeLinecap="round" />
          {zones.map((z) => (
            <path
              key={z.name}
              d={arcPath(cx, cy, r, z.start + 1, z.end - 1)}
              fill="none"
              stroke={TIER_COLOR[z.name]}
              strokeWidth={GAUGE.stroke}
              strokeLinecap="round"
              style={{ opacity: z.name === tier ? 1 : 0.22, transition: "opacity 0.3s" }}
            />
          ))}
          <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke={INK} strokeWidth="3.5" strokeLinecap="round" filter="url(#impact-needle-shadow)" />
          <circle cx={cx} cy={cy} r="6" fill={INK} />
          <circle cx={cx} cy={cy} r="2.4" fill="#fff" />
        </svg>
        <div className="absolute text-center" style={{ left: "50%", top: "60%", transform: "translate(-50%,-50%)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "30px", fontWeight: 700, letterSpacing: "-0.03em", color: INK, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{Math.round(burden)}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500, color: MUTED, marginTop: "2px" }}>of {BURDEN_SCALE.max}</div>
        </div>
      </div>
      {/* proportional tier scale legend */}
      <div className="flex" style={{ marginTop: "6px" }} aria-hidden>
        {TIER_NAMES.map((name) => (
          <span key={name} style={{ flex: `${TIER_SPAN[name] / SPAN_TOTAL} 0 0`, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: name === tier ? 700 : 500, color: name === tier ? TIER_COLOR[tier] : MUTED, letterSpacing: "-0.01em" }}>{name}</span>
        ))}
      </div>
      <div aria-hidden style={{ marginTop: "8px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
        Operational Burden Score
      </div>
    </div>
  );
}

/*
 * Contextual descriptors so a raw number reads as a scale. These MUST stay on
 * the model's own band edges: a caption that switches at a different count
 * than the score does makes the gauge look broken ("it says Large estate but
 * nothing moved"). One label per scoring band, in order.
 */
type BandLabels = readonly [string, string, string, string];

function bandLabel(value: number, thresholds: readonly number[], labels: BandLabels): string {
  const [first, second, third, top] = labels;
  const i = thresholds.findIndex((t) => value <= t);
  return i === 0 ? first : i === 1 ? second : i === 2 ? third : top;
}

const IMAGE_LABELS: BandLabels = ["Small footprint", "Growing estate", "Large estate", "Enterprise-scale"];
const TEAM_LABELS: BandLabels = ["Small team", "Mid-sized org", "Large org", "Enterprise org"];

/* ── icons ── */
const stroke = (d: string): React.ReactNode => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

interface MetricDef {
  key: "vuln" | "patch" | "release" | "footprint";
  title: string;
  sub: string;
  accent: string;
  icon: React.ReactNode;
}
/*
 * Titles are the client's outcome names, verbatim from ROI 1.xlsx §RESULTS and
 * the Sheet2 "New CleanStart Model" column, the same words the sales deck uses.
 * They are Title Case because they are proper metric names, not sentences. The
 * `sub` line carries the plain-English gloss that the name alone doesn't give.
 */
const METRICS: MetricDef[] = [
  { key: "vuln", title: "Vulnerability Noise Reduction", sub: "Fewer false alarms to triage", accent: "#471ec0", icon: stroke("M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z") },
  { key: "patch", title: "Patch Cycle Overhead Reduction", sub: "Less time patching and re-testing", accent: "#3960F9", icon: stroke("M4 12a8 8 0 0 1 13.7-5.6L20 8M20 3v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 16M4 21v-5h5") },
  { key: "release", title: "Faster Secure Releases", sub: "Ship trusted builds sooner", accent: "#2cc1eb", icon: stroke("M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8a2 2 0 0 0-3 0zM8.5 13.5l2 2M13 20l2-4M8 11l-4 2M14.5 5.5a9 9 0 0 1 4 4l-6 6-4-4 6-6z") },
  { key: "footprint", title: "Runtime Footprint Reduction", sub: "Less to store, scan, and attack", accent: "#6b2ec9", icon: stroke("M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 3v18M20 7.5L12 12 4 7.5") },
];

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/*
 * Thumb is 22px wide and its centre travels from 11px to (track − 11px), so a
 * bare `left: X%` would drift from the thumb by up to 11px at the ends. This
 * matches the native thumb's travel exactly, which matters because the whole
 * point of the ticks is to mark where the score steps.
 */
function thumbOffset(pct: number): string {
  return `calc(${pct}% + ${(11 - pct * 0.22).toFixed(2)}px)`;
}

function Slider({ label, tip, value, min, max, step, onChange, context, ticks }: {
  label: string; tip: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; context: string; ticks: readonly number[];
}): React.ReactElement {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="flex items-baseline justify-between" style={{ marginBottom: "10px" }}>
        <span className="inline-flex items-center" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", fontWeight: 600, color: INK, letterSpacing: "-0.01em" }}>
          {label}
          <InfoTip label={label} text={tip} />
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <input
        type="range"
        className="impact-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={`${value}, ${context}`}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--pct" as string]: `${pct}%` }}
      />
      {/* Band markers: the score steps here, so telegraph it. Decorative:
          the band name is already announced through aria-valuetext. */}
      <div aria-hidden className="relative" style={{ height: "16px", marginTop: "3px" }}>
        {ticks.map((t) => {
          const tickPct = ((t - min) / (max - min)) * 100;
          const passed = value > t;
          return (
            <span key={t} className="absolute flex flex-col items-center" style={{ left: thumbOffset(tickPct), transform: "translateX(-50%)", top: 0 }}>
              <span style={{ width: "1.5px", height: "5px", borderRadius: "1px", background: passed ? "rgba(57,96,249,0.55)" : "rgba(17,17,17,0.18)", transition: "background .15s" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", lineHeight: 1.1, marginTop: "2px", color: passed ? ACCENT : MUTED, fontVariantNumeric: "tabular-nums", transition: "color .15s" }}>{t}</span>
            </span>
          );
        })}
      </div>
      <div className="flex justify-between items-center" style={{ marginTop: "4px" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: SUB }}>{context}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "11.5px", color: MUTED, fontVariantNumeric: "tabular-nums" }}>{min} to {max}</span>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ label, tip, options, value, onChange }: {
  label: string; tip: string; options: readonly T[]; value: T; onChange: (v: T) => void;
}): React.ReactElement {
  return (
    <div style={{ marginBottom: "20px" }}>
      <span className="inline-flex items-center" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)", fontWeight: 600, color: INK, letterSpacing: "-0.01em", marginBottom: "10px" }}>
        {label}
        <InfoTip label={label} text={tip} />
      </span>
      <fieldset aria-label={label} className="grid" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: "6px", padding: "5px", background: "#eef0f4", borderRadius: "12px", border: "none", margin: 0, minInlineSize: 0 }}>
        {options.map((opt) => {
          const on = opt === value;
          return (
            <button key={opt} type="button" onClick={() => onChange(opt)} aria-pressed={on}
              style={{
                fontFamily: "var(--font-sans)", fontSize: "13.5px", fontWeight: 600, height: "40px", borderRadius: "8px", border: "none", cursor: "pointer",
                background: on ? "linear-gradient(135deg,#3960F9,#471ec0)" : "transparent",
                color: on ? "#fff" : "#565b6b",
                boxShadow: on ? "0 2px 8px rgba(57,96,249,0.28)" : "none",
                transition: "color 0.18s, box-shadow 0.18s",
              }}>
              {opt}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}

/* ── copy link: the four inputs travel in the URL, nothing else ── */
function CopyResultsLink({ input }: { input: RoiInput }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const search = buildEstimatorSearch(input);
  const copyLink = useCallback(async (): Promise<void> => {
    const ok = await copyText(`${window.location.origin}${window.location.pathname}${search}`);
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }, [search]);

  return (
    <button
      type="button"
      onClick={() => void copyLink()}
      title="The link carries only these four inputs, so a teammate opens the same result."
      className="cs-btn-blue flex-none"
      style={{ gap: "8px", ["--cs-btn-h" as string]: "40px", ["--cs-btn-fs" as string]: "14px", ["--cs-btn-px" as string]: "16px" }}
    >
      <span aria-hidden style={{ display: "inline-flex" }}>
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>
        )}
      </span>
      <span aria-live="polite">{copied ? "Link copied" : "Copy link to results"}</span>
    </button>
  );
}

/* ── mobile summary strip: keeps the result in view while the inputs are ── */
function MobileSummary({ visible, tier, burden, hours, onJump }: {
  visible: boolean; tier: TierName; burden: number; hours: number; onJump: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onJump}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label={`Jump to your results: ${tier} runtime complexity, burden ${Math.round(burden)}, ${Math.round(hours).toLocaleString("en-US")} hours recovered per year`}
      className="lg:hidden fixed z-40 flex items-center justify-between"
      style={{
        left: "16px", right: "16px", bottom: "calc(16px + env(safe-area-inset-bottom))",
        gap: "12px", padding: "12px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(120deg,#151021,#1c1a63 60%,#3b1f9e)", boxShadow: "0 14px 34px -14px rgba(17,17,17,0.55)",
        color: "#fff", textAlign: "left", cursor: "pointer",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", pointerEvents: visible ? "auto" : "none",
        transition: "opacity .22s ease, transform .22s ease",
      }}
    >
      <span className="flex items-center" style={{ gap: "10px", minWidth: 0 }}>
        <span style={{ padding: "3px 9px", borderRadius: "999px", background: TIER_COLOR[tier], color: tier === "Low" ? INK : "#fff", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{tier}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
          Burden <b style={{ color: "#fff", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Math.round(burden)}</b>
        </span>
      </span>
      <span className="flex items-center" style={{ gap: "8px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{Math.round(hours).toLocaleString("en-US")}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>hrs / yr</span>
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2cc1eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </span>
    </button>
  );
}

export function ImpactSimulator(): React.ReactElement {
  const [input, setInput] = useState<RoiInput>(DEFAULT_INPUT);
  const [mounted, setMounted] = useState(false);
  const touched = useRef(false);
  const reduce = useReducedMotion();
  const inputsRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const [inputsInView, setInputsInView] = useState(false);
  const [gaugeInView, setGaugeInView] = useState(false);

  // Adopt a shared link's inputs once, after hydration, so the server and the
  // client render the same defaults first.
  useEffect(() => {
    const fromUrl = parseEstimatorSearch(window.location.search);
    if (Object.keys(fromUrl).length > 0) setInput((prev) => ({ ...prev, ...fromUrl }));
    setMounted(true);
  }, []);

  // Mirror the user's changes into the address bar so it is always shareable.
  // Skipped for the initial state and for a link-driven load, which is already
  // in the URL.
  useEffect(() => {
    if (!touched.current) return;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${buildEstimatorSearch(input)}${window.location.hash}`);
  }, [input]);

  // The strip shows while the user is working the inputs and the gauge, the
  // actual readout, is not yet mostly on screen. The inputs observer trims the
  // bottom 45% of the viewport so the card only counts once it has climbed into
  // the working area, not the moment it peeks in under the hero. The gauge is
  // watched rather than the whole results column because a tall column counts
  // as visible long before its first number can be read.
  useEffect(() => {
    const inputs = inputsRef.current;
    const gauge = gaugeRef.current;
    if (!inputs || !gauge || typeof IntersectionObserver === "undefined") return;
    const watchInputs = new IntersectionObserver(([e]) => setInputsInView(e?.isIntersecting ?? false), { rootMargin: "0px 0px -45% 0px" });
    const watchGauge = new IntersectionObserver(([e]) => setGaugeInView(e?.isIntersecting ?? false), { threshold: 0.6 });
    watchInputs.observe(inputs);
    watchGauge.observe(gauge);
    return () => {
      watchInputs.disconnect();
      watchGauge.disconnect();
    };
  }, []);

  const update = (patch: Partial<RoiInput>): void => {
    touched.current = true;
    setInput((prev) => ({ ...prev, ...patch }));
  };
  const jumpToResults = (): void => {
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const out = computeImpact(input);

  const vuln = useTweenNumber(out.vuln, mounted);
  const patch = useTweenNumber(out.patch, mounted);
  const releaseX = useTweenNumber(out.release, mounted);
  const footprint = useTweenNumber(out.footprint, mounted);
  const hours = useTweenNumber(out.hoursRecovered, mounted);
  const fte = useTweenNumber(out.fteRecovered, mounted);
  const meter = useTweenNumber(out.meterProgress, mounted, 650);
  const burden = useTweenNumber(out.burden, mounted, 650);
  const reduction = useTweenNumber(out.burdenReduction, mounted);

  const cardData: Record<MetricDef["key"], { value: string; raw: number; band: readonly [number, number]; suffix: string }> = {
    vuln: { value: `${Math.round(vuln)}%`, raw: vuln, band: out.bands.vuln, suffix: "%" },
    patch: { value: `${Math.round(patch)}%`, raw: patch, band: out.bands.patch, suffix: "%" },
    release: { value: `${(Math.round(releaseX * 10) / 10).toFixed(1)}×`, raw: releaseX, band: out.bands.release, suffix: "×" },
    footprint: { value: `${Math.round(footprint)}%`, raw: footprint, band: out.bands.footprint, suffix: "%" },
  };

  // ANNUAL_ENG_HOURS is a 40-hour-week working year net of leave, so dividing
  // by 40 gives the weeks it spans.
  const hoursPerWeek = out.hoursPerEngineer / (ANNUAL_ENG_HOURS / 40);

  // No overflow-hidden on the section: an overflow-clipping ancestor turns
  // position: sticky off, and the inputs card relies on it. The decorative blob
  // is clipped inside its own absolutely positioned layer instead.
  return (
    <section data-section="ImpactSimulator" aria-label="Operational impact simulator" className="relative" style={{ background: "#F6F6F6" }}>
      <div aria-hidden className="pointer-events-none select-none absolute inset-0 overflow-hidden hidden lg:block">
        <div className="absolute" style={{ right: "-160px", top: "-120px", width: "480px", height: "480px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(71,30,192,0.10), rgba(255,255,255,0))" }} />
      </div>

      <style>{`
        .impact-slider{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:999px;outline:none;cursor:pointer;
          background:linear-gradient(90deg,#3960F9 0%,#471ec0 var(--pct,50%),rgba(17,17,17,0.09) var(--pct,50%));}
        .impact-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;
          border:none;box-shadow:0 1px 4px rgba(17,17,17,0.28),0 0 0 5px rgba(57,96,249,0.22);cursor:pointer;transition:box-shadow .15s,transform .1s;}
        .impact-slider::-webkit-slider-thumb:hover{box-shadow:0 1px 5px rgba(17,17,17,0.32),0 0 0 7px rgba(57,96,249,0.26);}
        .impact-slider::-webkit-slider-thumb:active{transform:scale(1.08);}
        .impact-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:none;
          box-shadow:0 1px 4px rgba(17,17,17,0.28),0 0 0 5px rgba(57,96,249,0.22);cursor:pointer;}
        .impact-slider:focus-visible{outline:2px solid #33BAEC;outline-offset:4px;}
        .impact-card{transition:transform .22s cubic-bezier(.2,.7,.3,1),box-shadow .22s;}
        .impact-card:hover{transform:translateY(-3px);box-shadow:0 12px 30px -12px rgba(17,17,17,0.18);}
      `}</style>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md">
        <div className="grid grid-cols-1 gap-6 lg:gap-7 lg:grid-cols-[minmax(0,370px)_minmax(0,1fr)] lg:items-start">
          {/* ── inputs: sticky beside the results on desktop ── */}
          <div ref={inputsRef} className="lg:sticky" style={{ top: "calc(var(--cs-header-h) + 24px)", background: "#ffffff", borderRadius: "var(--radius-cs-card)", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 2px 10px -4px rgba(17,17,17,0.08)", padding: "clamp(22px,1.8vw,28px)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h4)", fontWeight: 600, color: INK, letterSpacing: "-0.02em" }}>Your environment</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: MUTED, marginTop: "4px", marginBottom: "24px" }}>Four signals describe your runtime.</p>

            <Slider label="Production images" tip="Distinct container images running in production. Each one is a surface you patch, scan, and secure." value={input.images} min={INPUT_BOUNDS.images.min} max={INPUT_BOUNDS.images.max} step={INPUT_STEP.images} onChange={(v) => update({ images: v })} context={bandLabel(input.images, IMAGE_WEIGHT_THRESHOLDS, IMAGE_LABELS)} ticks={IMAGE_WEIGHT_THRESHOLDS} />
            <Slider label="Engineering team size" tip="People building or maintaining the services that run on these images." value={input.team} min={INPUT_BOUNDS.team.min} max={INPUT_BOUNDS.team.max} step={INPUT_STEP.team} onChange={(v) => update({ team: v })} context={bandLabel(input.team, TEAM_WEIGHT_THRESHOLDS, TEAM_LABELS)} ticks={TEAM_WEIGHT_THRESHOLDS} />
            <Segmented label="Remediation frequency" tip="How often your team patches known vulnerabilities (CVEs) in running images." options={REMEDIATION_OPTIONS} value={input.remediation} onChange={(v) => update({ remediation: v })} />
            <Segmented label="Release cadence" tip="How often you ship changes to production." options={RELEASE_OPTIONS} value={input.release} onChange={(v) => update({ release: v })} />

            <p style={{ display: "flex", gap: "7px", alignItems: "center", fontFamily: "var(--font-sans)", fontSize: "12px", color: MUTED, marginTop: "4px", paddingTop: "18px", borderTop: "1px solid rgba(17,17,17,0.06)" }}>
              <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Inputs stay in your browser. Nothing is sent or stored.
            </p>
          </div>

          {/* ── results narrative ── */}
          <div ref={resultsRef} className="flex flex-col gap-5" style={{ scrollMarginTop: "calc(var(--cs-header-h) + 16px)" }}>
            {/* The results have no visible title (the gauge is the title), so the
                outline gets a screen-reader heading to sit level with "Your environment". */}
            <h2 className="sr-only">Your estimated outcomes</h2>
            {/* operational burden: gauge, tier, reduction, breakdown */}
            <div className="impact-card" style={{ background: "#ffffff", borderRadius: "var(--radius-cs-card)", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 2px 10px -4px rgba(17,17,17,0.08)", padding: "clamp(20px,1.8vw,26px)" }}>
              <div className="grid items-center gap-6 grid-cols-1 sm:grid-cols-[minmax(190px,216px)_1fr]">
                <div ref={gaugeRef} className="flex justify-center">
                  <RadialGauge progress={meter} tier={out.tier} burden={burden} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                    <span className="cs-text-gradient-impact">{out.tier}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: MUTED, marginLeft: "10px", verticalAlign: "middle", letterSpacing: 0 }}>Runtime Complexity</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: SUB, lineHeight: 1.5, marginTop: "8px", maxWidth: "42ch", textWrap: "balance" }}>{TIER_BLURB[out.tier]}</p>

                  {/* Burden Reduction keys off the score, not the tier, so it
                      belongs beside the gauge rather than in the improvements grid. */}
                  <div className="inline-flex items-center" style={{ gap: "12px", marginTop: "14px", padding: "11px 16px", borderRadius: "12px", background: `${TIER_COLOR[out.tier]}12`, border: `1px solid ${TIER_COLOR[out.tier]}33` }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: TIER_COLOR[out.tier], fontVariantNumeric: "tabular-nums" }}>
                      {Math.round(reduction)}%
                    </span>
                    {/* Plain span, NOT inline-flex: the label and its InfoTip have to
                        flow as one run of text so the icon trails the last word. As a
                        flex container the raw text became its own anonymous item and
                        the icon was pushed out to the pill's right edge. */}
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: SUB, lineHeight: 1.35, maxWidth: "26ch", textWrap: "balance" }}>
                      Burden Reduction on trusted images{" "}
                      <InfoTip label="Burden Reduction" text="The share of your Operational Burden Score removed on minimal, trusted images: images, team, patching and release cadence combined. The improvement figures below break out where that reduction comes from." />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* expected improvements */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(212px,1fr))]">
              {METRICS.map((m) => {
                const d = cardData[m.key];
                const pos = clamp01((d.raw - d.band[0]) / (d.band[1] - d.band[0]));
                return (
                  <div key={m.key} className="impact-card relative overflow-hidden flex flex-col h-full p-4 sm:px-5 sm:pt-[22px] sm:pb-5" style={{ background: "#ffffff", borderRadius: "var(--radius-cs-card)", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 1px 3px rgba(17,17,17,0.05)" }}>
                    <div aria-hidden className="pointer-events-none absolute" style={{ right: "-30px", top: "-30px", width: "110px", height: "110px", borderRadius: "50%", background: `radial-gradient(closest-side, ${m.accent}1f, transparent)` }} />
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", borderRadius: "13px", background: `linear-gradient(135deg, ${m.accent}22, ${m.accent}10)`, color: m.accent, marginBottom: "16px" }}>{m.icon}</span>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,2.4vw,32px)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em", color: INK, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{d.value}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: INK, lineHeight: 1.3, marginTop: "10px", textWrap: "balance" }}>{m.title}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "12.5px", color: MUTED, lineHeight: 1.35, marginTop: "3px" }}>{m.sub}</div>
                    <div style={{ marginTop: "auto", paddingTop: "16px" }}>
                      <div className="relative" style={{ height: "5px", borderRadius: "999px", background: `${m.accent}1a` }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pos * 100}%`, borderRadius: "999px", background: m.accent, transition: "width .12s linear" }} />
                        <div aria-hidden style={{ position: "absolute", top: "50%", left: `${pos * 100}%`, transform: "translate(-50%,-50%)", width: "11px", height: "11px", borderRadius: "50%", background: "#fff", border: `2px solid ${m.accent}`, transition: "left .12s linear" }} />
                      </div>
                      <div className="flex justify-between items-baseline" style={{ marginTop: "6px", gap: "6px", fontFamily: "var(--font-sans)", fontSize: "11px", color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                        <span>{d.band[0]}{d.suffix}</span>
                        <span style={{ textAlign: "center", whiteSpace: "nowrap" }}>{out.tier} tier range</span>
                        <span>{d.band[1]}{d.suffix}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* recovered engineering capacity */}
            <div className="impact-card relative overflow-hidden" style={{ borderRadius: "var(--radius-cs-card)", padding: "clamp(22px,2vw,28px)", background: "linear-gradient(120deg, #151021 0%, #1c1a63 55%, #3b1f9e 100%)", boxShadow: "0 10px 30px -12px rgba(30,20,120,0.5)" }}>
              <div aria-hidden className="pointer-events-none absolute" style={{ right: "-60px", bottom: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(44,193,235,0.28), transparent)" }} />
              <div className="relative flex flex-wrap items-end justify-between" style={{ gap: "20px 24px" }}>
                <div style={{ minWidth: "220px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.66)" }}>
                    <span style={{ color: "#2cc1eb" }}>{stroke("M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z")}</span>
                    Hours recovered per year
                  </span>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: "#fff", marginTop: "10px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {Math.round(hours).toLocaleString("en-US")}
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "rgba(255,255,255,0.74)", lineHeight: 1.5, marginTop: "12px", maxWidth: "34ch" }}>
                    Roughly <strong style={{ color: "#fff", fontWeight: 700 }}>{fte.toFixed(1)} full-time engineers</strong> of capacity, won back from vulnerability toil.
                  </p>
                </div>
                {/* supporting stats: a fixed 3-up so they never wrap 2 plus 1 */}
                <div className="grid grid-cols-3 w-full sm:w-auto">
                  {[
                    { v: out.hoursPerEngineer.toLocaleString("en-US"), l: "hrs / engineer / yr" },
                    { v: input.team.toString(), l: "engineers" },
                    { v: hoursPerWeek.toFixed(1), l: "hrs / engineer / wk" },
                  ].map((s, i) => (
                    <div key={s.l} className="flex flex-col" style={{ padding: i === 0 ? "2px 14px 2px 0" : "2px 14px", borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.16)" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px,1.6vw,22px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "11.5px", color: "rgba(255,255,255,0.6)", marginTop: "3px", lineHeight: 1.3 }}>{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* trust line, with the share action beside it rather than inside the hours card */}
            {/* Text left, action right on every width from sm up; only phones stack. */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: "12px 20px", marginTop: "2px" }}>
              <p className="inline-flex items-start sm:flex-1 min-w-0" style={{ fontFamily: "var(--font-sans)", fontSize: "12.5px", color: MUTED, lineHeight: 1.55 }}>
                Estimated outcomes, modeled from industry benchmarks and organizations with similar runtime profiles. Directional, not a guarantee.
                <InfoTip label="how these estimates work" text="We don't scan your systems. These ranges reflect typical results for environments with a comparable burden profile. Book a demo to measure your actual images." />
                {" "}
                <Link href="/book-a-demo" style={{ color: ACCENT, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px", whiteSpace: "nowrap" }}>Measure your real images</Link>
              </p>
              <CopyResultsLink input={input} />
            </div>
          </div>
        </div>
      </div>

      <MobileSummary visible={mounted && inputsInView && !gaugeInView} tier={out.tier} burden={burden} hours={hours} onJump={jumpToResults} />
    </section>
  );
}
