import { PanelShell } from "@/components/nav/panels/PanelShell";
import { PersonaCard } from "@/components/nav/pieces/PersonaCard";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

export function PanelAudience({ item }: Props) {
  const items = item.groups[0]?.items ?? [];
  const dev = items[0];
  const ciso = items[1];
  return (
    <PanelShell
      width={item.width ?? 640}
      accent="purple"
      eyebrow={item.label}
      tagline={item.tagline}
    >
      <div className="grid grid-cols-2 gap-3">
        {dev && (
          <PersonaCard
            href={dev.href}
            variant="developer"
            icon={dev.icon ?? "tools"}
            label={dev.label}
            description={dev.description ?? ""}
          />
        )}
        {ciso && (
          <PersonaCard
            href={ciso.href}
            variant="ciso"
            icon={ciso.icon ?? "hash"}
            label={ciso.label}
            description={ciso.description ?? ""}
          />
        )}
      </div>
    </PanelShell>
  );
}
