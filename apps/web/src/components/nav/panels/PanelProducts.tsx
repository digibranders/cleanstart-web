import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { TricorderCard } from "@/components/nav/pieces/TricorderCard";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

// Brand-family atmosphere for Products: a 5% indigo wash in the top-right.
const ATMOSPHERE = "rgba(100, 13, 251, 0.05)";

const COLUMN_LABEL =
  "px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40";

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
    </PanelShell>
  );
}
