import { VERDICT } from "@/components/sections/tricorder/tricorder-palette";

// The four stages and three outcomes are the ones the /tricorder page shows
// (TricorderPipeline), reduced to a single glance.
const STAGES = ["Analyze", "Compare", "Correlate", "Enrich"] as const;
const OUTCOMES = [
  { label: "Pass", color: VERDICT.pass },
  { label: "Uncertain", color: VERDICT.uncertain },
  { label: "Malicious", color: VERDICT.malicious },
] as const;

export const SECTION_LABEL =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-white/40";

/** Four evenly spaced nodes on one rail, label under each. */
export function StageTrack() {
  return (
    <ol className="relative grid grid-cols-4">
      <span
        aria-hidden
        className="absolute left-[12.5%] right-[12.5%] top-[5px] h-px bg-gradient-to-r from-[#2cc1eb]/10 via-[#2cc1eb]/45 to-[#2cc1eb]/10"
      />
      {STAGES.map((stage) => (
        <li key={stage} className="relative flex flex-col items-center gap-2">
          <span
            aria-hidden
            className="flex h-[11px] w-[11px] items-center justify-center rounded-full border border-[#2cc1eb]/60 bg-[var(--cs-surface-2)]"
          >
            <span className="h-[3px] w-[3px] rounded-full bg-[#2cc1eb]" />
          </span>
          <span className="text-[10.5px] font-medium text-white/70">{stage}</span>
        </li>
      ))}
    </ol>
  );
}

/** The same four stages as a single line of text, for wide bars. */
export function StageInline() {
  return (
    <ol className="flex items-center gap-2 text-[11px] font-medium text-white/70">
      {STAGES.map((stage, i) => (
        <li key={stage} className="flex items-center gap-2">
          {i > 0 && (
            <svg width="5" height="8" viewBox="0 0 5 8" fill="none" aria-hidden className="text-white/25">
              <path d="M1 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {stage}
        </li>
      ))}
    </ol>
  );
}

export function VerdictPills() {
  return (
    <ul className="flex items-center gap-1.5">
      {OUTCOMES.map((o) => (
        <li
          key={o.label}
          className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-[10px] font-medium text-white/75"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: o.color }} />
          {o.label}
        </li>
      ))}
    </ul>
  );
}
