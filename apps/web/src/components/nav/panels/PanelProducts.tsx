import { MegaPanel } from "@/components/nav/mega/MegaPanel";
import { MegaCard } from "@/components/nav/mega/MegaCard";
import { MegaCtaBar } from "@/components/nav/mega/MegaCtaBar";
import type { NavMegaItem } from "@/lib/nav-config";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { item: NavMegaItem; latestImages: CommunityImage[] };

// Brand-family atmosphere for Products: an indigo wash in the top-right.
const ATMOSPHERE = "rgba(100, 13, 251, 0.1)";

export function PanelProducts({ item, latestImages }: Props) {
  const products = item.groups[0]?.items ?? [];
  // The pool is sorted most-recent-first, so index 0 is the latest-updated image.
  const chosen = latestImages[0];
  const catalogHref = item.exitHref ?? "https://images.cleanstart.com";

  return (
    <MegaPanel width={item.width ?? 880} title={item.label} subtitle={item.tagline} atmosphere={ATMOSPHERE}>
      <div className="grid grid-cols-3 gap-3.5">
        {products.map((p) => (
          <MegaCard
            key={p.label}
            href={p.href}
            label={p.label}
            {...(p.description ? { description: p.description } : {})}
            icon={p.icon ?? "container"}
            built={p.built !== false}
          />
        ))}
      </div>

      <div className="mt-3.5">
        <MegaCtaBar
          href={catalogHref}
          headline="Stop Patching. Replace the base."
          sub="Drop-in replacements that shrink your attack surface."
          ctaLabel="Explore hardened images"
          external
          {...(chosen
            ? {
                aside: (
                  <code className="rounded-[8px] bg-black/30 px-3 py-2 font-mono text-[12px] leading-none text-white/70 ring-1 ring-inset ring-white/10">
                    <span className="text-[#63bde6]">$</span> docker pull cleanstart/{chosen.name}
                  </code>
                ),
              }
            : {})}
        />
      </div>
    </MegaPanel>
  );
}
