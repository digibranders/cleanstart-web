import Link from "next/link";

type Props = {
  headline: string;
  sub?: string;
  ctaLabel: string;
  ctaHref: string;
};

export function ContextualCTA({ headline, sub, ctaLabel, ctaHref }: Props) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2.5 rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
      <div className="text-xs font-semibold text-white">
        {headline}
        {sub && <span className="ml-1.5 font-normal text-white/55">{sub}</span>}
      </div>
      <Link
        href={ctaHref}
        className="cs-btn-glass inline-flex items-center justify-center whitespace-nowrap"
        style={{
          ["--cs-btn-h" as string]: "34px",
          ["--cs-btn-px" as string]: "14px",
          ["--cs-btn-fs" as string]: "12px",
        }}
        aria-label={ctaLabel}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
