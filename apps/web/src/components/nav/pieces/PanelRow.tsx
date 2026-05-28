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
// No box-shadow glow. No accent-color border. No icon-tile gradient.
// No arrow translate. No arrow color shift to accent.
const ROW =
  "group/row grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 transition-colors duration-150 hover:border-white/[0.06] hover:bg-white/[0.04]";
const ICON_TILE =
  "flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/[0.06] bg-white/[0.04] text-white/75 transition-colors duration-150 group-hover/row:bg-white/[0.06] group-hover/row:text-white";
const LABEL = "text-sm font-semibold leading-tight text-white";
const DESC = "mt-0.5 text-xs leading-snug text-white/55";
const ARROW =
  "text-sm text-white/25 transition-colors duration-150 group-hover/row:text-white/60";

export function PanelRow({ href, label, description, icon, built = true }: Props) {
  const inner = (
    <>
      <div className={ICON_TILE}>
        <NavIcon id={icon} size={18} />
      </div>
      <div>
        <div className={LABEL}>{label}</div>
        {description && <div className={DESC}>{description}</div>}
      </div>
      <div className={ARROW}>→</div>
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
