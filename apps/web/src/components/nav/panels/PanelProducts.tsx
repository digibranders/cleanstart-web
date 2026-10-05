import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { TricorderCard } from "@/components/nav/pieces/TricorderCard";
import { ImageMeta } from "@/components/nav/pieces/ImageMeta";
import { CopyableCommand } from "@/components/nav/pieces/CopyableCommand";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import type { NavMegaItem } from "@/lib/nav-config";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { item: NavMegaItem; latestImages: CommunityImage[] };

// Brand-family atmosphere for Products: a 5% indigo wash in the top-right.
const ATMOSPHERE = "rgba(100, 13, 251, 0.05)";

const COLUMN_LABEL =
  "px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40";

export function PanelProducts({ item, latestImages }: Props) {
  const products = item.groups[0]?.items ?? [];
  const platform = item.groups[1]?.items[0];
  // The pool is sorted most-recent-first, so index 0 is the latest-updated image.
  const chosen = latestImages[0];
  const catalogHref = item.exitHref ?? "https://images.cleanstart.com";
  const catalogLabel = item.exitLabel ?? "Browse all images";

  return (
    <PanelShell
      width={item.width ?? 880}
      eyebrow={item.label}
      tagline={item.tagline}
      atmosphere={ATMOSPHERE}
    >
      <div className="grid grid-cols-[1.12fr_1fr] gap-4">
        <div className="flex flex-col">
          <div className={COLUMN_LABEL}>What you deploy</div>
          <div className="flex flex-1 flex-col gap-1.5">
            {products.map((p) => (
              // flex-1 stretches each row so the column matches the Tricorder
              // card's height and every row keeps a generous hit area.
              <div key={p.label} className="flex flex-1 flex-col [&>*]:flex-1">
                <PanelRow
                  href={p.href}
                  label={p.label}
                  {...(p.description ? { description: p.description } : {})}
                  icon={p.icon ?? "container"}
                  built={p.built !== false}
                />
              </div>
            ))}
          </div>
        </div>

        {platform && (
          <div className="flex flex-col">
            <div className={COLUMN_LABEL}>What powers it</div>
            <div className="flex-1">
              <TricorderCard
                href={platform.href}
                label={platform.label}
                description={platform.description ?? ""}
                icon={platform.icon ?? "lens"}
              />
            </div>
          </div>
        )}
      </div>

      {/* The catalog strip owns the image action (and the live pull command),
          so the panel header carries no separate exit link. */}
      <div className="mt-3.5 flex items-center gap-4 rounded-[12px] bg-white/[0.03] px-4 py-3">
        <div className="w-[228px] shrink-0">
          <div className="text-[13px] font-semibold leading-tight text-white/90">
            Stop patching. Replace the base.
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-white/50">
            Drop-in hardened images.
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {chosen && (
            <div className="flex flex-col gap-2">
              <ImageMeta image={chosen} />
              <CopyableCommand command={`$ docker pull cleanstart/${chosen.name}:latest`} />
            </div>
          )}
        </div>

        <a
          href={catalogHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group/cta ml-auto inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-[#2cc1eb]"
        >
          {catalogLabel}
          <ArrowGlyph direction="up-right" size={13} />
        </a>
      </div>
    </PanelShell>
  );
}
