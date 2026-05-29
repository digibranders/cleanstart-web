import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";

type Props = {
  href: string;
  label: string;
  description?: string;
  icon: string;
  built?: boolean;
};

// Restrained-professional per D1: subtle fill + neutral border on hover.
// No glow. No accent-color border. Icon tiles get a slightly more present
// surface so the glyph reads cleanly against the new tighter glass.
// Arrows removed entirely — the row's hover lift + label brightness IS the
// affordance. Trailing arrows were redundant + dim.
const ROW =
  "group/row grid grid-cols-[44px_1fr] items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 transition-colors duration-150 hover:border-white/[0.08] hover:bg-white/[0.05]";
const ICON_TILE =
  "flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/[0.10] bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors duration-150 group-hover/row:border-[rgba(44,193,235,0.30)] group-hover/row:bg-[rgba(44,193,235,0.08)] group-hover/row:text-[#2cc1eb]";
const LABEL = "text-sm font-semibold leading-tight text-white";
const DESC = "mt-0.5 text-xs leading-snug text-white/60";

export function PanelRow({ href, label, description, icon, built = true }: Props) {
  const inner = (
    <>
      <div className={ICON_TILE}>
        <NavIcon id={icon} size={20} />
      </div>
      <div>
        <div className={LABEL}>{label}</div>
        {description && <div className={DESC}>{description}</div>}
      </div>
    </>
  );

  if (!built) {
    return (
      <span
        className={`${ROW} cursor-default opacity-60`}
        aria-disabled="true"
        tabIndex={-1}
      >
        {inner}
      </span>
    );
  }
  return (
    <Link href={href} className={ROW}>
      {inner}
    </Link>
  );
}
