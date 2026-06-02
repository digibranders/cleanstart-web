import Link from "next/link";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import type { OpenRole } from "@/components/nav/data/open-roles";

const ACCENT = "#a78bfa";

// Roles to preview in the menu before deferring to "View all". The card is the
// height of the mega menu (~5 nav rows); seven ~32px rows plus the header and
// footer fill it without overflowing, so the list never needs to scroll.
const MAX_VISIBLE = 7;

/**
 * The open-roles roster shown in the Company mega menu when "Careers" is
 * hovered/focused. Previews the first {@link MAX_VISIBLE} roles; the header
 * badge and "View all N roles" footer always report the true total.
 */
export function OpenRolesCard({ roles }: { roles: OpenRole[] }) {
  return (
    <div className="flex h-full flex-col rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
      <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
        Open roles · {roles.length}
      </div>
      <ul className="pr-1">
        {roles.slice(0, MAX_VISIBLE).map((role) => (
          <li key={role.slug}>
            <Link
              href={`/careers/${role.slug}`}
              className="flex items-center justify-between gap-3 rounded-[8px] px-2 py-2 text-xs transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.06] focus-visible:outline-none"
            >
              <span className="truncate font-medium text-white/90">{role.title}</span>
              {role.location && (
                <span className="shrink-0 text-[11px] text-white/55">{role.location}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/careers"
        className="mt-auto inline-flex items-center gap-1.5 border-t border-white/10 px-1 pt-2.5 text-[11px] font-semibold"
        style={{ color: ACCENT }}
      >
        View all {roles.length} roles <ArrowGlyph direction="right" size={12} />
      </Link>
    </div>
  );
}
