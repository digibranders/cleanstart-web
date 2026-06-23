import { MegaPanel } from "@/components/nav/mega/MegaPanel";
import { MegaCard } from "@/components/nav/mega/MegaCard";
import { JobsCard } from "@/components/nav/pieces/JobsCard";
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";
import type { NavMegaItem } from "@/lib/nav-config";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = { item: NavMegaItem; spotlight: SpotlightCard; openRolesCount: number };

// Brand-family atmosphere for Company: a low lavender-violet wash in the top-right.
const ATMOSPHERE = "rgba(170, 130, 245, 0.1)";

export function PanelCompany({ item, spotlight, openRolesCount }: Props) {
  const rows = item.groups[0]?.items ?? [];
  const hasRoles = openRolesCount > 0;

  return (
    <MegaPanel width={item.width ?? 880} title={item.label} subtitle={item.tagline} atmosphere={ATMOSPHERE}>
      <div className="grid grid-cols-3 gap-3.5">
        {rows.map((r) => (
          <MegaCard
            key={r.label}
            href={r.href}
            label={r.label}
            {...(r.description ? { description: r.description } : {})}
            icon={r.icon ?? "info"}
            built={r.built !== false}
          />
        ))}
        {/* Sixth cell — the live featured slot: open-roles count when hiring,
            otherwise the editorial spotlight, so the menu never shows an empty
            "0 open roles" card. */}
        <div className="flex flex-col">
          {hasRoles ? (
            <JobsCard count={openRolesCount} />
          ) : (
            <SpotlightRenderer spotlight={spotlight} hero dense />
          )}
        </div>
      </div>
    </MegaPanel>
  );
}
