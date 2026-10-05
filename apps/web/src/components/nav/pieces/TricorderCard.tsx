import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import { VERDICT } from "@/components/sections/tricorder/tricorder-palette";

type Props = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

// The four stages and three outcomes are the ones the /tricorder page shows
// (TricorderPipeline), reduced to a single glance.
const STAGES = ["Analyze", "Compare", "Correlate", "Enrich"] as const;
const OUTCOMES = [
  { label: "Pass", color: VERDICT.pass },
  { label: "Uncertain", color: VERDICT.uncertain },
  { label: "Malicious", color: VERDICT.malicious },
] as const;

/**
 * Tricorder's slot in the Products menu. It is the platform under the three
 * products, not a fourth product, so it sits in its own column on the elevated
 * hero surface and shows what it does (stages in, verdict out) instead of
 * reading as another row. Nothing inside is interactive, so the whole card is
 * the link.
 */
export function TricorderCard({ href, label, description, icon }: Props) {
  return (
    <Link
      href={href}
      className="cs-hero-surface group/cta flex h-full flex-col justify-between rounded-[14px] p-4 text-white outline-none transition-[box-shadow] duration-200 ease-out hover:shadow-[inset_0_1px_0_rgba(140,120,255,0.4),0_1px_0_rgba(0,0,0,0.25),0_12px_32px_-20px_rgba(0,0,0,0.6)] focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="cs-chip flex h-11 w-11 items-center justify-center rounded-[8px]">
            <NavIcon id={icon} size={22} className="cs-nav-glyph" />
          </div>
          <span className="mt-0.5 inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-white/70">
            Powers all three
          </span>
        </div>

        <div className="mt-3.5 text-[19px] font-semibold leading-[1.15] tracking-[-0.015em] text-white/95">
          {label}
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{description}</p>
      </div>

      <div>
        <ol className="relative mt-4 flex items-start justify-between">
          <span
            aria-hidden
            className="absolute left-2 right-2 top-[4px] h-px bg-white/[0.12]"
          />
          {STAGES.map((stage) => (
            <li key={stage} className="relative flex flex-col items-center gap-1.5">
              <span
                aria-hidden
                className="h-[9px] w-[9px] rounded-full border border-[#2cc1eb]/70 bg-[var(--cs-surface-2)]"
              />
              <span className="text-[10.5px] font-medium text-white/65">{stage}</span>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex items-center gap-1.5">
          <span className="mr-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
            Verdict
          </span>
          {OUTCOMES.map((o) => (
            <span
              key={o.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-medium text-white/70"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: o.color }}
              />
              {o.label}
            </span>
          ))}
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2cc1eb]">
          Explore {label}
          <ArrowGlyph direction="right" size={13} />
        </span>
      </div>
    </Link>
  );
}
