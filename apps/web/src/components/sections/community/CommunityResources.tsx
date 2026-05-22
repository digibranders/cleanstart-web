import Image from "next/image";
import {
  CalendarDays,
  Container as ContainerIcon,
  type LucideIcon,
  MessagesSquare,
  Newspaper,
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { ArrowRightShort } from "@/components/icons/ArrowRightShort";
import {
  getPastEvents,
  getUpcomingEvents,
  type Event as CmsEvent,
} from "@/lib/events";
import { getResources, type Resource, type ResourceType } from "@/lib/resources";
import { resourceTypeLabel } from "@/lib/resources-utils";
import { effectivePublishedAt } from "@/lib/published-date";

/**
 * Community / Resources grid (Figma 732:3490).
 *
 * Dark navy gradient background with corner radial Vector glows and
 * 3-D cube glyphs. Holds a 2×2 grid of white cards:
 *   - What's New              (date + headline list — CMS Resources)
 *   - Community Discussions   (avatar + thread snippet)
 *   - Community images        (live API at api-cleanstart-images.vercel.app)
 *   - Upcoming Events         (date chip + title + venue)
 */

type ArticleItem = {
  date: string;
  title: string;
  href: string;
  typeLabel: string | undefined;
  gated: boolean;
};

const WHATS_NEW_FALLBACK: ArticleItem[] = [
  { date: "OCT 08, 2023", title: "Zero-CVE pipeline Best Practices", href: "/resource-center", typeLabel: "Whitepaper", gated: false },
  { date: "OCT 08, 2023", title: "Zero-CVE pipeline Best Practices", href: "/resource-center", typeLabel: "Whitepaper", gated: false },
  { date: "SEP 29, 2023", title: "Understanding SBOMs Guide", href: "/resource-center", typeLabel: "Ebook", gated: true },
  { date: "OCT 12, 2023", title: "Securing Container Pipelines whitepaper", href: "/resource-center", typeLabel: "Whitepaper", gated: true },
];

function safeTypeLabel(type: Resource["type"]): string | undefined {
  if (!type) return undefined;
  const label = resourceTypeLabel(type as ResourceType);
  // resourceTypeLabel returns "Resource" for unknown — drop that to avoid
  // a meaningless pill.
  return label === "Resource" ? undefined : label;
}

const ARTICLE_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatArticleDate(iso: string | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return ARTICLE_DATE_FMT.format(new Date(t)).toUpperCase();
}

async function fetchWhatsNew(): Promise<ArticleItem[]> {
  try {
    const data = await getResources({ limit: 4 });
    const docs: Resource[] = Array.isArray(data.docs) ? data.docs : [];
    if (docs.length === 0) return WHATS_NEW_FALLBACK;
    return docs.map((r) => ({
      date: formatArticleDate(effectivePublishedAt(r) ?? r.updatedAt ?? undefined),
      title: r.title,
      href: `/resource/${r.slug}`,
      typeLabel: safeTypeLabel(r.type),
      gated: Boolean(r.gated),
    }));
  } catch {
    return WHATS_NEW_FALLBACK;
  }
}

type Discussion = {
  initials: string;
  name: string;
  source: string;
  body: string;
};
const DISCUSSIONS: Discussion[] = [
  {
    initials: "JS",
    name: "Jason Smyth",
    source: "VIA LINKEDIN COMMUNITY",
    body: "Has anyone successfully implemented the new OCI artifacts specification with Harbor? Seeing some manifest errors...",
  },
  {
    initials: "AL",
    name: "Anna Lee",
    source: "VIA DISCORD ALPHA",
    body: "CleanStart's new SBOM generator is a game changer. Reduced our audit time by nearly 40% this quarter.",
  },
];

type CommunityImage = {
  name: string;
  image_url: string;
  meta: string | undefined;
};

type ApiResponse = {
  items?: Array<{ name?: unknown; image_url?: unknown; updated_at?: unknown }>;
};

const IMAGE_FALLBACK: CommunityImage[] = [
  { name: "Apko", image_url: "/images/community/icon-apko.png", meta: "UPDATED 1 HOUR AGO" },
  { name: "Rust", image_url: "/images/community/icon-rust.png", meta: "UPDATED 1 HOUR AGO" },
  { name: "Vault", image_url: "/images/community/icon-vault.png", meta: "UPDATED 1 HOUR AGO" },
  { name: "Apko", image_url: "/images/community/icon-apko.png", meta: "UPDATED 1 HOUR AGO" },
];

const IMAGES_API = "https://api-cleanstart-images.vercel.app/api/community-images";
const IMAGES_DETAIL_BASE = "https://images.cleanstart.com/images";

function formatRelative(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  const diffSec = Math.max(0, (Date.now() - t) / 1000);
  if (diffSec < 60) return "UPDATED JUST NOW";
  if (diffSec < 3600) {
    const n = Math.round(diffSec / 60);
    return `UPDATED ${n} MIN${n === 1 ? "" : "S"} AGO`;
  }
  if (diffSec < 86400) {
    const n = Math.round(diffSec / 3600);
    return `UPDATED ${n} HOUR${n === 1 ? "" : "S"} AGO`;
  }
  const n = Math.round(diffSec / 86400);
  return `UPDATED ${n} DAY${n === 1 ? "" : "S"} AGO`;
}

async function fetchCommunityImages(): Promise<CommunityImage[]> {
  try {
    const res = await fetch(IMAGES_API, { next: { revalidate: 300 } });
    if (!res.ok) return IMAGE_FALLBACK;
    const data = (await res.json()) as ApiResponse;
    const items = Array.isArray(data.items) ? data.items : [];
    const parsed = items
      .map((raw): CommunityImage | null => {
        const name = typeof raw.name === "string" ? raw.name : null;
        const image_url = typeof raw.image_url === "string" ? raw.image_url : null;
        const updated_at = typeof raw.updated_at === "string" ? raw.updated_at : undefined;
        if (!name || !image_url) return null;
        return { name, image_url, meta: formatRelative(updated_at) };
      })
      .filter((x): x is CommunityImage => x !== null)
      .slice(0, 4);
    return parsed.length > 0 ? parsed : IMAGE_FALLBACK;
  } catch {
    return IMAGE_FALLBACK;
  }
}

type EventItem = {
  month: string;
  day: string;
  title: string;
  detail: string;
  href: string;
  isPast: boolean;
};

type EventsBlock = {
  events: EventItem[];
  mode: "upcoming" | "past" | "empty";
};

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

function toEventItem(e: CmsEvent, isPast: boolean): EventItem {
  const chip = eventChip(e.startsAt);
  return {
    month: chip.month,
    day: chip.day,
    title: e.title,
    detail: eventDetail(e),
    href: `/events/${e.slug}`,
    isPast,
  };
}

const EVENTS_FALLBACK: EventsBlock = {
  events: [
    { month: "OCT", day: "24", title: "Security Supply Chain Summit", detail: "Virtual • 10:00 AM EST", href: "/events", isPast: false },
    { month: "NOV", day: "02", title: "Clean Code: The SBOM deep dive", detail: "Austin, TX • 6:00 PM CST", href: "/events", isPast: false },
    { month: "NOV", day: "15", title: "Q4 Community Town Hall", detail: "Virtual • 11:30 AM EST", href: "/events", isPast: false },
  ],
  mode: "upcoming",
};

async function fetchEventsBlock(): Promise<EventsBlock> {
  try {
    const up = await getUpcomingEvents({ limit: 3 });
    if (Array.isArray(up.docs) && up.docs.length > 0) {
      return { events: up.docs.map((e) => toEventItem(e, false)), mode: "upcoming" };
    }
    const past = await getPastEvents({ page: 1, limit: 3 });
    if (Array.isArray(past.docs) && past.docs.length > 0) {
      return { events: past.docs.map((e) => toEventItem(e, true)), mode: "past" };
    }
    return { events: [], mode: "empty" };
  } catch {
    return EVENTS_FALLBACK;
  }
}

/** Blue gradient ball that hosts a Lucide icon. Matches Figma's #239CFF → #005BE3. */
function BallIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      aria-hidden
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: "linear-gradient(180deg, #239CFF 0%, #005BE3 100%)",
        boxShadow:
          "0 2px 5px rgba(28,60,142,0.33), inset 0 0.5px 0.5px rgba(255,255,255,0.55)",
      }}
    >
      <Icon size={18} strokeWidth={2} color="#FFFFFF" />
    </div>
  );
}

type CardShellProps = {
  children: React.ReactNode;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  icon: LucideIcon;
};

function CardShell({ children, title, ctaLabel, ctaHref, icon }: CardShellProps) {
  const isExternal = /^https?:\/\//.test(ctaHref);
  return (
    <article
      className="relative flex h-full flex-col gap-6 rounded-[16px] bg-white p-[clamp(20px,2.2vw,40px)] shadow-[0_20px_40px_-20px_rgba(11,11,39,0.5)]"
      style={{ outline: "2px solid rgba(35,156,255,0.6)", outlineOffset: "0" }}
    >
      <header className="flex items-center gap-3">
        <BallIcon icon={icon} />
        <h3
          className="font-display font-semibold text-[#0B0B27]"
          style={{ fontSize: "var(--text-card-title-md)", lineHeight: 1.25, letterSpacing: "-0.01em" }}
        >
          {title}
        </h3>
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
      <a
        href={ctaHref}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="inline-flex items-center gap-2 text-[#3960F9] hover:text-[#1B41E7]"
        style={{ fontSize: "var(--text-body-md)", fontWeight: 500 }}
      >
        {ctaLabel}
        <ArrowRightShort className="text-current" />
      </a>
    </article>
  );
}

export async function CommunityResources() {
  const [images, whatsNew, eventsBlock] = await Promise.all([
    fetchCommunityImages(),
    fetchWhatsNew(),
    fetchEventsBlock(),
  ]);
  return (
    <Section
      padding="lg"
      ariaLabel="Community resources"
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0B0B27 0%, #131E8F 50%, #2C1B9A 100%)",
      }}
    >
      {/* Vector — white radial glow, top-right (Figma left:1448, top:-252) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(1448 / 1920 * 100%)",
          top: "-252px",
          width: "979px",
          height: "979px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
          opacity: 0.1,
        }}
      />
      {/* Vector — white radial glow, bottom-left (Figma left:-471, top:689) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(-471 / 1920 * 100%)",
          top: "689px",
          width: "979px",
          height: "979px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
          opacity: 0.1,
        }}
      />

      {/* Decorative purple radial — bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          right: "-120px",
          top: "60px",
          width: "432px",
          height: "432px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.55) 0%, rgba(122,89,255,0) 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* 3-D cube — top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden xl:block"
        style={{ left: "-80px", top: "-20px", width: "332px", height: "313px", opacity: 0.7 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/cta-cube.png"
          alt=""
          width={332}
          height={313}
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "contain", transform: "rotate(-12deg)" }}
        />
      </div>
      {/* 3-D cube — bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden xl:block"
        style={{ right: "-80px", bottom: "20px", width: "332px", height: "313px", opacity: 0.7 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/community/cta-cube.png"
          alt=""
          width={332}
          height={313}
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "contain", transform: "rotate(8deg) scaleX(-1)" }}
        />
      </div>

      <Container className="relative">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-[clamp(20px,2.2vw,32px)]">
          {/* What's New */}
          <CardShell
            title="What's New"
            ctaLabel="Explore All Resources"
            ctaHref="/resource-center"
            icon={Newspaper}
          >
            <ul className="flex flex-col gap-6">
              {whatsNew.map((a, i) => (
                <li key={`${a.href}-${i}`} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className="font-sans uppercase text-[#5A5A6E]"
                      style={{ fontSize: "12px", letterSpacing: "0.06em" }}
                    >
                      {a.date}
                    </span>
                    {a.typeLabel ? (
                      <span
                        className="inline-flex items-center rounded-full bg-[#EAF1FF] text-[#1B41E7]"
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          padding: "2px 8px",
                          textTransform: "uppercase",
                        }}
                      >
                        {a.typeLabel}
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={a.href}
                    className="group inline-flex items-center gap-1.5 font-display font-semibold text-[#0B0B27] hover:text-[#3960F9]"
                    style={{ fontSize: "1rem", lineHeight: 1.3 }}
                  >
                    <span>{a.title}</span>
                    {a.gated ? (
                      <svg
                        aria-label="Lead-gated resource"
                        role="img"
                        width="12"
                        height="14"
                        viewBox="0 0 12 14"
                        fill="none"
                        className="shrink-0 text-[#5A5A6E] group-hover:text-[#3960F9]"
                      >
                        <path
                          d="M3 6V4a3 3 0 1 1 6 0v2m-7 0h8a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </CardShell>

          {/* Community Discussions */}
          <CardShell
            title="Community Discussions"
            ctaLabel="Explore All Discussions"
            ctaHref="https://www.linkedin.com/groups/18324021/"
            icon={MessagesSquare}
          >
            <ul className="flex flex-col gap-3">
              {DISCUSSIONS.map((d, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-3 rounded-[12px] border border-[#E6E1FF] bg-[#FAF8FF] p-4"
                >
                  <header className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6E1FF] text-[12px] font-semibold text-[#3960F9]"
                    >
                      {d.initials}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className="font-display font-semibold text-[#0B0B27]"
                        style={{ fontSize: "14px", lineHeight: 1.3 }}
                      >
                        {d.name}
                      </span>
                      <span
                        className="font-sans uppercase text-[#5A5A6E]"
                        style={{ fontSize: "10px", letterSpacing: "0.08em" }}
                      >
                        {d.source}
                      </span>
                    </div>
                  </header>
                  <p
                    className="font-sans text-[#3A3A52]"
                    style={{ fontSize: "13px", lineHeight: 1.45 }}
                  >
                    {d.body}
                  </p>
                </li>
              ))}
            </ul>
          </CardShell>

          {/* Community images (live API) */}
          <CardShell
            title="Community images"
            ctaLabel="Explore All Images"
            ctaHref="https://images.cleanstart.com/?community-images=true"
            icon={ContainerIcon}
          >
            <ul className="flex flex-col gap-4">
              {images.map((img, i) => {
                const isRemote = /^https?:\/\//.test(img.image_url);
                const href = isRemote
                  ? `${IMAGES_DETAIL_BASE}/${encodeURIComponent(img.name)}/details`
                  : undefined;
                const inner = (
                  <>
                    <span
                      aria-hidden
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px]"
                      style={{ backgroundColor: "rgba(196,70,239,0.2)" }}
                    >
                      {isRemote ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.image_url}
                          alt=""
                          width={24}
                          height={24}
                          loading="lazy"
                          decoding="async"
                          style={{ width: 24, height: 24, objectFit: "contain" }}
                        />
                      ) : (
                        <Image src={img.image_url} alt="" width={24} height={24} />
                      )}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className="font-display font-semibold text-[#0B0B27]"
                        style={{ fontSize: "14px", lineHeight: 1.4 }}
                      >
                        {img.name}
                      </span>
                      <span
                        className="font-sans uppercase text-[#5A5A6E]"
                        style={{ fontSize: "10px", letterSpacing: "0.08em" }}
                      >
                        {img.meta ?? "UPDATED RECENTLY"}
                      </span>
                    </div>
                  </>
                );
                return (
                  <li key={`${img.name}-${i}`}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-[8px] -m-1 p-1 transition hover:bg-[#FAF8FF]"
                        aria-label={img.name}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardShell>

          {/* Upcoming Events */}
          <CardShell
            title={eventsBlock.mode === "past" ? "Recent Events" : "Upcoming Events"}
            ctaLabel={eventsBlock.mode === "past" ? "View All Events" : "View All Events"}
            ctaHref="/events"
            icon={CalendarDays}
          >
            {eventsBlock.mode === "past" ? (
              <p
                className="rounded-[8px] bg-[#FAF8FF] px-3 py-2 font-sans text-[#5A5A6E]"
                style={{ fontSize: "12px", lineHeight: 1.45 }}
              >
                No upcoming events scheduled — here&rsquo;s what you missed.
              </p>
            ) : null}
            {eventsBlock.events.length === 0 ? (
              <p
                className="font-sans text-[#5A5A6E]"
                style={{ fontSize: "13px", lineHeight: 1.5 }}
              >
                The events calendar is being refreshed. Check back soon.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {eventsBlock.events.map((e, i) => (
                  <li key={`${e.href}-${i}`}>
                    <a
                      href={e.href}
                      className="group flex items-center gap-4 rounded-[8px] -m-1 p-1 transition hover:bg-[#FAF8FF]"
                    >
                      <div
                        aria-hidden
                        className={`flex h-14 w-14 flex-col items-center justify-center rounded-[10px] border ${
                          e.isPast
                            ? "border-[#EAEAEA] bg-[#F4F4F8]"
                            : "border-[#E6E1FF] bg-[#FAF8FF]"
                        }`}
                      >
                        <span
                          className={`font-display font-semibold uppercase ${e.isPast ? "text-[#8A8AA0]" : "text-[#3960F9]"}`}
                          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
                        >
                          {e.month}
                        </span>
                        <span
                          className={`font-display font-bold ${e.isPast ? "text-[#5A5A6E]" : "text-[#0B0B27]"}`}
                          style={{ fontSize: "20px", lineHeight: 1 }}
                        >
                          {e.day}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p
                          className="font-display font-semibold text-[#0B0B27] group-hover:text-[#3960F9]"
                          style={{ fontSize: "15px", lineHeight: 1.3 }}
                        >
                          {e.title}
                        </p>
                        <p
                          className="font-sans text-[#5A5A6E]"
                          style={{ fontSize: "12px", lineHeight: 1.4 }}
                        >
                          {e.detail}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardShell>
        </div>
      </Container>
    </Section>
  );
}
