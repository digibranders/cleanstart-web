import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";
import { JobsCard, BRAND_GRADIENT } from "@/components/nav/pieces/JobsCard";
import type { NavLeaf } from "@/lib/nav-config";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = { rows: NavLeaf[]; spotlight: SpotlightCard; openRolesCount: number };

/**
 * Company panel body: nav rows on the left, a stacked spotlight + jobs card on
 * the right. When roles are open the spotlight renders dense (content height)
 * above the {@link JobsCard}; with none open the spotlight fills the column on
 * its own, so the menu never shows an empty "0 open roles" card.
 */
export function CompanyColumns({ rows, spotlight, openRolesCount }: Props) {
  const hasRoles = openRolesCount > 0;
  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
      <div className="flex flex-col gap-0.5">
        {rows.map((r) => (
          <PanelRow
            key={r.label}
            href={r.href}
            label={r.label}
            {...(r.description ? { description: r.description } : {})}
            icon={r.icon ?? "info"}
            built={r.built !== false}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3.5">
        {hasRoles ? (
          <>
            <SpotlightRenderer
              spotlight={spotlight}
              hero
              dense
              style={{ background: BRAND_GRADIENT }}
            />
            <JobsCard count={openRolesCount} />
          </>
        ) : (
          <SpotlightRenderer spotlight={spotlight} hero />
        )}
      </div>
    </div>
  );
}
