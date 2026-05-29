"use client";

import { useEffect, useState } from "react";
import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import { CopyableCommand } from "@/components/nav/pieces/CopyableCommand";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import { imageDetailsHref } from "@/components/nav/data/latest-images";
import type { NavMegaItem } from "@/lib/nav-config";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { item: NavMegaItem; latestImages: CommunityImage[] };

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function PanelProducts({ item, latestImages }: Props) {
  const products = item.groups[0]?.items ?? [];
  const [chosen, setChosen] = useState<CommunityImage | undefined>(undefined);

  // Re-pick on mount. base-ui's NavigationMenuContent remounts its children
  // when the panel opens, so a fresh pick happens on every open.
  useEffect(() => {
    setChosen(pickRandom(latestImages));
  }, [latestImages]);

  const tile = chosen ? (
    <FeaturedTile
      href={imageDetailsHref(chosen.name)}
      accent="cyan"
      external
      headline="Stop patching. Replace the base."
      sub="Drop-in compatible with your stack. Near-zero CVEs at the base layer."
      footer={
        <div>
          <CopyableCommand command={`$ docker pull cleanstart/${chosen.name}:latest`} />
          <div className="group/cta mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]">
            Try {chosen.name}
            <ArrowGlyph direction="up-right" size={12} />
          </div>
        </div>
      }
    />
  ) : (
    <FeaturedTile
      href="/cleanstart-images"
      accent="cyan"
      headline="Stop patching. Replace the base."
      sub="Drop-in compatible with your stack. Near-zero CVEs at the base layer."
      footer={
        <div className="group/cta mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]">
          Browse images <ArrowGlyph direction="right" size={12} />
        </div>
      }
    />
  );

  return (
    <PanelShell
      width={item.width ?? 760}
      accent="cyan"
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
        {tile}
      </div>
      <ContextualCTA
        headline="See it running in your stack."
        sub="30-minute technical demo with an engineer."
        ctaLabel="Book a Demo"
        ctaHref="/book-a-demo"
      />
    </PanelShell>
  );
}
