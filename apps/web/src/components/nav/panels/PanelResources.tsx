import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";
import type { NavMegaItem, NavLeaf } from "@/lib/nav-config";
import type { FeedSource } from "@/components/nav/data/latest-updates-feed";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = {
  item: NavMegaItem;
  latestUpdates: FeedSource[];
  spotlight: SpotlightCard;
};

// Brand-family atmosphere for Resources: a low blue wash in the top-right.
const ATMOSPHERE = "rgba(70, 120, 240, 0.05)";

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
    return new Date(s.startsAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  return s.readMinutes
    ? `${humanAge(s.publishedAt)} · ${s.readMinutes} min`
    : humanAge(s.publishedAt);
}

function BrowseColumn({ groups }: { groups: NavMegaItem["groups"] }) {
  return (
    <div>
      {groups.map((g, gi) => (
        <div key={g.title ?? gi} className={gi > 0 ? "mt-3" : ""}>
          {gi > 0 && <div className="mx-2 mb-3 h-px bg-white/[0.05]" />}
          {g.title && (
            <div className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
              {g.title}
            </div>
          )}
          <div className="flex flex-col">
            {g.items.map((leaf: NavLeaf) =>
              leaf.built === false ? null : (
                <Link
                  key={leaf.label}
                  href={leaf.href}
                  className="flex items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/[0.035]"
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

const SECTION_LABEL =
  "mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45";
// Neutral category label — no multicolor text (Phase-8). The single brand
// accent is reserved for actions, not metadata.
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

// Latest updates is the editorial lead of this menu (Req 10): the newest item is
// promoted to a larger "featured" lead, the rest follow as a compact stack.
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
          className="group/lead block rounded-[10px] p-2.5 transition-colors duration-200 ease-out hover:bg-white/[0.035]"
        >
          <FeedMeta s={lead} />
          <div className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-white/95">
            {lead.title}
          </div>
        </Link>
      )}
      {rest.length > 0 && (
        <>
          <div className="mx-2.5 my-1.5 h-px bg-white/[0.05]" />
          <div className="flex flex-col">
            {rest.map((s) => (
              <Link
                key={`${s.type}-${s.slug}`}
                href={feedHref(s)}
                className="block rounded-[8px] p-2.5 transition-colors duration-200 ease-out hover:bg-white/[0.035]"
              >
                <FeedMeta s={s} />
                <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-white/85">
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

function SpotlightColumn({ spotlight }: { spotlight: SpotlightCard }) {
  return (
    <div>
      <div className={SECTION_LABEL}>Spotlight</div>
      <SpotlightRenderer spotlight={spotlight} />
    </div>
  );
}

export function PanelResources({ item, latestUpdates, spotlight }: Props) {
  return (
    <PanelShell
      width={item.width ?? 880}
      eyebrow={item.label}
      tagline={item.tagline}
      atmosphere={ATMOSPHERE}
    >
      <div className="grid grid-cols-[168px_minmax(0,1.5fr)_minmax(0,1.05fr)] gap-4">
        <BrowseColumn groups={item.groups} />
        <LatestUpdatesColumn items={latestUpdates} />
        <SpotlightColumn spotlight={spotlight} />
      </div>
    </PanelShell>
  );
}
