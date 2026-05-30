import Link from "next/link";
import type { SpotlightCard } from "@/components/nav/data/spotlights";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";

const ACCENT = {
  cyan: { color: "#2cc1eb", border: "rgba(44,193,235,0.15)" },
  green: { color: "#6cffc2", border: "rgba(108,255,194,0.15)" },
  magenta: { color: "#ff8ab8", border: "rgba(255,138,184,0.15)" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#471FC3,#2cc1eb)",
  "linear-gradient(135deg,#2cc1eb,#6cffc2)",
  "linear-gradient(135deg,#ff8ab8,#471FC3)",
  "linear-gradient(135deg,#6cffc2,#ff8ab8)",
];

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
      <Link
        href={`/event/${spotlight.slug}`}
        className="group/cta flex min-h-[230px] flex-col rounded-[12px] border p-4 text-white transition-colors"
        style={{ background: "#1c1530", borderColor: ACCENT.cyan.border }}
      >
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: ACCENT.cyan.color }}
          >
            Next event
          </div>
          <div className="mt-2 text-[15px] font-bold leading-tight">{spotlight.title}</div>
          <div className="mt-1.5 text-[11px] text-white/65">
            {formatShortDate(spotlight.startsAt)}
          </div>
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.cyan.color }}
        >
          Save your seat <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "webinar") {
    return (
      <Link
        href={`/webinar/${spotlight.slug}`}
        className="group/cta flex min-h-[230px] flex-col rounded-[12px] border p-4 text-white transition-colors"
        style={{ background: "#1c1530", borderColor: ACCENT.magenta.border }}
      >
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: ACCENT.magenta.color }}
          >
            Next webinar
          </div>
          <div className="mt-2 text-[15px] font-bold leading-tight">{spotlight.title}</div>
          <div className="mt-1.5 text-[11px] text-white/65">
            {formatShortDate(spotlight.startsAt)}
          </div>
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.magenta.color }}
        >
          Register <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "careers") {
    return (
      <Link
        href="/careers"
        className="group/cta flex min-h-[280px] flex-col rounded-[12px] border p-4 text-white transition-colors"
        style={{ background: "#1c1530", borderColor: ACCENT.magenta.border }}
      >
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
                className="h-[30px] w-[30px] rounded-full border-2 border-[#1c1530]"
                style={{ background: g, marginLeft: i === 0 ? 0 : -8 }}
              />
            ))}
            <div className="ml-3 text-[10px] text-white/70">
              {spotlight.openRoles} open roles
            </div>
          </div>
          <div
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: ACCENT.magenta.color }}
          >
            See careers <ArrowGlyph direction="right" size={12} />
          </div>
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "cms") {
    const a = context === "resources" ? ACCENT.cyan : ACCENT.green;
    return (
      <Link
        href={spotlight.ctaHref}
        className="group/cta flex min-h-[230px] flex-col rounded-[12px] border p-4 text-white transition-colors"
        style={{ background: "#1c1530", borderColor: a.border }}
      >
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: a.color }}
          >
            Spotlight
          </div>
          <div className="mt-2 text-[15px] font-bold leading-tight">{spotlight.headline}</div>
          {spotlight.sub && (
            <div className="mt-1.5 text-xs leading-relaxed text-white/65">{spotlight.sub}</div>
          )}
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: a.color }}
        >
          {spotlight.ctaLabel} <ArrowGlyph direction="right" size={12} />
        </div>
      </Link>
    );
  }

  if (spotlight.kind === "evergreen" && spotlight.id === "bulletin") {
    return (
      <Link
        href="/subscribe"
        className="group/cta flex min-h-[230px] flex-col rounded-[12px] border p-4 text-white transition-colors"
        style={{ background: "#1c1530", borderColor: ACCENT.cyan.border }}
      >
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: ACCENT.cyan.color }}
          >
            Newsletter
          </div>
          <div className="mt-2 text-[15px] font-bold leading-tight">
            Get the CleanStart Bulletin.
          </div>
          <div className="mt-1.5 text-xs leading-relaxed text-white/65">
            One email per month — new images, talks, advisories.
          </div>
        </div>
        <div
          className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.cyan.color }}
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
      className="group/cta flex min-h-[280px] flex-col rounded-[12px] border p-4 text-white transition-colors"
      style={{ background: "#1c1530", borderColor: ACCENT.green.border }}
    >
      <div>
        <div
          className="text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: ACCENT.green.color }}
        >
          Talent network
        </div>
        <div className="mt-2 text-[15px] font-bold leading-tight">Not hiring right now?</div>
        <div className="mt-1.5 text-xs leading-relaxed text-white/65">
          Tell us what you do — we&apos;ll reach out when a role opens that fits.
        </div>
      </div>
      <div className="mt-auto pt-3">
        <div className="flex items-center gap-1.5">
          <div
            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            style={{
              color: ACCENT.green.color,
              background: "rgba(108,255,194,0.10)",
              borderColor: ACCENT.green.border,
            }}
          >
            ~30 sec
          </div>
          <div
            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            style={{
              color: ACCENT.green.color,
              background: "rgba(108,255,194,0.10)",
              borderColor: ACCENT.green.border,
            }}
          >
            no resume
          </div>
        </div>
        <div
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: ACCENT.green.color }}
        >
          Join the network <ArrowGlyph direction="right" size={12} />
        </div>
      </div>
    </Link>
  );
}
