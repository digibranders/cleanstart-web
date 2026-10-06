import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { TricorderCard } from "@/components/nav/pieces/TricorderCard";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

// Brand-family atmosphere for Products: a 5% indigo wash in the top-right.
const ATMOSPHERE = "rgba(100, 13, 251, 0.05)";

export function PanelProducts({ item }: Props) {
  const products = item.groups[0]?.items ?? [];
  const platform = item.groups[1]?.items[0];
  return (
    <PanelShell
      width={item.width ?? 880}
      eyebrow={item.label}
      tagline={item.tagline}
      atmosphere={ATMOSPHERE}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[1.12fr_32px_1fr]">
        <div className="flex flex-col gap-1.5">
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

        {/* Bracket joins the three product rows (equal thirds, so it runs from
            the centre of the first to the centre of the last) and feeds the
            platform card. Decorative. */}
        <div aria-hidden className="relative">
          <div className="absolute inset-y-[16.66%] left-1 right-3.5 rounded-r-[6px] border-y border-r border-white/[0.18]" />
          <div className="absolute left-[calc(100%-14px)] right-0 top-1/2 h-px bg-gradient-to-r from-white/[0.18] to-[#2cc1eb]/70" />
        </div>

        {platform && (
          <TricorderCard
            href={platform.href}
            label={platform.label}
            description={platform.description ?? ""}
            icon={platform.icon ?? "lens"}
          />
        )}
      </div>
    </PanelShell>
  );
}
