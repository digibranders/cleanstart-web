import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import { CopyableCommand } from "@/components/nav/pieces/CopyableCommand";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

export function PanelSolutions({ item }: Props) {
  const solutions = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      accent="green"
      eyebrow={item.label}
      tagline={item.tagline}
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
        <FeaturedTile
          href="/fips"
          accent="green"
          minHeight={260}
          headline="FIPS, drop-in."
          sub="Validated cryptography, no code change. Replace base images, inherit compliance."
          footer={
            <div>
              <CopyableCommand command="$ docker pull cleanstart/python-fips" />
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6cffc2]">
                See FIPS stack <span className="text-sm">→</span>
              </div>
            </div>
          }
        />
      </div>
      <ContextualCTA
        headline="Mapping compliance for your stack?"
        sub="A solutions engineer will identify gaps and a remediation path."
        ctaLabel="Talk to an SE"
        ctaHref="/book-a-demo?intent=se"
      />
    </PanelShell>
  );
}
