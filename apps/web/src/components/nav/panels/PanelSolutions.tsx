import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { HeroTile } from "@/components/nav/pieces/HeroTile";
import { ComplianceProof } from "@/components/nav/pieces/ComplianceProof";
import { CopyableCommand } from "@/components/nav/pieces/CopyableCommand";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

// Brand-family atmosphere for Solutions: a low cyan-teal wash in the top-right.
const ATMOSPHERE = "rgba(44, 193, 235, 0.05)";

export function PanelSolutions({ item }: Props) {
  const solutions = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      eyebrow={item.label}
      tagline={item.tagline}
      atmosphere={ATMOSPHERE}
    >
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-0.5">
          {solutions.map((s) => (
            <PanelRow
              key={s.label}
              href={s.href}
              label={s.label}
              {...(s.description ? { description: s.description } : {})}
              icon={s.icon ?? "shield-check"}
              built={s.built !== false}
            />
          ))}
        </div>

        <HeroTile
          headline="FIPS, drop-in."
          sub="Validated crypto, no code change. Inherit compliance from the base."
          ctaLabel="Inherit FIPS compliance"
          ctaHref="/fips"
          minHeight={262}
        >
          <ComplianceProof />
          <div className="mt-3">
            <CopyableCommand command="$ docker pull cleanstart/python-fips" />
          </div>
        </HeroTile>
      </div>
    </PanelShell>
  );
}
