import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";

type Props = {
  href: string;
  label: string;
  description?: string;
  icon: string;
  built?: boolean;
};

// Hover affordance is a quiet surface lift plus a subtle contrast increase on
// the glyph and label — no accent tint, no border flash. The icon tile is a
// neutral elevated surface so the glyph stays legible without color.
const ROW =
  "group/row grid grid-cols-[44px_1fr] items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors duration-200 ease-out hover:bg-white/[0.035]";
const ICON_TILE =
  "cs-chip flex h-11 w-11 items-center justify-center rounded-[8px] text-white/70 transition-colors duration-200 ease-out group-hover/row:text-white";
const LABEL =
  "text-sm font-semibold leading-tight text-white/95 transition-colors duration-200 ease-out group-hover/row:text-white";
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
