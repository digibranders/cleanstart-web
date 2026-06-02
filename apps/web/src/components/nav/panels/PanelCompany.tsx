import { PanelShell } from "@/components/nav/panels/PanelShell";
import { CompanyColumns } from "@/components/nav/panels/CompanyColumns";
import type { NavMegaItem } from "@/lib/nav-config";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = { item: NavMegaItem; spotlight: SpotlightCard; openRolesCount: number };

// Brand-family atmosphere for Company: a low lavender-violet wash in the top-right.
const ATMOSPHERE = "rgba(170, 130, 245, 0.05)";

export function PanelCompany({ item, spotlight, openRolesCount }: Props) {
  const rows = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      eyebrow={item.label}
      tagline={item.tagline}
      atmosphere={ATMOSPHERE}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <CompanyColumns rows={rows} spotlight={spotlight} openRolesCount={openRolesCount} />
    </PanelShell>
  );
}
