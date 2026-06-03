import { PanelShell } from "@/components/nav/panels/PanelShell";
import { PersonaCard } from "@/components/nav/pieces/PersonaCard";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

// Brand-family atmosphere for Audience: a low purple wash in the top-right.
const ATMOSPHERE = "rgba(123, 70, 230, 0.06)";

// Value-led action per persona, matched to the menu tagline ("the people who
// ship and the people who sign off"). Keyed by position so it survives a label
// rename in nav-config.
const CTAS = ["See what developers get", "See what CISOs get"];

export function PanelAudience({ item }: Props) {
  const items = item.groups[0]?.items ?? [];
  const dev = items[0];
  const ciso = items[1];
  return (
    <PanelShell
      width={item.width ?? 640}
      eyebrow={item.label}
      tagline={item.tagline}
      atmosphere={ATMOSPHERE}
    >
      <div className="grid grid-cols-2 gap-3">
        {dev && (
          <PersonaCard
            href={dev.href}
            icon={dev.icon ?? "tools"}
            label={dev.label}
            description={dev.description ?? ""}
            cta={CTAS[0]!}
          />
        )}
        {ciso && (
          <PersonaCard
            href={ciso.href}
            icon={ciso.icon ?? "hash"}
            label={ciso.label}
            description={ciso.description ?? ""}
            cta={CTAS[1]!}
          />
        )}
      </div>
    </PanelShell>
  );
}
