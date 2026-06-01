import Link from "next/link";
import type { SpotlightCard } from "@/components/nav/data/spotlights";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";

// Accent is applied only to the action line at the bottom of each card — the
// one element that is actually actionable. Category eyebrows are muted neutral
// so the cards read as one quiet system rather than a wall of color.
const ACCENT = {
  cyan: "#2cc1eb",
  green: "#6cffc2",
  magenta: "#ff8ab8",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#471FC3,#2cc1eb)",
  "linear-gradient(135deg,#2cc1eb,#6cffc2)",
  "linear-gradient(135deg,#ff8ab8,#471FC3)",
  "linear-gradient(135deg,#6cffc2,#ff8ab8)",
];

// Shared card surface — one radius, one border, one elevated surface for every
// spotlight variant. Depth comes from the cs-tile-glass surface, not borders.
const CARD =
  "cs-tile-glass group/cta flex flex-col rounded-[14px] border border-white/[0.06] p-4 text-white transition-colors duration-200 ease-out hover:border-white/[0.10]";
const EYEBROW =
  "text-[10px] font-bold uppercase tracking-[0.14em] text-white/45";

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type Props = {
  spotlight: SpotlightCard;
  context: "resources" | "company";
};

export function SpotlightRenderer({ spotlight, context }: Props) {
  if (spotlight.kind === "event") {
    return (
      <Link href={`/event/${spotlight.slug}`} className={`${CARD} min-h-[230px]`}>
        <div>
          <div className={EYEBROW}>Next event</div>
          <div className="mt-2 text-[15px] font-bold leading-tight">{spotlight.title}</div>
          <div className="mt-1.5 text-[11px] text-white/65">
            {formatShortDate(spotlight.startsAt)}
          </div>
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.cyan }}
        >
          Save your seat <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "webinar") {
    return (
      <Link href={`/webinar/${spotlight.slug}`} className={`${CARD} min-h-[230px]`}>
        <div>
          <div className={EYEBROW}>Next webinar</div>
          <div className="mt-2 text-[15px] font-bold leading-tight">{spotlight.title}</div>
          <div className="mt-1.5 text-[11px] text-white/65">
            {formatShortDate(spotlight.startsAt)}
          </div>
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.magenta }}
        >
          Register <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "careers") {
    return (
      <Link href="/careers" className={`${CARD} min-h-[280px]`}>
        <div>
          <div className="text-[17px] font-bold leading-tight tracking-[-0.01em]">
            Build the base layer with us.
          </div>
          <div className="mt-1.5 text-xs leading-relaxed text-white/65">
            Engineers, SEs, designers. Remote-friendly. Equity-led.
          </div>
        </div>
        <div className="mt-auto pt-3">
          <div className="flex items-center">
            {AVATAR_GRADIENTS.map((g, i) => (
              <div
                key={i}
                className="h-[30px] w-[30px] rounded-full border-2 border-[#1a1336]"
                style={{ background: g, marginLeft: i === 0 ? 0 : -8 }}
              />
            ))}
            <div className="ml-3 text-[10px] text-white/70">
              {spotlight.openRoles} open roles
            </div>
          </div>
          <div
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: ACCENT.magenta }}
          >
            See careers <ArrowGlyph direction="right" size={12} />
          </div>
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "cms") {
    const accent = context === "resources" ? ACCENT.cyan : ACCENT.green;
    return (
      <Link href={spotlight.ctaHref} className={`${CARD} min-h-[230px]`}>
        <div>
          <div className={EYEBROW}>Spotlight</div>
          <div className="mt-2 text-[15px] font-bold leading-tight">{spotlight.headline}</div>
          {spotlight.sub && (
            <div className="mt-1.5 text-xs leading-relaxed text-white/65">{spotlight.sub}</div>
          )}
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: accent }}
        >
          {spotlight.ctaLabel} <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "evergreen" && spotlight.id === "bulletin") {
    return (
      <Link href="/subscribe" className={`${CARD} min-h-[230px]`}>
        <div>
          <div className={EYEBROW}>Newsletter</div>
          <div className="mt-2 text-[15px] font-bold leading-tight">
            Get the CleanStart Bulletin.
          </div>
          <div className="mt-1.5 text-xs leading-relaxed text-white/65">
            One email per month — new images, talks, advisories.
          </div>
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.cyan }}
        >
          Subscribe <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  // No /careers/talent-network route exists yet, so fall back to mailto.
  return (
    <Link
      href="mailto:careers@cleanstart.com?subject=Talent%20network"
      className={`${CARD} min-h-[280px]`}
    >
      <div>
        <div className={EYEBROW}>Talent network</div>
        <div className="mt-2 text-[15px] font-bold leading-tight">Not hiring right now?</div>
        <div className="mt-1.5 text-xs leading-relaxed text-white/65">
          Tell us what you do — we&apos;ll reach out when a role opens that fits.
        </div>
      </div>
      <div className="mt-auto pt-3">
        <div className="flex items-center gap-1.5">
          <div className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/60">
            ~30 sec
          </div>
          <div className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/60">
            no resume
          </div>
        </div>
        <div
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.green }}
        >
          Join the network <ArrowGlyph direction="right" size={12} />
        </div>
      </div>
    </Link>
  );
}
