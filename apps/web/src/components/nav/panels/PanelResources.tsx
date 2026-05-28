import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import type { NavMegaItem, NavLeaf } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

function BrowseColumn({ groups }: { groups: NavMegaItem["groups"] }) {
  return (
    <div>
      {groups.map((g, gi) => (
        <div key={g.title ?? gi} className={gi > 0 ? "mt-3" : ""}>
          {gi > 0 && <div className="mx-2 mb-3 h-px bg-white/[0.05]" />}
          {g.title && (
            <div className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2cc1eb]">
              {g.title}
            </div>
          )}
          <div className="flex flex-col">
            {g.items.map((leaf: NavLeaf) =>
              leaf.built === false ? null : (
                <Link
                  key={leaf.label}
                  href={leaf.href}
                  className="flex items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/[0.04]"
                >
                  <NavIcon id={leaf.icon ?? "folder"} size={14} className="opacity-70" />
                  {leaf.label}
                </Link>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestUpdatesPlaceholder() {
  return (
    <div>
      <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
        Latest updates
      </div>
      <div className="text-[11px] italic text-white/40">
        Latest blogs, news, resources, and webinars appear here when Phase 3 ships.
      </div>
    </div>
  );
}

function SpotlightPlaceholder() {
  return (
    <div>
      <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
        Spotlight
      </div>
      <Link
        href="/subscribe"
        className="block min-h-[230px] rounded-[12px] border p-4 text-white"
        style={{ background: "#1c1530", borderColor: "rgba(44,193,235,0.15)" }}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2cc1eb]">
          Newsletter
        </div>
        <div className="mt-2 text-[15px] font-bold leading-tight">Get the CleanStart Bulletin.</div>
        <div className="mt-1.5 text-xs leading-relaxed text-white/65">
          One email per month — new images, talks, advisories.
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]">
          Subscribe <span className="text-sm">→</span>
        </div>
      </Link>
    </div>
  );
}

export function PanelResources({ item }: Props) {
  return (
    <PanelShell
      width={item.width ?? 880}
      accent="cyan"
      eyebrow={item.label}
      tagline={item.tagline}
    >
      <div className="grid grid-cols-[190px_1fr_1fr] gap-4">
        <BrowseColumn groups={item.groups} />
        <LatestUpdatesPlaceholder />
        <SpotlightPlaceholder />
      </div>
      <ContextualCTA
        headline="Subscribe to the CleanStart Bulletin"
        sub="One email per month, new images, talks, advisories."
        ctaLabel="Subscribe"
        ctaHref="/subscribe"
      />
    </PanelShell>
  );
}
