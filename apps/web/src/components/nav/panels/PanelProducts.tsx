import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { HeroTile } from "@/components/nav/pieces/HeroTile";
import { ImageMeta } from "@/components/nav/pieces/ImageMeta";
import { CopyableCommand } from "@/components/nav/pieces/CopyableCommand";
import type { NavMegaItem } from "@/lib/nav-config";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { item: NavMegaItem; latestImages: CommunityImage[] };

// Brand-family atmosphere for Products: a 5% indigo wash in the top-right.
const ATMOSPHERE = "rgba(100, 13, 251, 0.05)";

export function PanelProducts({ item, latestImages }: Props) {
  const products = item.groups[0]?.items ?? [];
  // The pool is sorted most-recent-first, so index 0 is the latest-updated image.
  const chosen = latestImages[0];

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
      <div className="grid grid-cols-[1.55fr_1fr] gap-3.5">
        <div className="flex flex-col gap-1.5">
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

        <HeroTile
          headline="Stop patching. Replace the base."
          sub="Drop-in compatible, hardened base images — signed, minimal, and built to cut your CVE surface."
          ctaLabel="Explore hardened images"
          ctaHref="/cleanstart-images"
          minHeight={216}
        >
          {chosen && (
            <div className="flex flex-col gap-3">
              <ImageMeta image={chosen} />
              <CopyableCommand command={`$ docker pull cleanstart/${chosen.name}:latest`} />
            </div>
          )}
        </HeroTile>
      </div>
    </PanelShell>
  );
}
