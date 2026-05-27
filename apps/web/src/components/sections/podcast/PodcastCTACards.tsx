import Image from "next/image";
import Link from "next/link";
import type { PodcastCtaCard } from "@/lib/podcast";

type Props = {
  cards: PodcastCtaCard[];
};

const CARD_ICONS = [
  "/images/podcast/explore.png",
  "/images/podcast/new.png",
  "/images/podcast/update.png",
] as const;

// Exact Figma tokens (node 373:3328 / card 373:3331)
// Outer ring: 1.5px solid `#076eff`-like cyan tint with 0.3 alpha — rendered as a padded
// container with a cyan-tinted gradient background so the inner white card sits inside it.
const RING_BG =
  "linear-gradient(90deg, rgba(44, 193, 235, 0.30) 0%, rgba(44, 193, 235, 0.30) 100%)";

// Button gradient (node 373:3344): `linear-gradient(90deg, #3960F9, #3960F9)` flat,
// with crisp 1px outline `#3960F9` and a small shadow for elevation.
const BUTTON_BG = "#3960F9";
const BUTTON_SHADOW =
  "0 1px 2px -1px rgba(9,6,63,0.4), 0 0 0 1px #3960F9, inset 0 1px 0 rgba(255,255,255,0.16)";

// Glow blobs behind each card (node 373:3332 / 373:3357)
const GLOW_GRADIENT =
  "linear-gradient(90deg, #06b6d4 0%, #6366f1 75%, #6366f1 100%)";

// Inner card grid lines (node 373:3352–3355): vertical fade lines at fractional positions
const VERTICAL_LINE_FADE =
  "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)";
const HORIZONTAL_LINE_FADE =
  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)";

function ArrowRight(): React.ReactElement {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 25 22"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>arrow</title>
      <path
        d="M14 5l6 6-6 6M4 11h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResourceCard({
  card,
  iconSrc,
}: {
  card: PodcastCtaCard;
  iconSrc: string;
}): React.ReactElement {
  return (
    <div className="relative flex w-full h-full">
      {/* Glow blob behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "8%",
          top: "38%",
          width: "84%",
          height: "42%",
          borderRadius: "9999px",
          background: GLOW_GRADIENT,
          opacity: 0.25,
          filter: "blur(48px)",
        }}
      />

      {/* Outer ring (cyan-tinted gradient frame) — flex so inner card fills it. */}
      <div
        className="relative flex w-full"
        style={{
          borderRadius: "clamp(28px, 2.8vw, 40px)",
          background: RING_BG,
          padding: "clamp(6px, 0.6vw, 8px)",
        }}
      >
        {/* Inner card — flex column. Content flows naturally, CTA pinned to bottom. */}
        <div
          className="relative flex w-full flex-col overflow-hidden bg-white"
          style={{
            borderRadius: "clamp(22px, 2.2vw, 32px)",
            boxShadow:
              "0 3px 4px rgba(22,34,51,0.04), 0 12px 24px rgba(22,34,51,0.06), 0 30px 60px rgba(22,34,51,0.08)",
            padding:
              "clamp(28px, 3vw, 40px) clamp(28px, 3vw, 40px) clamp(32px, 3.2vw, 40px)",
            gap: "clamp(16px, 1.6vw, 24px)",
            minHeight: "clamp(360px, 30vw, 435px)",
          }}
        >
          {/* Purple glow inside card */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "4%",
              top: "10%",
              width: "92%",
              height: "35%",
              background: "#df9bff",
              opacity: 0.45,
              filter: "blur(64px)",
              borderRadius: "50%",
            }}
          />

          {/* Decorative grid lines */}
          {[20, 40, 56, 80].map((pct) => (
            <div
              key={pct}
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                left: `${pct}%`,
                top: "2%",
                width: "1px",
                height: "55%",
                background: VERTICAL_LINE_FADE,
                opacity: 0.6,
              }}
            />
          ))}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "-6%",
              top: "20%",
              width: "112%",
              height: "1px",
              background: HORIZONTAL_LINE_FADE,
              opacity: 0.4,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: "-6%",
              top: "44%",
              width: "112%",
              height: "1px",
              background: HORIZONTAL_LINE_FADE,
              opacity: 0.4,
            }}
          />

          {/* Icon */}
          <div
            className="relative"
            style={{
              width: "clamp(96px, 9.5vw, 140px)",
              height: "clamp(96px, 9.5vw, 140px)",
            }}
          >
            <Image
              src={iconSrc}
              alt=""
              width={200}
              height={200}
              aria-hidden
              className="select-none pointer-events-none object-contain"
              style={{
                width: "120%",
                height: "120%",
                marginLeft: "-10%",
                marginTop: "-10%",
              }}
            />
          </div>

          {/* Text block — title + body, grows naturally */}
          <div
            className="relative flex flex-col"
            style={{ gap: "clamp(10px, 1.1vw, 16px)" }}
          >
            <h3
              className="text-[#111111]"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 700,
                fontSize: "var(--fs-h3)",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {card.title}
            </h3>
            <p
              className="text-[#555555]"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontWeight: 400,
                fontSize: "var(--fs-body)",
                lineHeight: 1.4,
                letterSpacing: "-0.03em",
              }}
            >
              {card.body}
            </p>
          </div>

          {/* Button — pushed to bottom of card so CTAs align horizontally across cards */}
          <div className="relative mt-auto">
            <Link
              href={card.ctaHref}
              className="inline-flex items-center text-white transition-transform duration-200 hover:-translate-y-px active:translate-y-0"
              style={{
                height: "clamp(36px, 3vw, 44px)",
                paddingLeft: "14px",
                paddingRight: "14px",
                gap: "8px",
                background: BUTTON_BG,
                borderRadius: "8px",
                boxShadow: BUTTON_SHADOW,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "var(--fs-body)",
                letterSpacing: "-0.01em",
                width: "fit-content",
              }}
            >
              <span>{card.ctaLabel}</span>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PodcastCTACards({ cards }: Props): React.ReactElement | null {
  const visible = cards.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-white"
      aria-label="Explore more from CleanStart"
    >
      {/* Top-right decorative vector arc — large quarter-circle radial */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-633px",
          top: "-525px",
          width: "1101px",
          height: "1101px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(100,13,251,0.12) 0%, rgba(100,13,251,0) 70%)",
        }}
      />

      {/* Bottom-left soft cyan glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          left: "-81px",
          bottom: "-160px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "#2CC1EB",
          filter: "blur(180px)",
          opacity: 0.25,
        }}
      />
      {/* Top-right soft purple glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          right: "-60px",
          top: "-80px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "#DF9BFF",
          filter: "blur(200px)",
          opacity: 0.7,
        }}
      />

      {/* Background SVG grid (subtle) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>grid</title>
        <defs>
          <pattern
            id="cta-grid"
            x="0"
            y="0"
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 44 0 L 0 0 0 44"
              fill="none"
              stroke="rgba(15, 23, 42, 0.08)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="cta-grid-mask" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="cta-grid-fade">
            <rect width="100%" height="100%" fill="url(#cta-grid-mask)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#cta-grid)" mask="url(#cta-grid-fade)" />
      </svg>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-[clamp(60px,7vw,100px)]">
        <div
          className="grid grid-cols-1 md:grid-cols-3 items-stretch"
          style={{ gap: "clamp(20px, 2.3vw, 33px)" }}
        >
          {visible.map((card, i) => (
            <ResourceCard
              key={card.title}
              card={card}
              iconSrc={CARD_ICONS[i] ?? CARD_ICONS[0]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
