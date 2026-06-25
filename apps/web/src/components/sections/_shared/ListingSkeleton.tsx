/**
 * Per-page loading skeletons for the CMS *listing* pages (blogs, news, events,
 * webinars, resources, guides, case-studies, careers). Mirrors the
 * `ContentDetailSkeleton` approach — pure presentational, no client JS, a
 * CSS-only `animate-pulse` from each wrapper — but each piece is sized to the
 * real section so the swap to live content is shift-free.
 *
 * Two surfaces, two shimmer palettes:
 *  - The hero is the dark purple gradient every listing shares, so its shapes
 *    are translucent-white (`bg-white/10`).
 *  - The grid sits on `#f6f6f6` with white cards, so its shapes are
 *    `bg-black/[0.06]` and image plates are neutral `#e8e8f0`.
 *
 * Card dimensions (max-w / minHeight / radius), the hero layout (search bar,
 * category pills, featured-post block, marquee), and the grid filter rows are
 * copied from the matching components so there is no layout shift.
 */

const CARD_SHADOW =
  "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)";

const EVENT_SHADOW = "0 4px 24px rgba(15,23,42,0.06)";

// The dark purple gradient shared by every listing hero (blogs/news/guides/…).
const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 45%, #131e8f 61%, #471ec0 75%, #471fc3 84%, rgba(70,30,191,0.85) 88%, rgba(66,30,188,0.40) 95%, rgba(66,30,188,0) 99%)";

/** A light shimmer block (for the grey grid surface). */
function Bar({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  return <div className={`rounded bg-black/[0.06] ${className}`} style={style} />;
}

/** A translucent-white shimmer block (for the dark hero surface). */
function DarkBar({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  return <div className={`rounded bg-white/10 ${className}`} style={style} />;
}

/* ------------------------------------------------------------------ */
/* Hero skeletons                                                      */
/* ------------------------------------------------------------------ */

export type ListingHeroVariant =
  | "blogs"
  | "news"
  | "guides"
  | "webinars"
  | "events"
  | "resources"
  | "careers"
  | "caseStudies";

interface HeroConfig {
  minHeight?: string;
  align: "center" | "start";
  search: boolean;
  pills: boolean;
  featured: "image" | "plate" | "event" | null;
  marquee: boolean;
}

const HERO: Record<ListingHeroVariant, HeroConfig> = {
  blogs: { align: "center", search: true, pills: true, featured: "image", marquee: false },
  news: { align: "center", search: true, pills: false, featured: "plate", marquee: false },
  guides: { align: "center", search: true, pills: false, featured: null, marquee: false },
  webinars: { minHeight: "420px", align: "center", search: false, pills: false, featured: null, marquee: false },
  events: { align: "center", search: false, pills: false, featured: "event", marquee: false },
  resources: { minHeight: "clamp(420px, 37vw, 521px)", align: "center", search: true, pills: false, featured: null, marquee: false },
  careers: { minHeight: "clamp(420px, 37vw, 521px)", align: "center", search: true, pills: false, featured: null, marquee: false },
  caseStudies: { minHeight: "clamp(440px, 39vw, 560px)", align: "start", search: false, pills: false, featured: null, marquee: true },
};

function FeaturedHeroSkeleton(): React.ReactElement {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(420px,580px)]"
      style={{ gap: "32px", marginTop: "clamp(56px, 7vw, 102px)" }}
    >
      <div className="order-2 flex flex-col gap-6 lg:order-1">
        <DarkBar className="h-4 w-40" />
        <DarkBar className="h-7 w-11/12" />
        <DarkBar className="h-7 w-3/4" />
        <DarkBar className="h-4 w-full max-w-[460px]" />
        <DarkBar className="h-4 w-1/2 max-w-[320px]" />
        <DarkBar className="mt-2 h-5 w-28" />
      </div>
      <div
        className="order-1 w-full lg:order-2"
        style={{ aspectRatio: "711 / 349", borderRadius: "20px", background: "rgba(255,255,255,0.08)" }}
      />
    </div>
  );
}

/** Faithful loading placeholder for each listing's dark hero band. */
export function ListingHeroSkeleton({
  variant,
}: {
  variant: ListingHeroVariant;
}): React.ReactElement {
  const cfg = HERO[variant];
  const itemsAlign = cfg.align === "center" ? "items-center text-center" : "items-start";
  const titleWidth = cfg.align === "center" ? "w-56" : "w-72";

  return (
    <output
      aria-live="polite"
      aria-label="Loading"
      className="block w-full animate-pulse overflow-hidden"
      style={{ background: HERO_GRADIENT, minHeight: cfg.minHeight }}
    >
      <span className="sr-only">Loading…</span>
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-[clamp(56px,7vw,96px)]">
        <div
          className={`mx-auto flex w-full flex-col gap-8 ${itemsAlign}`}
          style={{ paddingTop: "calc(clamp(96px, 10vw, 150px) + var(--cs-header-extra))", maxWidth: cfg.align === "center" ? "864px" : "100%" }}
        >
          <div className={`flex w-full flex-col gap-5 ${itemsAlign}`} style={{ maxWidth: cfg.align === "center" ? "702px" : "640px" }}>
            <DarkBar className={`h-12 ${titleWidth}`} />
            <DarkBar className="h-4 w-full max-w-[560px]" />
            <DarkBar className="h-4 w-2/3 max-w-[420px]" />
          </div>

          {cfg.search && (
            <DarkBar className="h-11 w-full rounded-full" style={{ maxWidth: "674px", background: "rgba(255,255,255,0.08)" }} />
          )}

          {cfg.pills && (
            <div className="flex w-full flex-wrap justify-center gap-3">
              {[64, 88, 72, 96, 80, 68].map((w, i) => (
                <DarkBar key={i} className="h-8 rounded-full" style={{ width: `${w}px` }} />
              ))}
            </div>
          )}

          {cfg.marquee && (
            <div className="mt-8 flex w-full flex-wrap gap-8 opacity-70">
              {Array.from({ length: 6 }).map((_, i) => (
                <DarkBar key={i} className="h-8 w-24" />
              ))}
            </div>
          )}
        </div>

        {cfg.featured === "event" ? (
          <div
            className="mx-auto mt-12 w-full"
            style={{ maxWidth: "820px", minHeight: "clamp(180px, 18vw, 220px)", borderRadius: "16px", background: "rgba(255,255,255,0.08)" }}
          />
        ) : cfg.featured ? (
          <FeaturedHeroSkeleton />
        ) : null}
      </div>
    </output>
  );
}

/* ------------------------------------------------------------------ */
/* Card skeletons                                                      */
/* ------------------------------------------------------------------ */

export type ListingCardVariant =
  | "blog"
  | "news"
  | "caseStudy"
  | "event"
  | "webinar"
  | "guide"
  | "resource";

interface GridConfig {
  cols: string;
  gap: string;
  justify: string;
}

const GRID: Record<ListingCardVariant, GridConfig> = {
  blog: { cols: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3", gap: "gap-8", justify: "justify-items-center" },
  news: { cols: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3", gap: "gap-8", justify: "justify-items-center lg:justify-items-stretch" },
  caseStudy: { cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap: "gap-6 lg:gap-8", justify: "justify-items-center lg:justify-items-start" },
  event: { cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap: "gap-8", justify: "justify-items-center lg:justify-items-stretch" },
  webinar: { cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap: "gap-8", justify: "justify-items-center lg:justify-items-stretch" },
  guide: { cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", gap: "gap-8", justify: "justify-items-center" },
  resource: { cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap: "gap-6 lg:gap-8", justify: "justify-items-center lg:justify-items-start" },
};

function BlogCardSkeleton(): React.ReactElement {
  return (
    <div
      className="flex w-full max-w-[404px] flex-col overflow-hidden bg-white"
      style={{ minHeight: "clamp(440px, 38vw, 528px)", borderRadius: "32px", boxShadow: CARD_SHADOW }}
    >
      <div className="m-3 overflow-hidden rounded-[20px] bg-[#e8e8f0]" style={{ aspectRatio: "380 / 200" }} />
      <div className="flex flex-1 flex-col gap-3 px-8 pb-8 pt-9">
        <div className="flex gap-4">
          <Bar className="h-3.5 w-24" />
          <Bar className="h-3.5 w-20" />
        </div>
        <Bar className="h-5 w-11/12" />
        <Bar className="h-5 w-3/4" />
        <div className="mt-1 flex flex-col gap-2">
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-2/3" />
        </div>
        <Bar className="mt-auto h-4 w-28" />
      </div>
    </div>
  );
}

function NewsCardSkeleton(): React.ReactElement {
  return (
    <div
      className="flex w-full max-w-[340px] flex-col overflow-hidden bg-white"
      style={{ minHeight: "clamp(380px, 30vw, 470px)", borderRadius: "32px", boxShadow: CARD_SHADOW }}
    >
      <div className="m-3 overflow-hidden rounded-[20px] bg-[#e8e8f0]" style={{ aspectRatio: "380 / 200" }} />
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-8 md:px-8 md:pb-8 md:pt-9">
        <div className="flex gap-4">
          <Bar className="h-3 w-20" />
          <Bar className="h-3 w-16" />
        </div>
        <Bar className="h-5 w-10/12" />
        <Bar className="h-5 w-2/3" />
        <div className="mt-1 flex flex-col gap-2">
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-3/4" />
        </div>
        <Bar className="mt-auto h-4 w-28" />
      </div>
    </div>
  );
}

function EventCardSkeleton({ tall = false }: { tall?: boolean }): React.ReactElement {
  return (
    <div
      className="flex w-full max-w-[295px] flex-col bg-white"
      style={{
        minHeight: tall ? "420px" : "360px",
        borderRadius: "16px",
        border: "1px solid #F1F5F9",
        boxShadow: EVENT_SHADOW,
      }}
    >
      <div className="mt-[15px] h-[138px] rounded-lg bg-[#e8e8f0]" style={{ marginLeft: "15px", marginRight: "15px" }} />
      <div className="flex flex-1 flex-col gap-3" style={{ padding: tall ? "32px" : "28px 32px 24px" }}>
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-10/12" />
        <Bar className="h-4 w-1/2" />
        <Bar className="mt-auto h-3.5 w-2/3" />
        <Bar className="h-[45px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function GuideCardSkeleton(): React.ReactElement {
  return (
    <div
      className="flex h-full w-full max-w-[320px] flex-col overflow-hidden bg-white"
      style={{ minHeight: "360px", borderRadius: "16px", boxShadow: CARD_SHADOW }}
    >
      <div className="mx-[14px] mt-[14px] overflow-hidden rounded-lg bg-[#e8e8f0]" style={{ aspectRatio: "267 / 140" }} />
      <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <Bar className="h-2.5 w-12" />
            <Bar className="h-3 w-20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Bar className="h-2.5 w-16" />
            <Bar className="h-3 w-20" />
          </div>
        </div>
        <Bar className="mt-2 h-px w-full" />
        <div className="mt-4 flex flex-1 flex-col gap-2">
          <Bar className="h-4 w-11/12" />
          <Bar className="h-4 w-2/3" />
          <Bar className="mt-1 h-3 w-full" />
          <Bar className="h-3 w-5/6" />
          <Bar className="mt-auto h-3.5 w-24" />
        </div>
      </div>
    </div>
  );
}

function ResourceCardSkeleton(): React.ReactElement {
  return (
    <div
      className="relative flex w-full flex-col overflow-hidden bg-white"
      style={{ maxWidth: "328px", minHeight: "clamp(300px, 26vw, 354px)", borderRadius: "32px", boxShadow: CARD_SHADOW }}
    >
      <div className="rounded-2xl bg-[#e8e8f0]" style={{ margin: "15px 15px 0", height: "138px" }} />
      <div className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-9">
        <Bar className="h-5 w-10/12" />
        <Bar className="h-5 w-1/2" />
        <Bar className="mt-auto h-3.5 w-24" />
      </div>
    </div>
  );
}

const CARD: Record<ListingCardVariant, () => React.ReactElement> = {
  blog: BlogCardSkeleton,
  caseStudy: BlogCardSkeleton,
  news: NewsCardSkeleton,
  event: () => <EventCardSkeleton />,
  webinar: () => <EventCardSkeleton tall />,
  guide: GuideCardSkeleton,
  resource: ResourceCardSkeleton,
};

/** A full-width job row skeleton (the careers list is a vertical stack). */
export function JobCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-white" style={{ borderRadius: "16px", padding: "24px", boxShadow: CARD_SHADOW }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex flex-1 flex-col gap-2">
          <Bar className="h-5 w-2/3" />
          <div className="flex gap-2">
            <Bar className="h-5 w-20 rounded-full" />
            <Bar className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <Bar className="h-3.5 w-40 lg:w-[160px]" />
        <Bar className="h-3.5 w-28 lg:w-[120px]" />
        <Bar className="h-10 w-full rounded-[10px] lg:w-32" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter rows + grid                                                  */
/* ------------------------------------------------------------------ */

export type ListingFilter = "none" | "dropdowns2" | "tabs";

function FilterRowSkeleton({ kind }: { kind: Exclude<ListingFilter, "none"> }): React.ReactElement {
  if (kind === "tabs") {
    return (
      <div className="mb-8 flex flex-wrap gap-3">
        {[88, 104, 96, 80, 92].map((w, i) => (
          <Bar key={i} className="h-9 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>
    );
  }
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <Bar className="h-10 w-44 rounded-xl" />
      <Bar className="h-10 w-36 rounded-xl" />
    </div>
  );
}

/**
 * The card grid in its section frame, sized + spaced to match the real listing
 * grid (optional section heading + filter row above it). `count` defaults to
 * one page (9). Standalone `animate-pulse` wrapper so it works as a `loading.tsx`
 * fallback and inside a client transition.
 */
export function ListingGridSkeleton({
  variant,
  count = 9,
  heading = true,
  filter = "none",
  withSection = true,
}: {
  variant: ListingCardVariant;
  count?: number;
  /** Render the section-title placeholder above the grid. */
  heading?: boolean;
  /** Filter-control placeholder above the grid. */
  filter?: ListingFilter;
  /** Wrap in the `#f6f6f6` section + container. Off when the caller already
   *  provides the section (e.g. a Browser swapping only the grid region). */
  withSection?: boolean;
}): React.ReactElement {
  const { cols, gap, justify } = GRID[variant];
  const Card = CARD[variant];
  const body = (
    <>
      {heading && <Bar className="mb-8 h-8 w-48" />}
      {filter !== "none" && <FilterRowSkeleton kind={filter} />}
      <div className={`grid ${cols} ${gap} ${justify}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex w-full justify-center">
            <Card />
          </div>
        ))}
      </div>
    </>
  );

  if (!withSection) {
    return (
      <output aria-live="polite" aria-label="Loading results" className="block w-full animate-pulse">
        <span className="sr-only">Loading…</span>
        {body}
      </output>
    );
  }

  return (
    <output
      aria-live="polite"
      aria-label="Loading results"
      className="block w-full animate-pulse"
      style={{ background: "#f6f6f6" }}
    >
      <span className="sr-only">Loading…</span>
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div style={{ paddingTop: "var(--spacing-section-sm)", paddingBottom: "var(--spacing-section-lg)" }}>{body}</div>
      </div>
    </output>
  );
}
