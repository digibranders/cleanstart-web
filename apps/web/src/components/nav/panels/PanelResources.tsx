import Link from "next/link";
import { MegaPanel } from "@/components/nav/mega/MegaPanel";
import { MegaCard } from "@/components/nav/mega/MegaCard";
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";
import type { NavMegaItem } from "@/lib/nav-config";
import type { FeedSource } from "@/components/nav/data/latest-updates-feed";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = {
  item: NavMegaItem;
  latestUpdates: FeedSource[];
  spotlight: SpotlightCard;
};

// Brand-family atmosphere for Resources: a low blue wash in the top-right.
const ATMOSPHERE = "rgba(70, 120, 240, 0.09)";

function feedHref(s: FeedSource): string {
  switch (s.type) {
    case "BLOG":
      return `/blogs/${s.slug}`;
    case "NEWS":
      return `/news/${s.slug}`;
    case "RESOURCE":
      return `/resources/${s.slug}`;
    case "WEBINAR":
      return `/webinar/${s.slug}`;
  }
}

function humanAge(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (ms < day) return "today";
  if (ms < 7 * day) return `${Math.round(ms / day)}d ago`;
  if (ms < 30 * day) return `${Math.round(ms / (7 * day))}w ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function metaLine(s: FeedSource): string {
  if (s.type === "WEBINAR" && s.startsAt) {
    return new Date(s.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return s.readMinutes
    ? `${humanAge(s.publishedAt)} · ${s.readMinutes} min`
    : humanAge(s.publishedAt);
}

const SECTION_LABEL = "mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45";
const TYPE_LABEL = "text-[9px] font-bold uppercase tracking-[0.14em] text-white/50";

function FeedMeta({ s }: { s: FeedSource }) {
  return (
    <div className="flex items-center gap-2">
      <span className={TYPE_LABEL}>{s.type}</span>
      <span className="text-white/20">·</span>
      <span className="text-[10px] text-white/40">{metaLine(s)}</span>
    </div>
  );
}

// Browse the resource catalog — the category index, rendered as dense brand
// tiles grouped by Insights / Events.
function BrowseColumn({ groups }: { groups: NavMegaItem["groups"] }) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((g, gi) => (
        <div key={g.title ?? gi}>
          {g.title && <div className={SECTION_LABEL}>{g.title}</div>}
          <div className="grid grid-cols-2 gap-1">
            {g.items.map((leaf) =>
              leaf.built === false ? null : (
                <MegaCard
                  key={leaf.label}
                  dense
                  href={leaf.href}
                  label={leaf.label}
                  icon={leaf.icon ?? "folder"}
                />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Latest updates is the editorial lead of this menu: the newest item is promoted
// to a larger "featured" lead, the rest follow as a compact stack.
function LatestUpdatesColumn({ items }: { items: FeedSource[] }) {
  if (items.length === 0) {
    return (
      <div>
        <div className={SECTION_LABEL}>Latest updates</div>
        <div className="text-[11px] italic text-white/40">No recent updates.</div>
      </div>
    );
  }

  const [lead, ...rest] = items;
  return (
    <div>
      <div className={SECTION_LABEL}>Latest updates</div>
      {lead && (
        <Link
          href={feedHref(lead)}
          className="block rounded-[10px] px-2.5 py-2 transition-colors duration-200 ease-out hover:bg-white/[0.035]"
        >
          <FeedMeta s={lead} />
          <div className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-white/95">
            {lead.title}
          </div>
        </Link>
      )}
      {rest.length > 0 && (
        <>
          <div className="mx-2.5 my-1 h-px bg-white/[0.05]" />
          <div className="flex flex-col">
            {rest.map((s) => (
              <Link
                key={`${s.type}-${s.slug}`}
                href={feedHref(s)}
                className="block rounded-[8px] px-2.5 py-1.5 transition-colors duration-200 ease-out hover:bg-white/[0.035]"
              >
                <FeedMeta s={s} />
                <div className="mt-1 line-clamp-1 text-[13px] font-medium leading-snug text-white/85">
                  {s.title}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PanelResources({ item, latestUpdates, spotlight }: Props) {
  // Three side-by-side columns (Browse · Latest · Spotlight) keep the panel
  // short — un-stacking Latest from Spotlight roughly halves the height. The
  // lead + two follow-ups carry the "latest" signal without running tall.
  const feed = latestUpdates.slice(0, 3);
  return (
    <MegaPanel width={item.width ?? 900} title={item.label} subtitle={item.tagline} atmosphere={ATMOSPHERE}>
      <div className="grid grid-cols-[minmax(0,1.85fr)_minmax(0,1.05fr)_minmax(0,1fr)] gap-4">
        <BrowseColumn groups={item.groups} />
        <LatestUpdatesColumn items={feed} />
        <div>
          <div className={SECTION_LABEL}>Spotlight</div>
          <SpotlightRenderer spotlight={spotlight} dense />
        </div>
      </div>
    </MegaPanel>
  );
}
