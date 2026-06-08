import Image from "next/image";
import Link from "next/link";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

type CardData = {
  title: string;
  blurb: string;
  icon: string;
};

const CARDS: CardData[] = [
  {
    title: "Clean\nImages",
    blurb: "Minimal. Immutable.\nZero CVE.",
    icon: "/images/cleanstart-factory/factory-images.webp",
  },
  {
    title: "Clean AI\nModels",
    blurb: "Scanned. Signed. Safe\nby design.",
    icon: "/images/cleanstart-factory/factory-models.webp",
  },
  {
    title: "Clean\nLibraries",
    blurb: "Complete. Signed.\nContinuously verified.",
    icon: "/images/cleanstart-factory/factory-libraries.webp",
  },
  {
    title: "Clean\nPackages",
    blurb: "Curated. Verified. No\nhidden risk.",
    icon: "/images/cleanstart-factory/factory-packages.webp",
  },
];

// The `factory-card` container's inline size drives every interior dimension
// via `cqw` units — orb, title font, blurb font, arrow circle, paddings — so
// the entire card scales as one unit.
function FactoryCard({ data, isFirst }: { data: CardData; isFirst: boolean }) {
  // Stable, unique clipPath id for the chevron SVG so the 5 rendered cards
  // don't share the same id (which would collide and break the SVG clip).
  const cardKey = data.title.replace(/\s+/g, "-").toLowerCase();

  return (
    <figure
      // `min-w-0` lets the grid column actually shrink below the card's
      // intrinsic content width on narrow tablets — without it the column
      // would inflate and the row would overflow horizontally.
      className="factory-card relative min-w-0"
      style={{
        // The parent grid drives the card's outer width. We fill the column
        // and lock the aspect ratio; every interior dimension below uses `cqw`
        // so it scales 1:1 with whatever width the grid hands us.
        width: "100%",
        aspectRatio: "232.8 / 374",
        containerType: "inline-size",
      }}
    >
      {/* Card → platform-bar exhaust flare. Its top is pinned 57cqw above the
          card's bottom edge (top:100% + marginTop:-57cqw), so `clipPath` insets
          that same 57cqw off the top to hide the portion overlapping the card
          body. Only the glow below the card — in the gap toward the platform
          bar — stays visible; nothing bleeds inside the card. */}
      <Image
        src="/images/cleanstart-factory/flare.webp"
        alt=""
        aria-hidden
        width={267}
        height={358}
        sizes="(min-width: 1280px) 160px, 12vw"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none"
        style={{
          width: "130cqw",
          height: "auto",
          top: "100%",
          marginTop: "-57cqw",
          clipPath: "inset(57cqw 0 0 0)",
          mixBlendMode: "screen",
          filter: "saturate(1.15) brightness(1.1)",
        }}
      />

      {/* Card body image. `borderRadius: 10.3cqw` clips the partial-alpha
          pixels of the bottom-left flare-halo leak so all four corners read as
          a constant rounded-rect. Painted after the flare so it sits on top
          and hides the flare's upper halo. */}
      <Image
        src="/images/cleanstart-factory/factory-card-bg.webp"
        alt=""
        aria-hidden
        width={232}
        height={374}
        sizes="(min-width: 1280px) 233px, 16vw"
        priority={isFirst}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ borderRadius: "10.3cqw" }}
      />


      {/* Orb (chrome iridescent ring). */}
      <Image
        src={data.icon}
        alt=""
        aria-hidden
        width={192}
        height={200}
        sizes="(min-width: 1280px) 108px, 8vw"
        priority={isFirst}
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none"
        style={{
          width: "46.39cqw",
          height: "auto",
          top: "17.1cqw",
        }}
      />

      {/* Title + blurb stack. All font/leading/letter-spacing in cqw so it
          scales with the card. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{
          top: "79.04cqw",
          width: "86.34cqw",
          gap: "5.15cqw",
        }}
      >
        <h3
          className="whitespace-pre-line text-center font-display font-normal text-white"
          style={{
            // The clamp adds a 14px floor so the title stays readable when
            // the card shrinks below ~102px (smallest realistic tablet column).
            fontSize: "clamp(14px, 13.75cqw, 32px)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          {data.title}
        </h3>
        <p
          className="whitespace-pre-line text-center text-white/80"
          style={{
            fontFamily: "var(--font-sora), Sora, sans-serif",
            // 10.5px floor keeps the blurb legible on the narrowest tablet column.
            fontSize: "clamp(10.5px, 6.01cqw, 14px)",
            lineHeight: 1.2,
            letterSpacing: "-0.04em",
          }}
        >
          {data.blurb}
        </p>
      </div>

      {/* Arrow circle. href is a placeholder; per-card destinations will be
          wired later. Sized in cqw so the hit target scales with the card. */}
      <Link
        href="#"
        aria-label={`Learn more about ${data.title.replace("\n", " ")}`}
        className="absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          top: "138.32cqw",
          // The 22px floor keeps the tap target reasonable on the narrowest
          // tablet column.
          width: "clamp(22px, 12.03cqw, 28px)",
          height: "clamp(22px, 12.03cqw, 28px)",
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full"
        >
          <g clipPath={`url(#clip0_arrow_${cardKey})`}>
            <path
              d="M13.5127 8.24061L18.6556 13.3834C18.8163 13.5442 18.9065 13.7622 18.9065 13.9894C18.9065 14.2167 18.8163 14.4347 18.6556 14.5954L13.5127 19.7383C13.4337 19.8202 13.3391 19.8854 13.2345 19.9304C13.1299 19.9753 13.0175 19.9989 12.9037 19.9999C12.7898 20.0009 12.677 19.9792 12.5716 19.9361C12.4663 19.893 12.3706 19.8294 12.2901 19.7489C12.2096 19.6684 12.146 19.5727 12.1029 19.4674C12.0598 19.362 12.0381 19.2492 12.0391 19.1354C12.0401 19.0216 12.0637 18.9091 12.1087 18.8045C12.1536 18.6999 12.2189 18.6054 12.3007 18.5263L16.8376 13.9894L12.3007 9.45261C12.1446 9.29095 12.0582 9.07443 12.0602 8.84969C12.0621 8.62495 12.1523 8.40997 12.3112 8.25105C12.4701 8.09213 12.6851 8.00199 12.9098 8.00003C13.1346 7.99808 13.3511 8.08447 13.5127 8.24061Z"
              fill="white"
            />
          </g>
          <rect
            x="0.875"
            y="0.875"
            width="26.25"
            height="26.25"
            rx="13.125"
            stroke="white"
            strokeWidth="1.75"
          />
          <defs>
            <clipPath id={`clip0_arrow_${cardKey}`}>
              <rect width="28" height="28" rx="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </Link>

      <figcaption className="sr-only">
        {data.title.replace("\n", " ")}. {data.blurb.replace("\n", " ")}
      </figcaption>
    </figure>
  );
}

// Mobile factory (Pipeline Tower): 4 icon-left product cards fed by a left
// light-rail, then a full-width "CleanStart Platform" card, then a CleanSight
// band — the same content as the desktop enclosure, stacked vertically.

// Sized in container queries where cqw = 1% of card width.
function FactoryMobileCard({ data, isFirst }: { data: CardData; isFirst: boolean }) {
  const cardKey = `mobile-${data.title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <figure
      className="factory-card-mobile relative w-full shrink-0"
      style={{
        aspectRatio: "295 / 88",
        containerType: "inline-size",
      }}
    >
      <Image
        src="/images/cleanstart-factory/factory-card-bg-mobile.webp"
        alt=""
        aria-hidden
        width={295}
        height={87}
        sizes="(max-width: 480px) 90vw, 360px"
        priority={isFirst}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ borderRadius: "8.14cqw" }}
      />

      {/* Orb on left, centered vertically and pushed slightly past the card
          edge. */}
      <Image
        src={data.icon}
        alt=""
        aria-hidden
        width={192}
        height={200}
        sizes="(max-width: 480px) 60px, 80px"
        priority={isFirst}
        className="pointer-events-none absolute select-none"
        style={{
          width: "22cqw",
          height: "auto",
          left: "3cqw",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      <div
        className="absolute flex flex-col text-white"
        style={{
          left: "29cqw",
          top: "50%",
          transform: "translateY(-50%)",
          gap: "1.4cqw",
          maxWidth: "57cqw",
        }}
      >
        <h3
          className="whitespace-pre-line font-display font-medium"
          style={{
            fontSize: "5.42cqw",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {data.title.replace("\n", " ")}
        </h3>
        <p
          className="whitespace-pre-line text-white/80"
          style={{
            fontFamily: "var(--font-sora), Sora, sans-serif",
            fontSize: "3.73cqw",
            lineHeight: 1.25,
            letterSpacing: "-0.04em",
          }}
        >
          {data.blurb.replace("\n", " ")}
        </p>
      </div>

      {/* Chevron link on right. */}
      <Link
        href="#"
        aria-label={`Learn more about ${data.title.replace("\n", " ")}`}
        className="absolute right-[4cqw] top-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/70"
        style={{
          width: "7cqw",
          height: "7cqw",
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full"
        >
          <g clipPath={`url(#clip0_arrow_${cardKey})`}>
            <path
              d="M13.5127 8.24061L18.6556 13.3834C18.8163 13.5442 18.9065 13.7622 18.9065 13.9894C18.9065 14.2167 18.8163 14.4347 18.6556 14.5954L13.5127 19.7383C13.4337 19.8202 13.3391 19.8854 13.2345 19.9304C13.1299 19.9753 13.0175 19.9989 12.9037 19.9999C12.7898 20.0009 12.677 19.9792 12.5716 19.9361C12.4663 19.893 12.3706 19.8294 12.2901 19.7489C12.2096 19.6684 12.146 19.5727 12.1029 19.4674C12.0598 19.362 12.0381 19.2492 12.0391 19.1354C12.0401 19.0216 12.0637 18.9091 12.1087 18.8045C12.1536 18.6999 12.2189 18.6054 12.3007 18.5263L16.8376 13.9894L12.3007 9.45261C12.1446 9.29095 12.0582 9.07443 12.0602 8.84969C12.0621 8.62495 12.1523 8.40997 12.3112 8.25105C12.4701 8.09213 12.6851 8.00199 12.9098 8.00003C13.1346 7.99808 13.3511 8.08447 13.5127 8.24061Z"
              fill="white"
            />
          </g>
          <rect
            x="0.875"
            y="0.875"
            width="26.25"
            height="26.25"
            rx="13.125"
            stroke="white"
            strokeWidth="1.75"
          />
          <defs>
            <clipPath id={`clip0_arrow_${cardKey}`}>
              <rect width="28" height="28" rx="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </Link>

      <figcaption className="sr-only">
        {data.title.replace("\n", " ")}. {data.blurb.replace("\n", " ")}
      </figcaption>
    </figure>
  );
}

// Non-interactive platform-stage capsule — the mobile twin of the desktop
// PlatformPill, sized in cqw against the platform card it lives in. Rendered as
// a <span> because the stages are labels, not controls.
function MobileFactoryPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        background:
          "radial-gradient(113.85% 132% at 15.93% 50%, #000000 19.71%, #1E5AFF 100%)",
        boxShadow: "0 0 6px rgba(30, 90, 255, 0.34)",
        border: "1px solid #CDE4FF",
        padding: "0 13px",
        height: "clamp(24px, 8.5cqw, 32px)",
        fontFamily: "var(--font-manrope), Manrope, sans-serif",
        fontSize: "clamp(13px, 4.57cqw, 16px)",
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        opacity: 0.9,
      }}
    >
      {label}
    </span>
  );
}

// CleanStart Platform card — the single consolidated bar from the desktop
// enclosure, ported to mobile as a full-width card. Its own container-query
// root so the title and the 7 stage pills scale with the card width and wrap
// across rows. The opaque gradient lets it occlude the connector flare that
// bleeds up from the cards column above.
function MobilePlatformCard() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        containerType: "inline-size",
        borderRadius: 18,
        border: "1px solid #dab6f3",
        background: "linear-gradient(180deg, #1c1455 0%, #321fa3 100%)",
        boxShadow:
          "-8px 4px 20px rgba(0,0,0,0.23), -33px 16px 37px rgba(0,0,0,0.2)",
      }}
    >
      {/* Diagonal pattern, matching the desktop platform bar + enclosure. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/cleanstart-factory/diagonal-lines.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "22px 22px",
          mixBlendMode: "luminosity",
          opacity: 0.6,
        }}
      />

      <div
        className="relative flex flex-col items-center"
        style={{ padding: "20px 18px", gap: 14 }}
      >
        <h3
          className="text-center font-display text-white"
          style={{
            fontSize: "clamp(17px, 5.6cqw, 20px)",
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          CleanStart Platform
        </h3>
        <div
          className="flex flex-row flex-wrap items-center justify-center"
          style={{ gap: 10 }}
        >
          {PLATFORM_PILLS.map((p) => (
            <MobileFactoryPill key={p} label={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

// CleanSight band — the desktop CleanSight rail rotated into a landscape card.
// Same iridescent gradient and flipped "\" diagonal hatch as the rail, with the
// wordmark + a supporting tagline centered. Its own container-query root so the
// type scales with the card width. The card carries no flares of its own —
// flares live only in the gaps between cards (see PlatformPipelineMobile).
function MobileCleanSightCard() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        containerType: "inline-size",
        borderRadius: 20,
        border: "1px solid rgba(218, 182, 243, 0.55)",
        background:
          "linear-gradient(110deg, #2f57c6 0%, #2f6ad6 27%, #3a55cc 52%, #5733bd 80%, #6a3fd0 100%)",
        boxShadow:
          "-8px 4px 20px rgba(0,0,0,0.23), -33px 16px 37px rgba(0,0,0,0.2)",
      }}
    >
      {/* Diagonal hatch — flipped to the "\" orientation, matching the desktop
          CleanSight rail. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/cleanstart-factory/diagonal-lines.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "22px 22px",
          transform: "scaleX(-1)",
          opacity: 0.55,
          mixBlendMode: "luminosity",
        }}
      />

      {/* Wordmark + tagline, centered. */}
      <div
        className="relative flex flex-col items-center text-center"
        style={{ padding: "30px 24px", gap: 8 }}
      >
        <span
          className="font-display text-white"
          style={{
            fontSize: "clamp(24px, 8cqw, 30px)",
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          CleanSight
        </span>
        <p
          className="text-white/80"
          style={{
            fontFamily: "var(--font-sora), Sora, sans-serif",
            fontSize: "clamp(12px, 3.9cqw, 14px)",
            lineHeight: 1.35,
            letterSpacing: "-0.04em",
            maxWidth: 280,
          }}
        >
          Continuous visibility across every image and cluster.
        </p>
      </div>
    </div>
  );
}

// Mobile root: left rail (vertical line + horizontal flares entering each card
// from the left) + cards column + connector flares, then the CleanStart
// Platform card and the CleanSight band, bridged by connector flares.
function PlatformPipelineMobile() {
  const RAIL_WIDTH = 56;
  const CARDS_GAP = 16;
  const FLARE_WIDTH = 130;
  const FLARE_LEFT_OFFSET = RAIL_WIDTH + 60 - 24;
  const LINE_X = RAIL_WIDTH - FLARE_LEFT_OFFSET + FLARE_WIDTH / 2;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: "100%",
        // Mobile factory wrapper cap. 480 avoids the visible gutters that a
        // narrower cap left on small-tablet portrait widths while keeping the
        // icon-left card layout from ballooning. Phones under 480px render at
        // full width. All interior dimensions use container queries (cqw), so
        // orbs, text, flares, and pills scale 1:1 with this width.
        maxWidth: 480,
      }}
    >
      {/* Cards column — each row is a left-rail flare plus a card. The vertical
          line lives inside this section so it stays confined to the cards'
          height. */}
      <div
        className="relative flex flex-col"
        style={{ gap: CARDS_GAP, paddingLeft: RAIL_WIDTH }}
      >
        {/* Vertical light line spanning from the first flare center to the last
            flare center, passing through the center of each horizontal flare. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: `${LINE_X}px`,
            // Offset from container top/bottom = half a card's height, so the
            // line starts at the first card's center and ends at the last's.
            top: "calc((100% / 4 - 16px * 3 / 4) / 2)",
            bottom: "calc((100% / 4 - 16px * 3 / 4) / 2)",
            width: 2,
            transform: "translateX(-50%)",
            background:
              "linear-gradient(180deg, rgba(120, 200, 255, 0) 0%, rgba(120, 200, 255, 0.85) 4%, rgba(120, 200, 255, 0.85) 96%, rgba(120, 200, 255, 0) 100%)",
            boxShadow:
              "0 0 6px rgba(120, 200, 255, 0.7), 0 0 12px rgba(120, 200, 255, 0.35)",
            mixBlendMode: "screen",
          }}
        />

        {/* Center flares rendered before the cards in DOM so the cards paint
            over any overlapping portion. Their vertical center lands at the
            midpoint of the gap below the cards column; the bottom block (next
            sibling) paints after and hides the part extending into its area. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: "calc(100% - 71px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 182,
          }}
        >
          {[
            { offset: -26 },
            { offset: 26 },
          ].map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.offset}
              src="/images/cleanstart-factory/flare.webp"
              alt=""
              aria-hidden
              className="pointer-events-none absolute select-none"
              style={{
                top: 0,
                left: "50%",
                transform: `translateX(calc(-50% + ${p.offset}px))`,
                width: 136,
                height: 182,
                mixBlendMode: "screen",
                filter: "saturate(1.3) brightness(1.2)",
              }}
            />
          ))}
        </div>

        {CARDS.map((c, i) => (
          <div key={c.title} className="relative">
            {/* Horizontal flare entering from the left: flare.webp rotated 90deg
                clockwise puts the bright tip on the right (entering the card)
                with the tail fading left toward the vertical line. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-factory/flare.webp"
              alt=""
              aria-hidden
              className="pointer-events-none absolute select-none"
              style={{
                left: `-${FLARE_LEFT_OFFSET}px`,
                top: "50%",
                width: FLARE_WIDTH,
                height: "auto",
                transform: "translateY(-50%) rotate(90deg)",
                transformOrigin: "center",
                mixBlendMode: "screen",
                filter: "saturate(1.3) brightness(1.2)",
              }}
            />
            <div style={{ containerType: "inline-size" }}>
              <FactoryMobileCard data={c} isFirst={i === 0} />
            </div>
          </div>
        ))}
      </div>

      {/* Gap between the cards column and the platform card. The cards-column
          connector flares (above) bleed down into here; the opaque platform
          card paints over the lower portion. */}
      <div aria-hidden style={{ height: 44 }} />

      {/* CleanStart Platform + the connector flares feeding the CleanSight band.
          The flares are rendered BEFORE the card and pinned to the gap below it
          (top: 100% - 71px), so the opaque platform card paints over their upper
          half (no bleed into the card) and the CleanSight band (next sibling)
          paints over their lower half — only the gap slice glows. Geometrically
          identical to the cards → platform connector above. */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: "calc(100% - 71px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 182,
          }}
        >
          {[-26, 26].map((offset) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={offset}
              src="/images/cleanstart-factory/flare.webp"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute select-none"
              style={{
                top: 0,
                left: "50%",
                transform: `translateX(calc(-50% + ${offset}px))`,
                width: 136,
                height: 182,
                mixBlendMode: "screen",
                filter: "saturate(1.3) brightness(1.2)",
              }}
            />
          ))}
        </div>

        <MobilePlatformCard />
      </div>

      {/* Gap between the platform card and the CleanSight band — mirrors the
          cards → platform gap so both connectors read identically. */}
      <div aria-hidden style={{ height: 44 }} />

      {/* CleanSight band — the desktop rail rotated into a landscape card. */}
      <MobileCleanSightCard />
    </div>
  );
}

// Desktop factory enclosure. One rounded container (same dark-gradient +
// lavender-stroke + diagonal-pattern treatment as the cards) wraps a full-height
// CleanSight rail on the left and a right column holding the 4 cards on top and
// the thin "CleanStart Platform" pill bar below. Every interior dimension is in
// cqw via FQW() against the FW reference width, so the whole block scales as one
// unit from md up through xl.

/** Reference width of the outer enclosure (border-box), in px. */
const FW = 1340;
/** Convert a reference px (relative to the FW-wide enclosure) to cqw. */
const FQW = (px: number) => `${(px / FW) * 100}cqw`;

/** Platform-stage labels. These are static tags — not interactive controls. */
const PLATFORM_PILLS = [
  "Plan",
  "Analyze",
  "Orchestrate",
  "Spec",
  "Build",
  "Attest",
  "Handoff",
] as const;

// Non-interactive capsule. Rendered as a <span> (not a button) because the
// platform stages are labels, not controls.
function PlatformPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center text-white"
      style={{
        background:
          "radial-gradient(113.85% 132% at 15.93% 50%, #000000 19.71%, #1E5AFF 100%)",
        border: `${FQW(1.1)} solid #CDE4FF`,
        boxShadow: `0 0 ${FQW(5)} rgba(30, 90, 255, 0.34)`,
        // Radius exceeds the height, so the pill is always a perfect capsule.
        borderRadius: FQW(99),
        padding: `${FQW(5)} ${FQW(15)}`,
        height: FQW(28),
        fontFamily: "var(--font-manrope), Manrope, sans-serif",
        fontSize: FQW(15),
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: "-0.04em",
        opacity: 0.9,
      }}
    >
      {label}
    </span>
  );
}

// Tall iridescent rail on the left of the enclosure. Decorative diagonal hatch
// + sheen behind the static "CleanSight" wordmark. Stretches to the row height
// (align-items: stretch on the parent), so it is always as tall as the cards +
// platform-bar column to its right.
function CleanSightRail() {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: FQW(210),
        borderRadius: FQW(20),
        border: `${FQW(1)} solid rgba(218, 182, 243, 0.55)`,
        background:
          "linear-gradient(168deg, #2f57c6 0%, #2f6ad6 27%, #3a55cc 52%, #5733bd 80%, #6a3fd0 100%)",
      }}
    >
      {/* Diagonal hatch — the Figma CleanSight pattern (the diagonal-lines.png
          tile), flipped to the design's "\" orientation (the source rotates the
          tile 90deg). Same tile + scale the enclosure uses, so the whole factory
          reads as one texture family. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/cleanstart-factory/diagonal-lines.png)",
          backgroundRepeat: "repeat",
          backgroundSize: `${FQW(14 * 1.6233)} ${FQW(14 * 1.6233)}`,
          transform: "scaleX(-1)",
          opacity: 0.6,
          mixBlendMode: "luminosity",
        }}
      />

      {/* Edge glows — the same flare.webp bloom used at the base of the 4 cards,
          rotated 90deg into a horizontal edge glow and pinned to this card's top
          and bottom edges. Screen-blended so it reads as light over the hatch. */}
      <Image
        src="/images/cleanstart-factory/flare.webp"
        alt=""
        aria-hidden
        width={267}
        height={358}
        sizes="160px"
        className="pointer-events-none absolute left-1/2 top-0 select-none"
        style={{
          width: FQW(150),
          height: "auto",
          transform: "translate(-50%, -50%) rotate(90deg)",
          mixBlendMode: "screen",
          filter: "saturate(1.35) brightness(1.4)",
        }}
      />
      <Image
        src="/images/cleanstart-factory/flare.webp"
        alt=""
        aria-hidden
        width={267}
        height={358}
        sizes="160px"
        className="pointer-events-none absolute bottom-0 left-1/2 select-none"
        style={{
          width: FQW(150),
          height: "auto",
          transform: "translate(-50%, 50%) rotate(90deg)",
          mixBlendMode: "screen",
          filter: "saturate(1.35) brightness(1.4)",
        }}
      />

      {/* Wordmark — vertically and horizontally centered. */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-white"
        style={{
          fontSize: FQW(28),
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        CleanSight
      </span>
    </div>
  );
}

// Thin glass bar under the cards: centered "CleanStart Platform" title over a
// single row of static stage pills.
function PlatformBar() {
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden"
      style={{
        borderRadius: FQW(18),
        border: `${FQW(1)} solid #dab6f3`,
        // Opaque (no alpha) so the card flares and the connecting flare painted
        // behind it are fully occluded — only the glow in the gap above the bar
        // shows, nothing bleeds through into the bar interior.
        background:
          "linear-gradient(180deg, #1c1455 0%, #321fa3 100%)",
        padding: `${FQW(16)} ${FQW(24)}`,
        gap: FQW(12),
      }}
    >
      {/* Diagonal pattern, matching the enclosure. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/cleanstart-factory/diagonal-lines.png)",
          backgroundRepeat: "repeat",
          backgroundSize: `${FQW(14 * 1.6233)} ${FQW(14 * 1.6233)}`,
          mixBlendMode: "luminosity",
          opacity: 0.6,
        }}
      />
      <h3
        className="relative font-display text-white"
        style={{
          fontSize: FQW(20),
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        CleanStart Platform
      </h3>
      <div
        className="relative flex flex-row flex-wrap items-center justify-center"
        style={{ gap: FQW(12) }}
      >
        {PLATFORM_PILLS.map((p) => (
          <PlatformPill key={p} label={p} />
        ))}
      </div>
    </div>
  );
}

function FactoryEnclosure() {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: "100%",
        maxWidth: 1200,
        containerType: "inline-size",
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: FQW(28),
          padding: FQW(30),
          background:
            "linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)",
          border: `${FQW(1.5)} solid #dab6f3`,
          boxShadow:
            "-8px 4px 20px rgba(0,0,0,0.23), -33px 16px 37px rgba(0,0,0,0.2), -74px 37px 49px rgba(0,0,0,0.12), -131px 65px 59px rgba(0,0,0,0.03)",
        }}
      >
        {/* Diagonal pattern across the whole enclosure (matches the cards). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "url(/images/cleanstart-factory/diagonal-lines.png)",
            backgroundRepeat: "repeat",
            backgroundSize: `${FQW(14 * 1.6233)} ${FQW(14 * 1.6233)}`,
            mixBlendMode: "luminosity",
          }}
        />

        <div className="relative flex items-stretch" style={{ gap: FQW(40) }}>
          {/* Connecting flare bridging the CleanSight card and the platform bar.
              Painted FIRST so the opaque rail (left) and opaque platform bar
              (right) occlude its sides — only the slice in the gap between them
              shows, with no bleed into either element. */}
          <Image
            src="/images/cleanstart-factory/flare.webp"
            alt=""
            aria-hidden
            width={267}
            height={358}
            sizes="160px"
            className="pointer-events-none absolute select-none"
            style={{
              left: FQW(230),
              bottom: FQW(47),
              width: FQW(120),
              height: "auto",
              transform: "translate(-50%, 50%) rotate(90deg)",
              mixBlendMode: "screen",
              filter: "saturate(1.35) brightness(1.4)",
            }}
          />

          <CleanSightRail />

          {/* Right column: 4 cards on top, platform bar below. The cards' own
              base flares rise into the gap above the bar (the bar paints over
              the rest), giving the connected-glint look from the design. */}
          <div
            className="flex min-w-0 flex-1 flex-col"
            style={{ gap: FQW(22) }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                columnGap: FQW(24),
              }}
            >
              {CARDS.map((c, i) => (
                <FactoryCard key={c.title} data={c} isFirst={i === 0} />
              ))}
            </div>

            <PlatformBar />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformPipeline() {
  // Background is inherited from the parent `bg-cs-hero` wrapper in page.tsx so
  // the Hero and Factory sections share one continuous backdrop.
  //
  // Desktop (md+) renders the new enclosed layout: a single container holding
  // the full-height CleanSight rail, the 4 cards, and the CleanStart Platform
  // pill bar. Mobile keeps the existing stacked factory as a fallback.
  return (
    <Section padding="none" className="relative overflow-hidden">
      <Container>
        <div className="relative mx-auto" style={{ maxWidth: 1276 }}>
          <div
            aria-hidden
            className="mx-auto mt-[40px]"
            style={{
              width: "100%",
              height: 2,
              borderRadius: 70,
              background:
                "linear-gradient(90deg, rgba(59, 63, 173, 0) 0%, rgba(59, 63, 173, 1) 50%, rgba(59, 63, 173, 0) 100%)",
            }}
          />

          <Reveal header>
            <h2
              className="mt-[32px] text-center font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              Build for trusted software delivery
            </h2>
          </Reveal>

          {/* Desktop + tablet (md+): the enclosed factory container. */}
          <div className="mt-[40px] hidden md:block">
            <FactoryEnclosure />
          </div>

          {/* Mobile: existing stacked factory fallback, shown below md. */}
          <div className="mt-[40px] md:hidden">
            <PlatformPipelineMobile />
          </div>

          {/* Reserves room for the rocket-exhaust flares that extend below the
              cards into the platform bar without pushing the section past the
              1440x900 viewport budget. */}
          <div className="pb-[96px]" />
        </div>
      </Container>
    </Section>
  );
}
