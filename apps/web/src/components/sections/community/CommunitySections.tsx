import Image from "next/image";
import Link from "next/link";
import {
  CalendarDaysIcon,
  ContainerIcon,
  type LucideIcon,
  MessagesSquareIcon,
  NewspaperIcon,
} from "lucide-react";
import {
  type Event as CmsEvent,
  getPastEvents,
  getUpcomingEvents,
} from "@/lib/events";
import { effectivePublishedAt } from "@/lib/published-date";
import { getResources, type Resource, type ResourceType } from "@/lib/resources";
import { resourceTypeLabel } from "@/lib/resources-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsItem = {
  date: string;
  title: string;
  href: string;
};

type DiscussionItem = {
  initials: string;
  initialsColor: string;
  initialsTextColor: string;
  name: string;
  via: string;
  message: string;
};

type ImageItem = {
  imgSrc: string;
  name: string;
  updated: string;
};

type EventItem = {
  month: string;
  day: string;
  title: string;
  detail: string;
  href: string;
};

// ─── Static data (no CMS source) ─────────────────────────────────────────────

const DISCUSSIONS: DiscussionItem[] = [
  {
    initials: "JS",
    initialsColor: "#dae2ff",
    initialsTextColor: "#2559bd",
    name: "Jason Smyth",
    via: "VIA LINKEDIN COMMUNITY",
    message:
      "Has anyone successfully implemented the new OCI artifacts specification with Harbor? Seeing some manifest errors...",
  },
  {
    initials: "AL",
    initialsColor: "#e1e2e9",
    initialsTextColor: "#505257",
    name: "Anna Lee",
    via: "VIA DISCORD ALPHA",
    message:
      "CleanStart's new SBOM generator is a game changer. Reduced our audit time by nearly 40% this quarter.",
  },
];

// ─── Fallbacks (used when CMS / API is unreachable) ──────────────────────────

const NEWS_FALLBACK: NewsItem[] = [
  { date: "OCT 08, 2023", title: "Zero-CVE pipeline Best Practices", href: "/resource-center" },
  { date: "OCT 08, 2023", title: "Zero-CVE pipeline Best Practices", href: "/resource-center" },
  { date: "SEP 29, 2023", title: "Understanding SBOMs Guide", href: "/resource-center" },
  { date: "OCT 12, 2023", title: "Securing Container Pipelines whitepaper", href: "/resource-center" },
];

const IMAGE_FALLBACK: ImageItem[] = [
  { imgSrc: "/images/community/card-img-apko.png", name: "Apko", updated: "Updated 1 hour ago" },
  { imgSrc: "/images/community/card-img-rust.png", name: "Rust", updated: "Updated 1 hour ago" },
  { imgSrc: "/images/community/card-img-vault.png", name: "Vault", updated: "Updated 1 hour ago" },
  { imgSrc: "/images/community/card-img-apko.png", name: "Apko", updated: "Updated 1 hour ago" },
];

const EVENTS_FALLBACK: EventItem[] = [
  { month: "OCT", day: "24", title: "Security Supply Chain Summit", detail: "Virtual • 10:00 AM EST", href: "/events" },
  { month: "NOV", day: "02", title: "Clean Code: The SBOM deep dive", detail: "Austin, TX • 6:00 PM CST", href: "/events" },
  { month: "NOV", day: "15", title: "Q4 Community Town Hall", detail: "Virtual • 11:30 AM EST", href: "/events" },
];

// ─── Formatters ──────────────────────────────────────────────────────────────

const ARTICLE_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const EVENT_MONTH_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const EVENT_DAY_FMT = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  timeZone: "UTC",
});
const EVENT_TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function formatArticleDate(iso: string | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return ARTICLE_DATE_FMT.format(new Date(t)).toUpperCase();
}

function formatRelative(iso: string | undefined): string {
  if (!iso) return "Updated recently";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Updated recently";
  const diffSec = Math.max(0, (Date.now() - t) / 1000);
  if (diffSec < 60) return "Updated just now";
  if (diffSec < 3600) {
    const n = Math.round(diffSec / 60);
    return `Updated ${n} min${n === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 86400) {
    const n = Math.round(diffSec / 3600);
    return `Updated ${n} hour${n === 1 ? "" : "s"} ago`;
  }
  const n = Math.round(diffSec / 86400);
  return `Updated ${n} day${n === 1 ? "" : "s"} ago`;
}

function eventChip(startsAt: string | null | undefined): { month: string; day: string } {
  if (!startsAt) return { month: "TBA", day: "--" };
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return { month: "TBA", day: "--" };
  return {
    month: EVENT_MONTH_FMT.format(d).toUpperCase(),
    day: EVENT_DAY_FMT.format(d),
  };
}

function eventDetail(e: CmsEvent): string {
  const venue = (e.venue ?? "").trim() || "TBA";
  if (!e.startsAt) return venue;
  const d = new Date(e.startsAt);
  if (Number.isNaN(d.getTime())) return venue;
  return `${venue} • ${EVENT_TIME_FMT.format(d)}`;
}

function toEventItem(e: CmsEvent): EventItem {
  const chip = eventChip(e.startsAt);
  return {
    month: chip.month,
    day: chip.day,
    title: e.title,
    detail: eventDetail(e),
    href: `/events/${e.slug}`,
  };
}

function safeTypeLabel(type: Resource["type"]): string {
  if (!type) return "Resource";
  return resourceTypeLabel(type as ResourceType);
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchWhatsNew(): Promise<NewsItem[]> {
  try {
    const data = await getResources({ limit: 4 });
    const docs: Resource[] = Array.isArray(data.docs) ? data.docs : [];
    if (docs.length === 0) return NEWS_FALLBACK;
    return docs.map((r) => ({
      date: formatArticleDate(effectivePublishedAt(r) ?? r.updatedAt ?? undefined),
      title: `${r.title}${safeTypeLabel(r.type) === "Resource" ? "" : ""}`,
      href: `/resource/${r.slug}`,
    }));
  } catch {
    return NEWS_FALLBACK;
  }
}

type CommunityImagesApiResponse = {
  items?: Array<{ name?: unknown; image_url?: unknown; updated_at?: unknown }>;
};

const IMAGES_API = "https://api-cleanstart-images.vercel.app/api/community-images";

async function fetchCommunityImages(): Promise<ImageItem[]> {
  try {
    const res = await fetch(IMAGES_API, { next: { revalidate: 300 } });
    if (!res.ok) return IMAGE_FALLBACK;
    const data = (await res.json()) as CommunityImagesApiResponse;
    const items = Array.isArray(data.items) ? data.items : [];
    const parsed = items
      .map((raw): ImageItem | null => {
        const name = typeof raw.name === "string" ? raw.name : null;
        const imgSrc = typeof raw.image_url === "string" ? raw.image_url : null;
        const updatedAt = typeof raw.updated_at === "string" ? raw.updated_at : undefined;
        if (!name || !imgSrc) return null;
        return { imgSrc, name, updated: formatRelative(updatedAt) };
      })
      .filter((x): x is ImageItem => x !== null)
      .slice(0, 4);
    return parsed.length > 0 ? parsed : IMAGE_FALLBACK;
  } catch {
    return IMAGE_FALLBACK;
  }
}

async function fetchEvents(): Promise<EventItem[]> {
  try {
    const up = await getUpcomingEvents({ limit: 3 });
    if (Array.isArray(up.docs) && up.docs.length > 0) {
      return up.docs.map(toEventItem);
    }
    const past = await getPastEvents({ page: 1, limit: 3 });
    if (Array.isArray(past.docs) && past.docs.length > 0) {
      return past.docs.map(toEventItem);
    }
    return EVENTS_FALLBACK;
  } catch {
    return EVENTS_FALLBACK;
  }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

/**
 * Blue gradient ball icon — 34×34px, matches Figma "Ball" node.
 * Hosts a Lucide icon (carried over from the previous CommunityResources
 * design — one icon per card domain instead of a single shared SVG).
 */
function BlueBall({ icon: Icon }: { icon: LucideIcon }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: 34,
        height: 34,
        background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
        boxShadow: "0px 2.186px 5.149px 0px rgba(28,60,142,0.33)",
      }}
    >
      <Icon
        className="relative z-[2] shrink-0 text-white"
        style={{ width: "19.125px", height: "19.125px" }}
        strokeWidth={2}
        aria-hidden
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow:
            "inset 0px -0.082px 0.103px 0px rgba(0,44,179,0.5), inset 0px 0.041px 0.206px 0px rgba(255,255,255,0.81)",
        }}
      />
    </div>
  );
}

function CardHeader({ title, icon }: { title: string; icon: LucideIcon }): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <BlueBall icon={icon} />
      <h3
        className="font-display font-bold text-[#111]"
        style={{ fontSize: "24px", lineHeight: "32px" }}
      >
        {title}
      </h3>
    </div>
  );
}

function ExploreLink({ href, label = "Explore All Resources" }: { href: string; label?: string }): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 font-display font-semibold text-[#4a3bf1]"
      style={{ fontSize: "16px", lineHeight: "24px" }}
    >
      {label}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/community/card-arrow.svg"
        alt=""
        aria-hidden
        className="shrink-0 select-none"
        style={{ width: "20px", height: "14px" }}
        loading="lazy"
        decoding="async"
      />
    </Link>
  );
}

// ─── Card bodies ──────────────────────────────────────────────────────────────

function WhatsNewCard({ items }: { items: NewsItem[] }): React.ReactElement {
  return (
    <div className="flex h-full flex-col gap-8">
      <CardHeader title="What's New" icon={NewspaperIcon} />
      <div className="flex flex-grow flex-col gap-6">
        {items.map((item, i) => (
          <Link
            key={`${item.href}-${i}`}
            href={item.href}
            className="flex flex-col gap-1 transition-opacity hover:opacity-80"
          >
            <span
              className="font-display font-semibold text-[#111]"
              style={{ fontSize: "12px", lineHeight: "16px" }}
            >
              {item.date}
            </span>
            <span
              className="font-display font-semibold text-[#111]"
              style={{ fontSize: "18px", lineHeight: "28px" }}
            >
              {item.title}
            </span>
          </Link>
        ))}
      </div>
      <ExploreLink href="/resource-center" />
    </div>
  );
}

function DiscussionsCard(): React.ReactElement {
  return (
    <div className="flex h-full flex-col gap-8">
      <CardHeader title="Community Discussions" icon={MessagesSquareIcon} />
      <div className="flex flex-grow flex-col gap-4">
        {DISCUSSIONS.map((d, i) => (
          <div
            key={`${d.name}-${i}`}
            className="flex flex-col gap-[10.875px] rounded-[5px] border border-[rgba(200,202,202,0.5)] bg-white p-[17px]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex shrink-0 items-center justify-center rounded-xl"
                style={{ width: "32px", height: "32px", background: d.initialsColor }}
              >
                <span
                  className="font-sans font-semibold"
                  style={{ fontSize: "12px", lineHeight: "16px", color: d.initialsTextColor }}
                >
                  {d.initials}
                </span>
              </div>
              <div>
                <p
                  className="font-display font-semibold text-[#111]"
                  style={{ fontSize: "14px", lineHeight: "20px" }}
                >
                  {d.name}
                </p>
                <p
                  className="font-sans font-normal uppercase text-[#111]"
                  style={{ fontSize: "10px", lineHeight: "15px" }}
                >
                  {d.via}
                </p>
              </div>
            </div>
            <p
              className="font-sans font-normal text-[#111]"
              style={{ fontSize: "14px", lineHeight: "22.75px" }}
            >
              {d.message}
            </p>
          </div>
        ))}
      </div>
      <ExploreLink href="/community#discussions" label="Join the Discussion" />
    </div>
  );
}

function CommunityImagesCard({ items }: { items: ImageItem[] }): React.ReactElement {
  return (
    <div className="flex h-full flex-col gap-8">
      <CardHeader title="Community images" icon={ContainerIcon} />
      <div className="flex flex-grow flex-col gap-6">
        {items.map((item, i) => (
          <div key={`${item.name}-${i}`} className="flex items-center gap-2">
            <div
              className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={{ width: "42px", height: "42px", background: "rgba(196,70,239,0.2)" }}
            >
              <Image
                src={item.imgSrc}
                alt={item.name}
                width={28}
                height={28}
                className="object-contain"
                loading="lazy"
                decoding="async"
                sizes="28px"
                unoptimized={item.imgSrc.startsWith("http")}
              />
            </div>
            <div>
              <p
                className="font-display font-semibold text-[#111]"
                style={{ fontSize: "14px", lineHeight: "20px" }}
              >
                {item.name}
              </p>
              <p
                className="font-sans font-normal uppercase text-[#111]"
                style={{ fontSize: "10px", lineHeight: "15px" }}
              >
                {item.updated}
              </p>
            </div>
          </div>
        ))}
      </div>
      <ExploreLink href="/cleanstart-images" label="Explore All Images" />
    </div>
  );
}

function UpcomingEventsCard({ items }: { items: EventItem[] }): React.ReactElement {
  return (
    <div className="flex h-full flex-col gap-8">
      <CardHeader title="Upcoming Events" icon={CalendarDaysIcon} />
      <div className="flex flex-grow flex-col gap-7">
        {items.map((ev, i) => (
          <Link
            key={`${ev.href}-${i}`}
            href={ev.href}
            className="flex items-center gap-4 transition-opacity hover:opacity-80"
          >
            <div
              className="flex shrink-0 flex-col items-center justify-center rounded-lg"
              style={{ width: "56px", height: "56px", background: "rgba(196,70,239,0.2)" }}
            >
              <span
                className="font-display font-semibold text-[#7d7d7d]"
                style={{ fontSize: "12px", lineHeight: "1.3" }}
              >
                {ev.month}
              </span>
              <span
                className="font-display font-semibold text-[#424242]"
                style={{ fontSize: "18px", lineHeight: "28px" }}
              >
                {ev.day}
              </span>
            </div>
            <div>
              <p
                className="font-display font-semibold text-[#111]"
                style={{ fontSize: "16px", lineHeight: "24px" }}
              >
                {ev.title}
              </p>
              <p
                className="font-sans font-normal text-[#111]"
                style={{ fontSize: "12px", lineHeight: "16px" }}
              >
                {ev.detail}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <ExploreLink href="/events" label="View All Events" />
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function CardWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-[32px] p-4" style={{ background: "rgba(44, 193, 235, 0.3)" }}>
      <div
        className="flex min-h-[448px] flex-col rounded-[16px] p-[clamp(20px,2.083vw,40px)]"
        style={{ background: "#f6f6f6" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export async function CommunitySections(): Promise<React.ReactElement> {
  const [news, images, events] = await Promise.all([
    fetchWhatsNew(),
    fetchCommunityImages(),
    fetchEvents(),
  ]);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/community/section-vector.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: "calc(-471 / 1920 * 100%)",
          top: "calc(689 / 1200 * 100%)",
          width: "979px",
          height: "979px",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/community/section-vector.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: "calc(1448 / 1920 * 100%)",
          top: "calc(-252 / 1200 * 100%)",
          width: "979px",
          height: "979px",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/community/section-ellipse.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: "calc(306 / 1920 * 100%)",
          top: "246px",
          width: "432px",
          height: "432px",
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute select-none mix-blend-hard-light opacity-30"
        style={{ left: "-148px", top: "-19px", width: "332px", height: "313px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/section-hardlight.png"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute select-none mix-blend-hard-light opacity-30"
        style={{ right: "-148px", bottom: "-19px", width: "332px", height: "313px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/section-hardlight.png"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[var(--container-default)] px-6 py-[clamp(48px,8vw,120px)]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CardWrapper>
            <WhatsNewCard items={news} />
          </CardWrapper>
          <CardWrapper>
            <DiscussionsCard />
          </CardWrapper>
          <CardWrapper>
            <CommunityImagesCard items={images} />
          </CardWrapper>
          <CardWrapper>
            <UpcomingEventsCard items={events} />
          </CardWrapper>
        </div>
      </div>
    </section>
  );
}
