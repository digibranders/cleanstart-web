import Link from "next/link";
import type { CSSProperties } from "react";
import type { SpotlightCard } from "@/components/nav/data/spotlights";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";

// Phase-8 rule: a single brand accent (cyan) on the one actionable line per
// card. No multicolor text — category eyebrows stay muted neutral so the cards
// read as one quiet system.
const ACCENT = "#2cc1eb";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#471FC3,#2cc1eb)",
  "linear-gradient(135deg,#131e8f,#2cc1eb)",
  "linear-gradient(135deg,#640DFB,#471FC3)",
  "linear-gradient(135deg,#2cc1eb,#dab6f3)",
];

const EYEBROW =
  "text-[10px] font-bold uppercase tracking-[0.14em] text-white/45";

// The live CleanStart community lives in the LinkedIn group; the chips name the
// channels where the community is active (the card itself opens the primary one).
const COMMUNITY_LINKEDIN_URL = "https://www.linkedin.com/groups/18324021/";
const COMMUNITY_CHANNELS = ["LinkedIn"];

// Shared card surface. `hero` swaps the Level-2 tile for the elevated, brand-
// edged hero surface (used where the spotlight IS the featured zone — Company).
// Full static class strings so Tailwind's scanner emits every arbitrary value.
function cardClass(hero: boolean): string {
  return hero
    ? "cs-hero-surface group/cta flex flex-col rounded-[14px] p-4 text-white"
    : "cs-tile-glass cs-tile-interactive group/cta flex flex-col rounded-[12px] p-4 text-white";
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type Props = {
  spotlight: SpotlightCard;
  /** Render on the elevated hero surface — used where the spotlight is the featured zone. */
  hero?: boolean;
  /** Drop the fixed min-height so the card sizes to its content (for stacked layouts). */
  dense?: boolean;
  /** Inline style applied to the card root — e.g. a brand-gradient background. */
  style?: CSSProperties;
};

export function SpotlightRenderer({ spotlight, hero = false, dense = false, style }: Props) {
  const CARD = cardClass(hero);
  // In stacked layouts the card shares the column with a sibling, so the
  // floor-filling min-height is dropped and the card hugs its content.
  const minH = (cls: string): string => (dense ? "" : cls);
  const ACTION =
    "mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold";
  const headlineClass = hero
    ? "text-[19px] font-semibold leading-[1.15] tracking-[-0.015em] text-white/95"
    : "text-[15px] font-bold leading-tight text-white";

  if (spotlight.kind === "event") {
    return (
      <Link href={`/event/${spotlight.slug}`} className={`${CARD} ${minH("min-h-[230px]")}`} style={style}>
        <div>
          <div className={EYEBROW}>Next event</div>
          <div className={`mt-2 ${headlineClass}`}>{spotlight.title}</div>
          <div className="mt-1.5 text-[11px] text-white/65">
            {formatShortDate(spotlight.startsAt)}
          </div>
        </div>
        <div className={ACTION} style={{ color: ACCENT }}>
          Save your seat <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "webinar") {
    return (
      <Link href={`/webinar/${spotlight.slug}`} className={`${CARD} ${minH("min-h-[230px]")}`} style={style}>
        <div>
          <div className={EYEBROW}>Next webinar</div>
          <div className={`mt-2 ${headlineClass}`}>{spotlight.title}</div>
          <div className="mt-1.5 text-[11px] text-white/65">
            {formatShortDate(spotlight.startsAt)}
          </div>
        </div>
        <div className={ACTION} style={{ color: ACCENT }}>
          Register <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "careers") {
    return (
      <Link href="/careers" className={`${CARD} ${minH("min-h-[280px]")}`} style={style}>
        <div>
          <div className={headlineClass}>Build the base layer with us.</div>
          <div className="mt-1.5 text-xs leading-relaxed text-white/65">
            Engineers, SEs, designers. Remote-friendly. Equity-led.
          </div>
        </div>
        <div className="mt-auto pt-3">
          <div className="flex items-center">
            {AVATAR_GRADIENTS.map((g, i) => (
              <div
                key={i}
                className="h-[30px] w-[30px] rounded-full border-2 border-[#1b1640]"
                style={{ background: g, marginLeft: i === 0 ? 0 : -8 }}
              />
            ))}
            <div className="ml-3 text-[10px] text-white/70">
              {spotlight.openRoles} open roles
            </div>
          </div>
          <div
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: ACCENT }}
          >
            See careers <ArrowGlyph direction="right" size={12} />
          </div>
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "cms") {
    return (
      <Link href={spotlight.ctaHref} className={`${CARD} ${minH("min-h-[230px]")}`} style={style}>
        <div>
          <div className={EYEBROW}>Spotlight</div>
          <div className={`mt-2 ${headlineClass}`}>{spotlight.headline}</div>
          {spotlight.sub && (
            <div className="mt-1.5 text-xs leading-relaxed text-white/65">{spotlight.sub}</div>
          )}
        </div>
        <div className={ACTION} style={{ color: ACCENT }}>
          {spotlight.ctaLabel} <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "evergreen" && spotlight.id === "bulletin") {
    return (
      <Link href="/subscribe" className={`${CARD} ${minH("min-h-[230px]")}`} style={style}>
        <div>
          <div className={EYEBROW}>Newsletter</div>
          <div className={`mt-2 ${headlineClass}`}>Get the CleanStart Bulletin.</div>
          <div className="mt-1.5 text-xs leading-relaxed text-white/65">
            One email per month — new images, talks, advisories.
          </div>
        </div>
        <div className={ACTION} style={{ color: ACCENT }}>
          Subscribe <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  // Evergreen community fallback (id: 'community') — shown when there are no open
  // roles and no CMS spotlight. Ends the Company menu on an open-source invitation
  // rather than a "not hiring" note. Opens the live LinkedIn community group in a
  // new tab; the chips name the channels where the community is active.
  return (
    <a
      href={COMMUNITY_LINKEDIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${CARD} ${minH("min-h-[280px]")}`}
    >
      <div>
        <div className={EYEBROW}>Community</div>
        <div className={`mt-2 ${headlineClass}`}>Build in the open with us.</div>
        <div className="mt-1.5 text-xs leading-relaxed text-white/65">
          Open builds, public discussions, and a contributor program — jump in.
        </div>
      </div>
      <div className="mt-auto pt-3">
        <div className="flex items-center gap-1.5">
          {COMMUNITY_CHANNELS.map((channel) => (
            <div
              key={channel}
              className="cs-chip rounded-[6px] px-2 py-0.5 text-[10px] font-semibold text-white/65"
            >
              {channel}
            </div>
          ))}
        </div>
        <div
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT }}
        >
          Join the community <ArrowGlyph direction="up-right" size={12} />
        </div>
      </div>
    </a>
  );
}
