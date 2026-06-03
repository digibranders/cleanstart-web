/**
 * Pure-CSS proof visual for the Solutions hero. Answers "why should I care?"
 * for the compliance buyer: validated crypto with no code change. Three
 * outcome checks in a branded recessed field — the only color is the single
 * brand accent (cyan) on the checkmarks; everything else is neutral tone.
 */
const CHECKS = ["FIPS 140-3 validated", "Zero code changes", "Drop-in replacement"];

export function ComplianceProof() {
  return (
    <div className="cs-recess-brand flex flex-col gap-2 rounded-[10px] px-3 py-2.5">
      {CHECKS.map((label) => (
        <div key={label} className="flex items-center gap-2.5">
          <Check />
          <span className="text-[12px] font-medium text-white/80">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Check() {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[rgba(44,193,235,0.12)]">
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2cc1eb"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}
