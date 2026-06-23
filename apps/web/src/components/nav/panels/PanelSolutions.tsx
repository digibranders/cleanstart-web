import { MegaPanel } from "@/components/nav/mega/MegaPanel";
import { MegaCard } from "@/components/nav/mega/MegaCard";
import { MegaCtaBar } from "@/components/nav/mega/MegaCtaBar";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

// Brand-family atmosphere for Solutions: a low cyan-teal wash in the top-right.
const ATMOSPHERE = "rgba(44, 193, 235, 0.08)";

const GROUP_LABEL = "mb-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45";

export function PanelSolutions({ item }: Props) {
  // One labelled column per group (Capability / Compliance / By role), preserving
  // the IA — the new card language replaces the old flat rows, not the grouping.
  return (
    <MegaPanel width={item.width ?? 880} title={item.label} subtitle={item.tagline} atmosphere={ATMOSPHERE}>
      <div className="grid grid-cols-3 gap-3.5">
        {item.groups.map((group, gi) => (
          <div key={group.title ?? gi} className="flex flex-col gap-2.5">
            {group.title && <div className={GROUP_LABEL}>{group.title}</div>}
            {group.items.map((s) => (
              <MegaCard
                key={s.label}
                href={s.href}
                label={s.label}
                {...(s.description ? { description: s.description } : {})}
                icon={s.icon ?? "shield-check"}
                built={s.built !== false}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3.5">
        <MegaCtaBar
          href="/fips"
          headline="FIPS, drop-in."
          sub="Inherit FIPS 140-3 validated crypto without re-architecting."
          ctaLabel="Inherit FIPS compliance"
        />
      </div>
    </MegaPanel>
  );
}
