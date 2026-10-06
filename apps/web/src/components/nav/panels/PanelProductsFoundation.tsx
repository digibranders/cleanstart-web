import Link from "next/link";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import { ImageStrip } from "@/components/nav/pieces/ImageStrip";
import { SECTION_LABEL, StageInline, VerdictPills } from "@/components/nav/pieces/TricorderParts";
import type { NavMegaItem } from "@/lib/nav-config";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { item: NavMegaItem; latestImages: CommunityImage[] };

const ATMOSPHERE = "rgba(100, 13, 251, 0.05)";
const GAP = 12;

export function PanelProductsFoundation({ item, latestImages }: Props) {
  const products = item.groups[0]?.items ?? [];
  const platform = item.groups[1]?.items[0];
  const catalogHref = item.exitHref ?? "https://images.cleanstart.com";
  const catalogLabel = item.exitLabel ?? "Browse all images";
  // Centre of the first and last card, so the bus line spans exactly between them.
  const busInset = `calc((100% - ${GAP * 2}px) / 6)`;

  return (
    <PanelShell width={item.width ?? 880} eyebrow={item.label} tagline={item.tagline} atmosphere={ATMOSPHERE}>
      <div className="grid grid-cols-3" style={{ gap: GAP }}>
        {products.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="cs-tile-glass cs-tile-interactive group/card flex flex-col rounded-[12px] p-4 outline-none focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
          >
            <div className="flex items-start justify-between">
              <div className="cs-chip flex h-11 w-11 items-center justify-center rounded-[8px]">
                <NavIcon id={p.icon ?? "container"} size={22} className="cs-nav-glyph" />
              </div>
              <span className="text-white/25 transition-colors duration-200 group-hover/card:text-[#2cc1eb]">
                <ArrowGlyph direction="up-right" size={14} />
              </span>
            </div>
            <div className="mt-4 text-sm font-semibold leading-tight text-white/95">{p.label}</div>
            <div className="mt-1 text-xs leading-snug text-white/60">{p.description}</div>
          </Link>
        ))}
      </div>

      {platform && (
        <>
          {/* Connector: one stem per product joins a bus, and a single stem
              carries it into the platform bar. Decorative. */}
          <div aria-hidden className="relative h-10">
            <div className="absolute inset-x-0 top-0 grid h-4 grid-cols-3" style={{ gap: GAP }}>
              {products.map((p) => (
                <div key={p.label} className="mx-auto h-full w-px bg-white/[0.16]" />
              ))}
            </div>
            <div
              className="absolute top-4 h-px bg-white/[0.16]"
              style={{ left: busInset, right: busInset }}
            />
            <div className="absolute left-1/2 top-4 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-white/[0.16] to-[#2cc1eb]/70" />
            <span className="absolute left-1/2 top-4 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2cc1eb] shadow-[0_0_0_3px_var(--cs-surface-1)]" />
            <span className="absolute left-1/2 top-[22px] translate-x-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              Built on
            </span>
          </div>

          <Link
            href={platform.href}
            className="cs-hero-surface group/cta block rounded-[14px] px-5 py-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
          >
            <div className="flex items-center gap-4">
              <div className="cs-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px]">
                <NavIcon id={platform.icon ?? "lens"} size={24} className="cs-nav-glyph" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[19px] font-semibold leading-none tracking-[-0.015em] text-white/95">
                  {platform.label}
                </div>
                <div className="mt-1.5 text-[12.5px] leading-snug text-white/60">{platform.description}</div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-[#2cc1eb]">
                Explore {platform.label}
                <ArrowGlyph direction="right" size={13} />
              </span>
            </div>
            <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-3">
              <div className="flex items-center gap-3">
                <span className={SECTION_LABEL}>How it decides</span>
                <StageInline />
              </div>
              <div className="flex items-center gap-3">
                <span className={SECTION_LABEL}>Verdict</span>
                <VerdictPills />
              </div>
            </div>
          </Link>
        </>
      )}

      <ImageStrip image={latestImages[0]} href={catalogHref} label={catalogLabel} />
    </PanelShell>
  );
}
