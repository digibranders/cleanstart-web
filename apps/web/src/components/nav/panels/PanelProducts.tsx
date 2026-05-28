import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

export function PanelProducts({ item }: Props) {
  const products = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      accent={item.accent}
      eyebrow={item.label}
      tagline={item.tagline}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-1">
          {products.map((p) => (
            <PanelRow
              key={p.label}
              href={p.href}
              label={p.label}
              {...(p.description ? { description: p.description } : {})}
              icon={p.icon ?? "container"}
              built={p.built !== false}
            />
          ))}
        </div>
        <FeaturedTile
          href="/cleanstart-images"
          accent="cyan"
          headline="Stop patching. Replace the base."
          sub="Drop in hardened containers — keep your stack, lose the CVEs."
          footer={
            <div>
              <div className="rounded-md border border-white/[0.06] bg-black/25 px-2.5 py-2 font-mono text-[11px] text-white/85">
                <span className="text-white/40">$</span> docker pull cleanstart/python:latest
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]">
                Try python <span className="text-sm">→</span>
              </div>
            </div>
          }
        />
      </div>
      <ContextualCTA
        headline="Not sure where to start?"
        sub="Talk to an engineer — 15 minutes, no slides."
        ctaLabel="Book a Demo"
        ctaHref="/book-a-demo"
      />
    </PanelShell>
  );
}
