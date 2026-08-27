import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { HeroTile } from "@/components/nav/pieces/HeroTile";
import { ComplianceProof } from "@/components/nav/pieces/ComplianceProof";
import type { NavGroup } from "@/lib/nav-config";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

// Brand-family atmosphere for Solutions: a low cyan-teal wash in the top-right.
const ATMOSPHERE = "rgba(44, 193, 235, 0.05)";

// Grouped, label-only columns (Capability / Compliance / By role). Descriptions
// live in nav-config for the mobile sheet; the desktop panel stays scannable and
// lets the group header + featured tile carry the narrative — same grammar as the
// Resources BrowseColumn.
function GroupColumn({ group }: { group: NavGroup }) {
  return (
    <div>
      {group.title && (
        <div className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
          {group.title}
        </div>
      )}
      <div className="flex flex-col">
        {group.items.map((leaf) =>
          leaf.built === false ? null : (
            <Link
              key={leaf.label}
              href={leaf.href}
              className="flex items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/[0.035]"
            >
              <NavIcon
                id={leaf.icon ?? "shield-check"}
                size={14}
                className="cs-nav-glyph"
              />
              {leaf.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export function PanelSolutions({ item }: Props) {
  const capability = item.groups.find((g) => g.title === "Capability");
  const compliance = item.groups.find((g) => g.title === "Compliance");
  const byRole = item.groups.find((g) => g.title === "By role");
  const byIndustry = item.groups.find((g) => g.title === "By industry");

  return (
    <PanelShell
      width={item.width ?? 1000}
      eyebrow={item.label}
      tagline={item.tagline}
      atmosphere={ATMOSPHERE}
    >
      <div className="grid grid-cols-3 gap-3">
        {/* Col 1: Capability stacked above Compliance */}
        <div className="flex flex-col gap-3">
          {capability && <GroupColumn group={capability} />}
          {compliance && (
            <>
              <div className="h-px bg-white/[0.05]" />
              <GroupColumn group={compliance} />
            </>
          )}
        </div>

        {/* Col 2: By Role stacked above By Industry, on the same divider
            grammar as Col 1. Col 2 held a single two-item group and ran short
            against Col 1's five, so the second group lands where the panel
            already had vertical room. */}
        <div className="flex flex-col gap-3">
          {byRole && <GroupColumn group={byRole} />}
          {byIndustry && (
            <>
              <div className="h-px bg-white/[0.05]" />
              <GroupColumn group={byIndustry} />
            </>
          )}
        </div>

        {/* Col 3: FIPS featured tile */}
        <HeroTile
          headline="FIPS, drop-in."
          ctaLabel="Inherit FIPS compliance"
          ctaHref="/fips"
          minHeight={0}
        >
          <ComplianceProof />
        </HeroTile>
      </div>
    </PanelShell>
  );
}
