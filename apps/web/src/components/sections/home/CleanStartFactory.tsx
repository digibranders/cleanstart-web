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
    icon: "/images/cleanstart-factory/factory-images.png",
  },
  {
    title: "Clean\nPackages",
    blurb: "Curated. Verified. No\nhidden risk.",
    icon: "/images/cleanstart-factory/factory-packages.png",
  },
  {
    title: "Clean AI\nModels",
    blurb: "Scanned. Signed. Safe\nby design.",
    icon: "/images/cleanstart-factory/factory-models.png",
  },
  {
    title: "Clean\nLibraries",
    blurb: "Complete. Signed.\nContinuously verified.",
    icon: "/images/cleanstart-factory/factory-libraries.png",
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
      {/* Rendered first so it paints behind the card body: the card-bg <Image>
          below covers the upper portion of the flare, leaving only the part
          below the card's bottom edge visible. */}
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

// Mobile factory: 5 horizontal cards stacked vertically (icon-left layout),
// then a portrait bottom block with AI Logic Engine on top and CleanCompile
// Factory below, an arrow between them, and 4 rocket-exhaust flares below.

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

// Mobile bottom block, portrait orientation: AI Logic Engine panel on top,
// downward arrow in the middle, CleanCompile Factory panel on bottom. Uses the
// same gradient + diagonal pattern + lavender stroke as desktop, but the panels
// stack vertically and the pills wrap to two rows. All values sized via
// container queries; MB_W is the reference width.

const MB_W = 328;
const MB_H = 507;
const MCQW = (px: number) => `${(px / MB_W) * 100}cqw`;

function MobileFactoryPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="group inline-flex shrink-0 cursor-pointer items-center justify-center text-white outline-none transition-opacity duration-150 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70"
      style={{
        background:
          "radial-gradient(113.85% 132% at 15.93% 50%, #000000 19.71%, #1E5AFF 100%)",
        boxShadow: `0 0 ${MCQW(4.78)} rgba(30, 90, 255, 0.34)`,
        backdropFilter: `blur(${MCQW(2.71)})`,
        WebkitBackdropFilter: `blur(${MCQW(2.71)})`,
        border: `${MCQW(1.083)} solid #CDE4FF`,
        borderRadius: MCQW(99),
        padding: `${MCQW(4.48)} ${MCQW(13.45)}`,
        height: MCQW(25.7),
        fontFamily: "var(--font-manrope), Manrope, sans-serif",
        fontSize: MCQW(15),
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: "-0.04em",
        opacity: 0.85,
      }}
    >
      {label}
    </button>
  );
}

function MobileFactoryPanel({
  top,
  title,
  desc,
  pills,
  glowVariant,
}: {
  /** y-offset within the bottom block's reference frame. */
  top: number;
  title: string;
  desc: string;
  pills: string[];
  glowVariant: "left" | "right";
}) {
  return (
    <div
      className="absolute flex flex-col overflow-hidden"
      style={{
        left: MCQW(10),
        top: MCQW(top),
        width: MCQW(308),
        padding: MCQW(24),
        gap: MCQW(10),
        background:
          "linear-gradient(90deg, rgba(217, 217, 217, 0.25) 0%, rgba(50, 50, 50, 0) 100%)",
        backdropFilter: `blur(${MCQW(0.805)})`,
        WebkitBackdropFilter: `blur(${MCQW(0.805)})`,
        borderRadius: MCQW(24),
        border: `${MCQW(1)} solid #dab6f3`,
        isolation: "isolate",
      }}
    >
      {/* Orb glow halo — pre-rendered SVG, positioned to bleed out one side. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: MCQW(120),
          top: MCQW(20),
          width: MCQW(220),
          height: MCQW(170),
          zIndex: 0,
        }}
      >
        <div className="absolute" style={{ inset: "-46.12% -40.3%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/cleanstart-factory/factory-glow-${glowVariant}.svg`}
            alt=""
            aria-hidden
            className="block size-full select-none"
            style={{ maxWidth: "none" }}
          />
        </div>
      </div>

      <div className="relative flex flex-col" style={{ gap: MCQW(18), zIndex: 1 }}>
        <div className="flex flex-col" style={{ gap: MCQW(8) }}>
          <h3
            className="font-display text-white"
            style={{
              fontSize: MCQW(20),
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            {title}
          </h3>
          <p
            className="text-white"
            style={{
              fontFamily: "var(--font-sora), Sora, sans-serif",
              fontSize: MCQW(13),
              fontWeight: 400,
              lineHeight: 1.25,
              letterSpacing: "-0.04em",
              opacity: 0.8,
            }}
          >
            {desc}
          </p>
        </div>
        <div
          className="flex flex-row flex-wrap items-center"
          style={{ gap: MCQW(13) }}
        >
          {pills.map((p) => (
            <MobileFactoryPill key={p} label={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FactoryMobileBottomBlock() {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: "100%",
        // Grows in lockstep with the cards wrapper (preserving the original
        // cards-to-bottom-block ratio) so the block's slight visual inset from
        // the cards-column edges is unchanged. MB_W stays the reference width
        // that all MCQW() interior positions are computed against; those
        // percentages auto-scale to whatever width the container lands at.
        maxWidth: 437,
        aspectRatio: `${MB_W} / ${MB_H}`,
        containerType: "inline-size",
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: MCQW(24),
          background:
            "linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)",
          border: `${MCQW(2)} solid #dab6f3`,
          boxShadow:
            "-8px 4px 20px rgba(0,0,0,0.23), -33px 16px 37px rgba(0,0,0,0.2), -74px 37px 49px rgba(0,0,0,0.12), -131px 65px 59px rgba(0,0,0,0.03)",
        }}
      >
        {/* Diagonal pattern. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: MCQW(2),
            top: MCQW(2),
            width: MCQW(324),
            height: `${(503 / MB_H) * 100}%`,
            borderRadius: MCQW(20),
            backgroundImage:
              "url(/images/cleanstart-factory/diagonal-lines.png)",
            backgroundRepeat: "repeat",
            backgroundSize: `${MCQW(14 * 1.6233)} ${MCQW(14 * 1.6233)}`,
            mixBlendMode: "luminosity",
          }}
        />

        {/* Mobile arrow — the desktop factory-arrow.svg rotated 90deg. The
            tail is pulled up to overlap the engine card's bottom edge so its
            fade-out gradient blends into the card instead of butting against
            it. `zIndex: 2` lifts the arrow above both panels so that tail
            gradient paints over the engine card — without it the panel would
            clip the gradient and reintroduce a hard seam. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: MCQW(118),
            top: MCQW(224),
            width: MCQW(92),
            height: MCQW(42.14),
            transform: "rotate(90deg)",
            transformOrigin: "center",
            zIndex: 2,
          }}
        >
          <div
            className="absolute"
            style={{
              inset: "-29.77% -5.54% -175.79% -123.38%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-factory/factory-arrow.svg"
              alt=""
              aria-hidden
              className="block size-full select-none"
              style={{ maxWidth: "none" }}
            />
          </div>
        </div>

        {/* Mobile arrow accent — small dark blurred crescent at the arrow's
            tail that adds a depth highlight at the back of the rotated shaft.
            Same `zIndex: 2` as the main arrow so the accent's tail blur sits
            over the engine card edge instead of being clipped. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: MCQW(156),
            top: MCQW(178),
            width: MCQW(20),
            height: MCQW(48.519),
            transform: "rotate(90deg)",
            transformOrigin: "center",
            zIndex: 2,
          }}
        >
          <div
            className="absolute"
            style={{
              inset: "-6.11% -14.81% -6.11% 9.96%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-factory/factory-arrow-mobile-accent.svg"
              alt=""
              aria-hidden
              className="block size-full select-none"
              style={{ maxWidth: "none" }}
            />
          </div>
        </div>

        {/* AI Logic Engine panel — top half. Rendered after the arrow + accent
            so it paints over their upper edges for a smooth blended attachment. */}
        <MobileFactoryPanel
          top={10}
          title="AI Logic Engine"
          desc="Multi-agent orchestration that plans, analyzes, and optimizes every build."
          pills={["Plan", "Analyze", "Orchestrate"]}
          glowVariant="left"
        />


        {/* CleanCompile Factory panel — pushed down so the block has visually
            equal top/bottom card insets. */}
        <MobileFactoryPanel
          top={304}
          title="CleanCompile Factory"
          desc="Hermetic, deterministic builds. Only what you specify."
          pills={["Spec", "Build", "Attest", "Handoff"]}
          glowVariant="right"
        />
      </div>

      {/* Rocket-exhaust flares emerging from the bottom edge. Rendered as a
          sibling of the inset content so they are not clipped. */}
      {[110, 160, 210, 260].map((cx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={cx}
          src="/images/cleanstart-factory/flare.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 select-none"
          style={{
            left: MCQW(cx),
            top: "100%",
            width: MCQW(120),
            height: "auto",
            marginTop: MCQW(-65),
            mixBlendMode: "screen",
            filter: "saturate(1.3) brightness(1.2)",
            zIndex: -1,
          }}
        />
      ))}
    </div>
  );
}

// Mobile root: left rail (vertical line + horizontal flares entering each card
// from the left) + cards column + connector flares + bottom block.
function CleanStartFactoryMobile() {
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

      {/* Gap spacer between the cards column and the bottom block. */}
      <div aria-hidden style={{ height: 40 }} />

      <FactoryMobileBottomBlock />
    </div>
  );
}

// Desktop bottom block. Uses pre-rendered SVGs for the visually complex layers
// (outer card, orb glows, arrow, accent path, flares) and pure CSS for the
// structural pieces (panels, text, pill buttons). All dimensions in cqw via
// CQW() so the block scales with its container width.

const BB_W = 1276;
// Tightened below the panel height so the outer-frame top/bottom margins are
// symmetric. The panels keep their original size; only the dark frame thins.
const BB_H = 240.72;
/** Convert a reference px (relative to the BB_W-wide bottom block) to cqw. */
const CQW = (px: number) => `${(px / BB_W) * 100}cqw`;

function FactoryPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="group inline-flex shrink-0 cursor-pointer items-center justify-center text-white outline-none transition-[opacity,box-shadow] duration-150 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70"
      style={{
        background:
          "radial-gradient(113.85% 132% at 15.93% 50%, #000000 19.71%, #1E5AFF 100%)",
        border: `${CQW(1.293)} solid #CDE4FF`,
        boxShadow: `0 0 ${CQW(5.713)} rgba(30, 90, 255, 0.34)`,
        backdropFilter: `blur(${CQW(3.23373)})`,
        WebkitBackdropFilter: `blur(${CQW(3.23373)})`,
        // Radius exceeds the height, so the pill is always a perfect capsule.
        borderRadius: CQW(118.997),
        padding: `${CQW(5.35835)} ${CQW(16.0751)}`,
        height: CQW(30.72),
        fontFamily: "var(--font-manrope), Manrope, sans-serif",
        fontSize: CQW(18),
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: "-0.04em",
        opacity: 0.85,
      }}
    >
      {label}
    </button>
  );
}

function FactoryPanel({
  side,
  title,
  desc,
  pills,
  children,
}: {
  side: "left" | "right";
  title: string;
  desc: string;
  pills: string[];
  /** Extra layers (orb glow + optional flare) painted inside the panel */
  children?: React.ReactNode;
}) {
  return (
    <div
      className="absolute flex flex-col items-center justify-center overflow-hidden"
      style={{
        // The left panel sits at the wrapper origin; the caller positions the
        // wrapper itself. The two panels and the arrow gap between them are
        // laid out so all four outer margins are equal.
        left: side === "left" ? 0 : CQW(736),
        top: side === "left" ? 0 : CQW(28),
        width: CQW(512),
        height: CQW(184.72),
        padding: CQW(24),
        gap: CQW(10),
        background:
          "linear-gradient(90deg, rgba(217, 217, 217, 0.25) 0%, rgba(50, 50, 50, 0) 100%)",
        backdropFilter: `blur(${CQW(0.804984)})`,
        WebkitBackdropFilter: `blur(${CQW(0.804984)})`,
        borderRadius: CQW(24),
        border: `${CQW(1)} solid #dab6f3`,
        isolation: "isolate",
      }}
    >
      {/* Glow + optional flare slot, rendered first so text paints on top. */}
      {children}

      <div
        className="relative flex flex-row items-center"
        style={{ width: CQW(464), height: CQW(136.72), zIndex: 1 }}
      >
        <div
          className="flex flex-col items-start"
          style={{ width: CQW(343), gap: CQW(18) }}
        >
          <div
            className="flex w-full flex-col items-start"
            style={{ gap: CQW(16) }}
          >
            <h3
              className="font-display text-white"
              style={{
                width: CQW(343),
                fontSize: CQW(36),
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              {title}
            </h3>
            <p
              className="text-white"
              style={{
                width: side === "left" ? CQW(343) : CQW(300),
                fontFamily: "var(--font-sora), Sora, sans-serif",
                fontSize: CQW(16),
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
                opacity: 0.8,
              }}
            >
              {desc}
            </p>
          </div>
          <div
            className="flex flex-row items-center"
            style={{ height: CQW(30.72), gap: CQW(16) }}
          >
            {pills.map((p) => (
              <FactoryPill key={p} label={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FactoryBottomBlock() {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: "100%",
        maxWidth: BB_W,
        aspectRatio: `${BB_W} / ${BB_H}`,
        containerType: "inline-size",
      }}
    >
      {/* Rocket-exhaust flares rendered first so they paint behind the outer
          card body, sized and pulled up so the bright shaft lands at the card's
          bottom edge with the tapered halo visible below. */}
      {[510, 590, 670, 750].map((cx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={cx}
          src="/images/cleanstart-factory/flare.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 select-none"
          style={{
            left: CQW(cx),
            top: "100%",
            width: CQW(320),
            height: "auto",
            // Empirically tuned: the bright core of flare.webp sits ~50% from
            // the top, so this marginTop lands the bright crown at the card's
            // bottom edge with the tapered exhaust trailing below.
            marginTop: CQW(-180),
            mixBlendMode: "screen",
            filter: "saturate(1.3) brightness(1.2)",
          }}
        />
      ))}

      {/* Outer card body: factory-card-mask.svg bakes in the gradient fill,
          lavender stroke, drop shadow, and radius.
          The SVG uses `width="100%" height="100%"` with no fixed intrinsic
          size, so the browser would default to a 2:1 natural aspect; an
          explicit pixel height is required to force the correct viewBox aspect.
          The SVG's card-body region is fixed at the reference 285px height, so
          when BB_H is shrunk below 285 the rendered mask must scale down in
          lockstep on the y-axis (the SVG is preserveAspectRatio="none"),
          otherwise the chrome paints past the block's bottom edge. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-factory/factory-card-mask.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: CQW(-190),
          top: CQW(-21 * (BB_H / 285)),
          width: CQW(1478),
          height: CQW(430 * (BB_H / 285)),
          maxWidth: "none",
        }}
      />

      {/* Content layer clipped to the inner rounded rect so the diagonal
          pattern and the panel glows that overflow each panel stay inside the
          card silhouette. The outer card SVG above paints the visible chrome. */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: CQW(24),
          overflow: "hidden",
        }}
      >
        {/* Diagonal lines pattern. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: CQW(3),
            top: CQW(2),
            width: CQW(1271),
            // Leaves a 2px gap at the top and bottom of the block, expressed
            // relative to BB_H so it scales automatically when BB_H changes.
            height: `${((BB_H - 4) / BB_H) * 100}%`,
            borderRadius: CQW(20),
            backgroundImage:
              "url(/images/cleanstart-factory/diagonal-lines.png)",
            backgroundRepeat: "repeat",
            backgroundSize: `${CQW(14 * 1.6233)} ${CQW(14 * 1.6233)}`,
            mixBlendMode: "luminosity",
          }}
        />

        <FactoryPanel
          side="right"
          title="CleanCompile Factory"
          desc="Hermetic, deterministic builds. Only what you specify."
          pills={["Spec", "Build", "Attest", "Handoff"]}
        >
          {/* Pre-rendered orb glow SVG, rotated 180deg. The inner inset offsets
              the blur-expanded SVG canvas back to its visual bounds. */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: CQW(447),
              top: CQW(40),
              width: CQW(357.324),
              height: CQW(312.198),
              transform: "rotate(180deg)",
              zIndex: 0,
            }}
          >
            <div
              className="absolute"
              style={{
                inset: "-46.12% -40.3%",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-factory/factory-glow-right.svg"
                alt=""
                aria-hidden
                className="block size-full select-none"
                style={{ maxWidth: "none" }}
              />
            </div>
          </div>
        </FactoryPanel>

        {/* Left wrapper hosting, in paint order: the arrow, the left panel
            (which covers the arrow's left half), and the small accent. The
            arrow + accent live inside this wrapper with wrapper-local offsets
            so they move as one rigid unit and the accent-on-arrow-tail
            alignment is preserved. The arrow tail merges into the left panel
            and the tip stops just short of the right panel. */}
        <div
          className="absolute"
          style={{
            left: CQW(28),
            top: CQW(28),
            width: CQW(666),
            height: CQW(184.717),
          }}
        >
          {/* Arrow (factory-arrow.svg) bridging the gap between the two panels.
              Width and height are scaled together to preserve the arrow path's
              aspect, which keeps the inner inset calibration below valid. It is
              vertically centered in the wrapper and pulled left so the rounded
              tail merges into the left panel while the tip stops short of the
              right panel. */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: CQW(512 - 8),
              top: CQW(47.47),
              width: CQW(196),
              height: CQW(89.78),
            }}
          >
            <div
              className="absolute"
              style={{
                inset: "-29.77% -5.54% -175.79% -123.38%",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-factory/factory-arrow.svg"
                alt=""
                aria-hidden
                className="block size-full select-none"
                style={{ maxWidth: "none" }}
              />
            </div>
          </div>

          <FactoryPanel
            side="left"
            title="AI Logic Engine"
            desc="Multi-agent orchestration that plans, analyzes, and optimizes every build."
            pills={["Plan", "Analyze", "Orchestrate"]}
          >
            {/* Left-panel orb glow SVG (not rotated). Same inset technique as
                the right panel. */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                left: CQW(395),
                top: CQW(10),
                width: CQW(357.324),
                height: CQW(312.198),
                zIndex: 0,
              }}
            >
              <div
                className="absolute"
                style={{
                  inset: "-46.12% -40.3%",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cleanstart-factory/factory-glow-left.svg"
                  alt=""
                  aria-hidden
                  className="block size-full select-none"
                  style={{ maxWidth: "none" }}
                />
              </div>
            </div>

          </FactoryPanel>

          {/* Small dark-blue blurred accent path. The inner inset positions the
              blur-expanded SVG canvas within its container. */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: CQW(497),
              top: CQW(55),
              width: CQW(27),
              height: CQW(65.5),
            }}
          >
            <div
              className="absolute"
              style={{
                inset: "-6.11% -14.81% -6.11% 9.96%",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cleanstart-factory/factory-accent.svg"
                alt=""
                aria-hidden
                className="block size-full select-none"
                style={{ maxWidth: "none" }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export function CleanStartFactory() {
  // Background is inherited from the parent `bg-cs-hero` wrapper in page.tsx so
  // the Hero and Factory sections share one continuous backdrop.
  //
  // The cards row, bottom block, fonts, and inter-section spacing are all
  // compressed so the whole factory fits inside a single 1440x900 laptop
  // viewport without scrolling. Card/block caps shrink only the rendered scale
  // (the CQW reference widths are unchanged), so interior layout is unaffected.
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
              The CleanStart Factory
            </h2>
          </Reveal>

          {/* Tablet + desktop: 4 cards locked in a single horizontal row,
              md through xl. The `minmax(0, 1fr)` columns may shrink below their
              content's intrinsic min-width rather than forcing the row to
              overflow, and the gap is fluid. The row is intentionally narrower
              than the bottom block below it (a "5 -> 4 -> 2" funnel). All
              interior dimensions use cqw so the card contents shrink together
              with the column width; the row never wraps or overflows. */}
          <div
            className="relative mx-auto mt-[32px] hidden md:grid"
            style={{
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              columnGap: "clamp(8px, 2.2vw, 28px)",
              maxWidth: 884,
            }}
          >
            {CARDS.map((c, i) => (
              <FactoryCard key={c.title} data={c} isFirst={i === 0} />
            ))}
          </div>

          {/* Mobile: horizontal cards stacked vertically, shown below md. */}
          <div className="mt-[64px] md:hidden">
            <CleanStartFactoryMobile />
          </div>

          {/* Bottom factory block. Sized in cqw via its own container query so
              every interior layer scales as one with the block width. The width
              cap matches the cards row above; the BB_W reference is unchanged,
              so interior positions stay fixed and only the rendered scale
              shrinks. */}
          <div
            className="mx-auto mt-[32px] hidden md:block"
            style={{ width: "100%", maxWidth: 1112 }}
          >
            <FactoryBottomBlock />
          </div>

          {/* Reserves room for the rocket-exhaust flares that extend below the
              block, sized to show the bright cores plus most of the halo
              without pushing the section past the 1440x900 viewport budget. */}
          <div className="pb-[96px]" />

        </div>
      </Container>
    </Section>
  );
}
