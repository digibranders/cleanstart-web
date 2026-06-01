import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { CopyableCommand } from "@/components/nav/pieces/CopyableCommand";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import { imageDetailsHref } from "@/components/nav/data/latest-images";
import type { NavMegaItem } from "@/lib/nav-config";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { item: NavMegaItem; latestImages: CommunityImage[] };

const PRIMARY_CTA =
  "group/cta inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]";
const SECONDARY_CTA =
  "group/cta inline-flex items-center gap-1.5 text-[11px] font-medium text-white/55 transition-colors hover:text-white/80";

export function PanelProducts({ item, latestImages }: Props) {
  const products = item.groups[0]?.items ?? [];
  // The pool is sorted most-recent-first, so index 0 is the latest-updated image.
  const chosen = latestImages[0];
  const browseAllHref = item.exitHref;
  const browseAllLabel = item.exitLabel ?? "Browse all images";

  const tile = (
    <FeaturedTile
      accent="cyan"
      headline="Stop patching. Replace the base."
      sub="Drop-in compatible. Near-zero CVEs at the base."
      footer={
        <div>
          {chosen && (
            <CopyableCommand command={`$ docker pull cleanstart/${chosen.name}:latest`} />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {chosen && (
              <a
                href={imageDetailsHref(chosen.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={PRIMARY_CTA}
              >
                View {chosen.name}
                <ArrowGlyph direction="up-right" size={12} />
              </a>
            )}
            {browseAllHref && (
              <a
                href={browseAllHref}
                target="_blank"
                rel="noopener noreferrer"
                className={SECONDARY_CTA}
              >
                {browseAllLabel}
                <ArrowGlyph direction="up-right" size={12} />
              </a>
            )}
          </div>
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
        {tile}
      </div>
    </PanelShell>
  );
}
