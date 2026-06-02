import Link from "next/link";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import type { OpenRole } from "@/components/nav/data/open-roles";

const ACCENT = "#a78bfa";

/**
 * The open-roles roster shown in the Company mega menu when "Careers" is
 * hovered/focused. Fixed height (matches the careers spotlight); the list
 * scrolls, the header and "View all" footer stay put.
 */
export function OpenRolesCard({ roles }: { roles: OpenRole[] }) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
      <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
        Open roles · {roles.length}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto pr-1">
        {roles.map((role) => (
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
        className="mt-2 inline-flex items-center gap-1.5 border-t border-white/10 px-1 pt-2.5 text-[11px] font-semibold"
        style={{ color: ACCENT }}
      >
        View all {roles.length} roles <ArrowGlyph direction="right" size={12} />
      </Link>
    </div>
  );
}
