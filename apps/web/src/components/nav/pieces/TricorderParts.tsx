// The four stages the /tricorder page shows (TricorderPipeline), reduced to a glance.
const STAGES = ["Analyze", "Compare", "Correlate", "Enrich"] as const;

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
