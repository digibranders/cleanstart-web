import { PanelShell } from "@/components/nav/panels/PanelShell";
import { CareersRevealColumn } from "@/components/nav/panels/CareersRevealColumn";
import type { NavMegaItem } from "@/lib/nav-config";
import type { SpotlightCard } from "@/components/nav/data/spotlights";
import type { OpenRole } from "@/components/nav/data/open-roles";

type Props = { item: NavMegaItem; spotlight: SpotlightCard; openRoles: OpenRole[] };

// Brand-family atmosphere for Company: a low lavender-violet wash in the top-right.
const ATMOSPHERE = "rgba(170, 130, 245, 0.05)";

export function PanelCompany({ item, spotlight, openRoles }: Props) {
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
      <CareersRevealColumn rows={rows} spotlight={spotlight} openRoles={openRoles} />
    </PanelShell>
  );
}
