import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#471FC3,#2cc1eb)",
  "linear-gradient(135deg,#2cc1eb,#6cffc2)",
  "linear-gradient(135deg,#ff8ab8,#471FC3)",
  "linear-gradient(135deg,#6cffc2,#ff8ab8)",
];

export function PanelCompany({ item }: Props) {
  const rows = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      accent="magenta"
      eyebrow={item.label}
      tagline={item.tagline}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-0.5">
          {rows.map((r) => (
            <PanelRow
              key={r.label}
              href={r.href}
              label={r.label}
              {...(r.description ? { description: r.description } : {})}
              icon={r.icon ?? "info"}
              built={r.built !== false}
            />
          ))}
        </div>
        <FeaturedTile
          href="/careers"
          accent="magenta"
          minHeight={280}
          headline="Build the base layer with us."
          sub="Engineers, SEs, designers. Remote-friendly. Equity-led."
          footer={
            <div>
              <div className="flex items-center">
                {AVATAR_GRADIENTS.map((g, i) => (
                  <div
                    key={i}
                    className="h-[30px] w-[30px] rounded-full border-2 border-[#161126]"
                    style={{ background: g, marginLeft: i === 0 ? 0 : -8 }}
                  />
                ))}
                <div className="ml-3 text-[10px] text-white/70">Open roles</div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#ff8ab8]">
                See careers <span className="text-sm">→</span>
              </div>
            </div>
          }
        />
      </div>
    </PanelShell>
  );
}
