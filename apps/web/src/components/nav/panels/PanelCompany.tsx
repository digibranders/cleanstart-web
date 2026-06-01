import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";
import type { NavMegaItem } from "@/lib/nav-config";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = { item: NavMegaItem; spotlight: SpotlightCard };

// Brand-family atmosphere for Company: a low lavender-violet wash in the top-right.
const ATMOSPHERE = "rgba(170, 130, 245, 0.05)";

export function PanelCompany({ item, spotlight }: Props) {
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
        <SpotlightRenderer spotlight={spotlight} hero />
      </div>
    </PanelShell>
  );
}
