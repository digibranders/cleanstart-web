import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";

type Props = {
  href: string;
  label: string;
  description?: string;
  icon: string;
  built?: boolean;
};

// Hover affordance is a quiet surface lift on the row. The icon tile is a
// neutral elevated surface; the glyph itself carries the neon-cyan accent
// (see .cs-nav-glyph in globals.css).
const ROW =
  "group/row grid grid-cols-[44px_1fr] items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors duration-200 ease-out hover:bg-white/[0.035]";
const ICON_TILE =
  "cs-chip flex h-11 w-11 items-center justify-center rounded-[8px]";
const LABEL =
  "text-sm font-semibold leading-tight text-white/95 transition-colors duration-200 ease-out group-hover/row:text-white";
const DESC = "mt-0.5 text-xs leading-snug text-white/60";

export function PanelRow({ href, label, description, icon, built = true }: Props) {
  const inner = (
    <>
      <div className={ICON_TILE}>
        <NavIcon id={icon} size={20} className="cs-nav-glyph" />
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
