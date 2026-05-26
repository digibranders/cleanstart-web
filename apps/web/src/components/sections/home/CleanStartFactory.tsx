import Image from "next/image";
import Link from "next/link";
import { Section, Container } from "@/components/layout";

type CardData = {
  title: string;
  blurb: string;
};

const CARDS: CardData[] = [
  { title: "Clean\nImages", blurb: "Minimal. Immutable.\nZero CVE." },
  { title: "Clean\nPackages", blurb: "Curated. Verified. No\nhidden risk." },
  { title: "Clean AI\nModels", blurb: "Scanned. Signed. Safe\nby design." },
  // "Clean Sight" removed (2026-05) — top row trimmed to 4 cards across
  // every viewport. Grid + row max-width updated below to match.
  { title: "Clean\nLibraries", blurb: "Complete. Signed.\nContinuously verified." },
];

// Container-query-based card. The `factory-card` container's inline size (its
// width) drives every interior dimension via `cqw` units — orb, title font,
// blurb font, arrow circle, paddings — so the entire card scales as one unit.
// Figma reference geometry (all values relative to 232.8 × 374 card body):
//   orb visible:  width 108 (46.39 %), top 39.8 (17.10 %), centered
//   title:        font 32 (13.75 %), top ≈ 184 (79.04 %)
//   blurb:        font 14 (6.01 %),  gap 12 below title
//   arrow circle: 28 × 28 (12.03 %), top 322 (138.32 %), 1.75 px stroke (0.75 %)
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
        // The parent grid (`grid-cols-5` + fluid gap, capped at 1276 px)
        // already drives the card's outer width. We just fill the column
        // and lock the aspect ratio; every interior dimension below uses
        // `cqw` so it scales 1:1 with whatever width the grid hands us
        // (Figma max 232.8 px @ xl down to ~125 px @ smallest tablet).
        width: "100%",
        aspectRatio: "232.8 / 374",
        containerType: "inline-size",
      }}
    >
      {/* Light beam — rendered FIRST so it paints BEHIND the card body. The
          card-bg <Image> below covers the upper portion of the flare that
          overlaps the card, so only the part below the card's bottom edge is
          visible. Bright core sits right at the card's bottom edge, halo
          fading downward into the gap. */}
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

      {/* Card background — the cropped image is the card body, 1:1 alignment.
          `borderRadius: 10.3cqw` (= 24 px at desktop card width, matching
          Figma `Rectangle 1000001822` borderRadius:24) clips any partial-alpha
          pixels at the bottom-left flare-halo leak so all four corners read as
          a true, constant rounded-rect on the shared background. Painted
          AFTER the flare so it sits ON TOP and hides the flare's upper halo. */}
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


      {/* Orb (chrome iridescent ring). Cropped 113 × 117, displayed at 46.39 %
          of card width to match Figma's 108 px visible-orb width. */}
      <Image
        src="/images/cleanstart-factory/factory-icons.webp"
        alt=""
        aria-hidden
        width={113}
        height={117}
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
            // 13.75 cqw matches Figma at the 232.8 px card width (= 32 px).
            // The clamp adds a 14 px floor so the title stays readable when
            // the card shrinks below ~102 px (smallest realistic tablet column).
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
            // 6.01 cqw = 14 px at 232.8 card. 10.5 floor keeps the blurb
            // legible on the narrowest tablet column.
            fontSize: "clamp(10.5px, 6.01cqw, 14px)",
            lineHeight: 1.2,
            letterSpacing: "-0.04em",
          }}
        >
          {data.blurb}
        </p>
      </div>

      {/* Arrow circle — interactive Link wrapping the exact Figma SVG (node
          810:1419). href is a placeholder for now; per-card destinations will
          be wired later. Sized in cqw so the hit target scales with the card. */}
      <Link
        href="#"
        aria-label={`Learn more about ${data.title.replace("\n", " ")}`}
        className="absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{
          top: "138.32cqw",
          // 12.03 cqw = 28 px at 232.8 card. The 22 px floor keeps the
          // tap target reasonable on the narrowest tablet column.
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

// =============================================================================
// Mobile factory — Figma `Factory Mobile` (node 810:1922), 444 × 1199 frame.
// 5 horizontal cards stacked vertically (each 295 × 88, icon-left layout),
// then a portrait bottom block (328 × 507) with AI Logic Engine on top and
// CleanCompile Factory on bottom, arrow points DOWN between them, and 4
// rocket-exhaust flares below. Implementation uses the cropped mobile bg
// (factory-card-bg-mobile.webp) + shared orb + shared flare assets.
// =============================================================================

// Mobile card width 295, height 88 — aspect 3.35. Sized in container queries
// where cqw = 1 % of card width.
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
      {/* Card body (cropped 295 × 87 ≈ same aspect). 24 px Figma radius
          → 24/295 × 100 = 8.14 cqw. */}
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

      {/* Orb on LEFT — Figma `Point` is 97 × 72 at card-local x=−7, y=8
          (orb's container starts 7 px LEFT of the card and is centered
          vertically inside the 88 px card). The visible chrome ring fills
          most of that bbox. */}
      <Image
        src="/images/cleanstart-factory/factory-icons.webp"
        alt=""
        aria-hidden
        width={113}
        height={117}
        sizes="(max-width: 480px) 60px, 80px"
        priority={isFirst}
        className="pointer-events-none absolute select-none"
        style={{
          // ≈97 × 72 px / 295 = 32.88 cqw wide, height auto.
          // Centered vertically; pushed slightly LEFT of card edge to match Figma.
          width: "22cqw",
          height: "auto",
          left: "3cqw",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      {/* Title + blurb stack — Figma puts text at card-local x=85, y=17.
          Each card has the title (Manrope 500/16, ≈20 px tall) + blurb
          (Sora 400/12, ≈30 px tall over 2 lines). */}
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

      {/* Chevron link on RIGHT — smaller pass: 7 cqw vs 9.49 cqw for a
          subtler button per the latest mobile reference. */}
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

// =============================================================================
// Mobile bottom block — Figma `Group 2085665150` at (100, 572), 328 × 507.
// Portrait orientation: AI Logic Engine panel on TOP, downward arrow in the
// middle, CleanCompile Factory panel on BOTTOM. Outer card uses the same
// gradient + diagonal pattern + lavender stroke as desktop, but the panels
// stack vertically and the pills wrap to 2 rows.
// All values sized via container queries; MB_W = 328 is the reference width.
// =============================================================================

const MB_W = 328;
const MB_H = 507;
const MCQW = (px: number) => `${(px / MB_W) * 100}cqw`;

function MobileFactoryPill({ label }: { label: string }) {
  // Smaller pill scaled to mobile: Figma button ≈ 25.7 px tall in 328-wide
  // context. Same gradients + border + glow as desktop.
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
  /** y-offset within the bottom block (Figma reference frame). */
  top: number;
  title: string;
  desc: string;
  pills: string[];
  glowVariant: "left" | "right";
}) {
  // Panel is 308 wide at x=10, 191/192 tall. Mobile uses the same glow SVGs
  // as desktop, positioned to spill out the panel's right side (Figma export
  // has the glow at panel-local (69, 41-64) with a 683 × 281 canvas).
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
          // Glow inside 308 panel: Figma puts it at panel (69, 41) with the
          // svg canvas (683 × 281) extending way past the right panel edge.
          // For mobile we place it center-ish behind the title row.
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
        {/* Pills row — flex-wrap so they break to multiple lines. */}
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
        // Bumped from MB_W (328) → 437 to grow in lockstep with the cards
        // wrapper (360 → 480) while preserving the original cards : bottom-
        // block ratio (328/360 ≈ 0.911 → 437/480 = 0.910). That keeps the
        // bottom block's slight visual inset from the cards-column edges
        // identical to the previous design. `MB_W` stays at 328 because it
        // remains the Figma REFERENCE width that all `MCQW(...)` interior
        // positions are computed against — those percentages auto-scale to
        // whatever rendered width the container lands at.
        maxWidth: 437,
        aspectRatio: `${MB_W} / ${MB_H}`,
        containerType: "inline-size",
      }}
    >
      {/* Outer card body — same gradient + lavender stroke + drop shadow. */}
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
        {/* Diagonal pattern — Figma 324 × 503 at (2, 2), inner radius 20. */}
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

        {/* Mobile arrow — SAME desktop SVG (factory-arrow.svg) rotated 90°.
            The SVG path nearly fills the 92 × 42 wrapper (path bbox in
            wrapper coords (0, 0) → (90.2, 41.81)), so after rotate(90deg)
            about the wrapper center (46, 21.07) the rotated path bbox in
            wrapper-local coords is x: 25.26 → 67.07, y: −24.93 → 65.27.
            Visible top of the arrow = wrapper_top − 24.93.
              AI Logic Engine card bottom is at block-local y ≈ 203. We
              pull the tail UP into the card by ~6 px so the arrow's tail
              gradient (linear-gradient on the path that fades the tail
              into translucent blue) overlaps the engine card's bottom
              edge instead of butting up against it. That overlap is what
              produces the soft blend.
                wrapper_top = (203 − 6) + 24.93 ≈ 222.
              Arrow tip lands at y ≈ 287, just touching the new CleanCompile
              top (y=304) area without overshooting.
              `zIndex: 2` lifts the arrow ABOVE both panels (which sit in
              document order at z=auto inside the block) so the tail's
              gradient paints OVER the engine card — without this the panel
              would clip the gradient and re-introduce the hard seam. */}
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

        {/* Mobile arrow ACCENT — Figma `Vector 1194233952` (node 810:1845).
            Small dark blurred crescent (linear-gradient #144EB8→#1F2492,
            filter blur 1.48 px) that sits at the arrow's TAIL adding a
            depth highlight at the back of the rotated shaft. NOT a duplicate
            arrow.
              Wrapper 20 × 48.519, rotate(90deg). Visible path inside the
              wrapper (after the SVG inset adjustment) sits at wrapper-local
              (3.29, −2.96) → (19.99, 48.52). After rotate(90deg) around
              wrapper center (10, 24.26) the visible bbox center lands at
              wrapper-local (11.48, 25.90).
              Targeting the desktop accent ↔ arrow geometry:
                · desktop accent center is 44.2 % of arrow length back from
                  arrow center toward the tail, and 9.06 % of arrow width
                  perpendicular (above arrow center in unrotated frame).
                · with arrow wrapper top=222, main arrow visible center is
                  (164, 242); length 90, width 42. Rotated 90° CW → "above
                  arrow" becomes "right of arrow", "back toward tail"
                  becomes "up".
                · accent visible center target ≈ (168, 202).
              Hence wrapper position:
                left = 168 − 11.48 ≈ 156
                top  = 202 − 25.90 ≈ 176
            Same `zIndex: 2` as the main arrow so the accent's tail blur
            sits OVER the engine card edge instead of being clipped. */}
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

        {/* AI Logic Engine panel — top half, Figma y=10. Rendered AFTER
            the arrow + accent so it paints over their upper edges → smooth
            blended attachment. */}
        <MobileFactoryPanel
          top={10}
          title="AI Logic Engine"
          desc="Multi-agent orchestration that plans, analyzes, and optimizes every build."
          pills={["Plan", "Analyze", "Orchestrate"]}
          glowVariant="left"
        />


        {/* CleanCompile Factory panel — pushed down to top=304 so that the
            block has visually equal top/bottom card insets (AI engine top
            inset = 10; with panel height ≈ 192 the bottom inset becomes
            507 − 304 − 192 = 11). */}
        <MobileFactoryPanel
          top={304}
          title="CleanCompile Factory"
          desc="Hermetic, deterministic builds. Only what you specify."
          pills={["Spec", "Build", "Attest", "Handoff"]}
          glowVariant="right"
        />
      </div>

      {/* 4 rocket-exhaust flares emerging from the bottom edge of the mobile
          bottom block. Same flare.webp + same approach as desktop bottom
          flares (rendered as a sibling of the inset content so they're not
          clipped). */}
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

// Mobile root — left rail (vertical line + 5 horizontal flares entering each
// card from the left) + cards column + connector flares + bottom block.
function CleanStartFactoryMobile() {
  const RAIL_WIDTH = 56; // px of left space reserved for the rail
  const CARDS_GAP = 16; // px between cards
  // Card aspect 295/88; at 360 max container with 56 paddingLeft, card width
  // is 304, so card height ≈ 304 × 88/295 ≈ 91. First card center y = ~45,
  // last card center y = 4 × (91 + 16) + 45 = 473. So the vertical line
  // should span from y ≈ 45 to y ≈ 473 inside the cards column — i.e. start
  // at first flare center and END at last flare center.
  const FLARE_WIDTH = 130;
  // Pushed right by 24 px so the visible bright cores sit closer to the cards
  // (line stays at its original "through-flare-center" position; flares now
  // extend from the line area further into the cards).
  const FLARE_LEFT_OFFSET = RAIL_WIDTH + 60 - 24;
  // Visual center x of the rotated flare = card_left + (-FLARE_LEFT_OFFSET + FLARE_WIDTH/2)
  // = card_left + (-116 + 65) = card_left - 51. card_left in container coords = RAIL_WIDTH (paddingLeft),
  // so flare center in container coords = RAIL_WIDTH - 51 = 5.
  const LINE_X = RAIL_WIDTH - FLARE_LEFT_OFFSET + FLARE_WIDTH / 2;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: "100%",
        // Mobile factory wrapper cap. Previously locked to the Figma mobile-
        // frame width (360 px), which left visible gutters on small-tablet
        // portrait widths (414 → 767 px, below `md`). Bumped to 480 — about
        // 33 % larger, still inside the Figma `Factory Mobile` 444 px frame
        // range, so the icon-left card layout doesn't balloon. Phones under
        // 480 px still render at 100 % width (the cap doesn't engage).
        // All interior dimensions use container queries (cqw) — orbs, text,
        // flares, pills scale 1:1 with this width.
        maxWidth: 480,
      }}
    >
      {/* Cards column — each row = left-rail-flare + card. Vertical line
          lives INSIDE this section so it confines to the cards' height. */}
      <div
        className="relative flex flex-col"
        style={{ gap: CARDS_GAP, paddingLeft: RAIL_WIDTH }}
      >
        {/* Vertical light line — spans from first flare center to LAST flare
            center (not below). Passes through the visual center of each
            horizontal flare. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: `${LINE_X}px`,
            // top: 50% of first card; bottom: 50% of last card.
            //   For N cards stacked with gap G in a column of height H,
            //     card_H = (H − (N−1)·G) / N
            //   The line should start at first-card center and end at
            //   last-card center, so offset from container top/bottom =
            //   card_H / 2 = (H/N − (N−1)·G/N) / 2.
            //   Updated for N=4 (was 5): `(100% / 4 − 16px × 3 / 4) / 2`.
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

        {/* 2 center flares — rendered BEFORE the cards in DOM so the cards
            paint ON TOP of any portion that overlaps the card area (no leak).
            Positioned absolutely so their vertical CENTER lands at the
            midpoint of the 40 px gap below the cards column:
              top = 100% (cards-col bottom) − 91 (half flare height) + 20 (half gap)
                  = 100% − 71 px
            Bottom block (next sibling) paints AFTER, hiding the part of the
            flare that extends into its area. */}
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
            {/* Horizontal flare entering from the LEFT, pointing INTO the
                card. flare.webp rotated 90° clockwise puts the bright tip
                on the RIGHT (entering the card), tail fading LEFT toward
                the vertical line. */}
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

      {/* 40 px gap spacer between cards-column and bottom block. The 2
          center flares live INSIDE cards-column (above this spacer), painted
          BEHIND the cards, with the flare visual center landing at the
          midpoint of this 40 px gap. */}
      <div aria-hidden style={{ height: 40 }} />

      <FactoryMobileBottomBlock />
    </div>
  );
}

// =============================================================================
// Bottom block — Figma `factory-bottom` (node 810:1503). 1276 × 285 at
// frame (30, 860). Implementation strategy: use Figma-exported SVGs for the
// visually complex layers (outer card with gradient + 2 px lavender stroke +
// 4-stop drop shadow; orb glows with noise-blur; arrow with gradient fill +
// radial stroke + drop shadow; small accent path with blur; flare composite),
// and pure CSS for the structural pieces (panels, text, pill buttons). All
// dimensions in cqw via CQW() so the block scales with its container width.
// =============================================================================

const BB_W = 1276;
// Reduced from 285 → 240.72 to tighten the outer-frame vertical breathing
// around the inner panels (top + bottom margins shrink from 48/52.28 to
// 28/28 — fully symmetric). Panels stay at their original 512 × 184.72
// Figma size; only the dark frame around them gets thinner. Companion
// edits below: `top: CQW(48) → CQW(28)` on the right panel and on the
// left wrapper Frame (which hosts the left panel + arrow + accent, all
// moving up together as one rigid block).
const BB_H = 240.72;
/** Convert a Figma px (relative to the 1276-wide bottom block) to cqw. */
const CQW = (px: number) => `${(px / BB_W) * 100}cqw`;

function FactoryPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="group inline-flex shrink-0 cursor-pointer items-center justify-center text-white outline-none transition-[opacity,box-shadow] duration-150 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70"
      style={{
        // Figma fill (radial gradient: dark left → blue right)
        background:
          "radial-gradient(113.85% 132% at 15.93% 50%, #000000 19.71%, #1E5AFF 100%)",
        // Spec: 1.293 px solid #CDE4FF border
        border: `${CQW(1.293)} solid #CDE4FF`,
        // Spec: drop-shadow 0 0 5.713px rgba(30, 90, 255, 0.34)
        boxShadow: `0 0 ${CQW(5.713)} rgba(30, 90, 255, 0.34)`,
        backdropFilter: `blur(${CQW(3.23373)})`,
        WebkitBackdropFilter: `blur(${CQW(3.23373)})`,
        // Fully-rounded pill (118.997 px > height so always a perfect capsule)
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
        // Right panel at bottom-block (736, 28). Left panel at wrapper-local
        // (0, 0) — the caller positions the wrapper at (28, 28).
        // All four outer margins now equal 28 figma px (= ~24 rendered at
        // the 1112 block scale): top 28, bottom 28, left 28, right 28.
        // BB_W − 28 (left) − 512 (left panel) − 196 (gap, occupied by the
        // arrow) − 512 (right panel) − 28 (right) = 1276 ✓
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
      {/* Glow + optional flare slot (rendered first so text paints on top) */}
      {children}

      {/* Text + pills row */}
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
      {/* Rocket-exhaust flares — rendered FIRST so they paint BEHIND the
          outer card body.
          · Thicker (180 → 320 px wide ≈ +78 %): the bright streak reads as
            a substantial shaft, not a thin line.
          · Pulled up (marginTop −80 → −150): the flare sits higher behind
            the card, so more of the bright thick body lands AT the card's
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
            // Empirically tuned: the bright core of flare.webp is closer to
            // 50 % from the top than the 33 % my earlier math assumed. At
            // marginTop −180 the bright crown lands right at the card's
            // bottom edge with the tapered exhaust trailing below.
            marginTop: CQW(-180),
            mixBlendMode: "screen",
            filter: "saturate(1.3) brightness(1.2)",
          }}
        />
      ))}

      {/* Outer card body — Figma export factory-card-mask.svg contains the
          gradient fill (#151021 → #131E8F → #551ECE) + 2 px radial lavender
          stroke + 4-stop drop shadow + 24 px radius all baked in. Natural
          SVG canvas is 1478 × 430 with the actual card body at (190, 21),
          1276 × 285.
          NOTE: SVG file uses `width="100%" height="100%"` (no fixed px
          intrinsic), so the browser defaults `naturalSize` to 300×150 = 2:1
          aspect. Set EXPLICIT pixel height to force the correct viewBox
          aspect — without it `height: auto` would default to ~740 px.
          --------------------------------------------------------------
          Vertical-scale recalibration when BB_H ≠ 285:
            The SVG's card-body region inside the viewBox is fixed at
            1276 × 285 figma units. When we shrink BB_H below 285 to
            tighten the outer-frame spacing, we MUST shrink the rendered
            mask in lockstep — otherwise the SVG paints the card chrome
            past the block's bottom edge (the visible "extra padding"
            the user reported). The SVG already has
            `preserveAspectRatio="none"`, so we scale only the y-axis:
              scale_y = BB_H / 285                       (= 0.845 today)
              rendered height = 430 × scale_y            (≈ 363.35)
              rendered top    = -21 × scale_y            (≈ -17.74)
            The horizontal width + left stay untouched (no x-scale).
            Corners get a ~15 % vertical compression which is visually
            imperceptible on a 24-px rounded rect. */}
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

      {/* Content layer — clipped to the inner rounded rect so diagonal pattern
          and the panel glows that overflow each panel stay inside the card
          silhouette. The outer card SVG above paints the visible chrome. */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: CQW(24),
          overflow: "hidden",
        }}
      >
        {/* Diagonal Lines — Figma `Diagonal Lines` (810:1507): 1271 × 281 at
            (3, 2), inner radius 20 px, tile scale 1.6233, blend luminosity. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: CQW(3),
            top: CQW(2),
            width: CQW(1271),
            // Figma intent: leave a 2-px gap at top + bottom of block.
            // Original literal was `281 / 285 ≈ 98.6 %` (calibrated for
            // the old BB_H = 285). Now expressed as `(BB_H − 4) / BB_H`
            // so it scales automatically whenever BB_H changes.
            height: `${((BB_H - 4) / BB_H) * 100}%`,
            borderRadius: CQW(20),
            backgroundImage:
              "url(/images/cleanstart-factory/diagonal-lines.png)",
            backgroundRepeat: "repeat",
            backgroundSize: `${CQW(14 * 1.6233)} ${CQW(14 * 1.6233)}`,
            mixBlendMode: "luminosity",
          }}
        />

        {/* Right panel "CleanCompile Factory" at (714, 48). */}
        <FactoryPanel
          side="right"
          title="CleanCompile Factory"
          desc="Hermetic, deterministic builds. Only what you specify."
          pills={["Spec", "Build", "Attest", "Handoff"]}
        >
          {/* Group 2085665008 — pre-rendered orb glow SVG (3 ellipses +
              feGaussianBlur 72 + feTurbulence noise) inside a 357.324 ×
              312.198 bbox at panel (447, 40), rotated 180°. The SVG canvas
              is 645.324 × 600.198 (blur expansion). Render at natural canvas
              size inside the bbox using the inset-[-46.12%_-40.3%] technique
              from Figma's own export. */}
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

        {/* Left wrapper Frame 2147238459 at (28, 28), 666 × 184.717.
            Figma layer order (bottom → top):
              1. Arrow Vector 1194233950
              2. Left panel Frame 2147238336 (paints over arrow's left half)
              3. Small accent Vector 1194233951
            Left moved 46 → 28 to match the (now symmetric) 28-px outer
            margin on every side. The arrow + accent live INSIDE this
            wrapper with wrapper-local offsets, so they shift left by
            the same 18 px as a single rigid unit; the accent-on-arrow-
            tail alignment is preserved exactly. Right panel shifted
            714 → 736 to widen the inter-panel gap from 156 → 196 figma
            units; the arrow's width was increased proportionally below
            so its rounded tail still merges 8 px into the left panel
            and the tip still pokes 8 px short of the right panel (same
            visual handshake as the original Figma). */}
        <div
          className="absolute"
          style={{
            left: CQW(28),
            top: CQW(28),
            width: CQW(666),
            height: CQW(184.717),
          }}
        >
          {/* Arrow — factory-arrow.svg with gradient fill + radial stroke +
              4-stop drop-shadow baked in.
              · Width grown 154 → 196 to bridge the now-196-figma gap
                between the two panels (panels moved closer to the block's
                outer edges to give all four margins the same 28-px frame).
                Height scaled proportionally (154/70.539 = 196/89.78 = 2.184)
                so the SVG `inset` calibration below stays valid — the
                inset percentages produce an inner div whose WH ratio
                matches the SVG canvas's 352.536/215.539 = 1.636 only when
                the wrapper preserves the arrow path's 2.184 aspect.
              · Vertical centering recomputed: wrapper is 184.717 tall,
                arrow visible body is now 89.78 tall → centered top =
                (184.717 − 89.78) / 2 ≈ 47.47. Arrow's vertical center
                (47.47 + 89.78/2 = 92.36) is unchanged from before, so the
                small accent (factory-accent.svg) which sits at wrapper-
                local (497, 55) still aligns perfectly with the arrow tail.
              · Horizontal overlap: spec puts arrow left edge at wrapper
                x=512 (= panel right edge). Pulling left by 8 → wrapper-
                local 504, so the rounded tail merges 8 px into the left
                panel. Arrow right edge = 504 + 196 = 700, leaving an 8-px
                gap before the right panel (which starts at wrapper-local
                736 − 28 = 708). Mirrors the original 8-overlap / ~8-gap
                handshake. */}
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

          {/* Left panel "AI Logic Engine" at wrapper (0, 0). */}
          <FactoryPanel
            side="left"
            title="AI Logic Engine"
            desc="Multi-agent orchestration that plans, analyzes, and optimizes every build."
            pills={["Plan", "Analyze", "Orchestrate"]}
          >
            {/* Group 2085665009 — left-panel orb glow SVG at panel (395, 10),
                NOT rotated. Same inset technique as right panel. */}
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

          {/* Vector 1194233951 — small dark-blue blurred accent path at
              wrapper (497, 55), 27 × 65.5. Pre-rendered SVG includes the
              feGaussianBlur 2 + curved path. Inset positions the SVG
              canvas (28.31 × 73.5) within the 27 × 65.5 container. */}
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
  // Background is inherited from the parent `bg-cs-hero` wrapper in page.tsx
  // so the Hero and Factory sections share one continuous backdrop. The grid
  // overlay (`bg-cs-grid`) has been removed from the home wrapper per design.
  //
  // ── Viewport-fit pass (1440×900 laptop budget) ──────────────────────
  // The factory used to total ~1029 px (divider gap + H2 + cards 374 +
  // bottom block 285 + spacing), which overflowed a 1440×900 laptop's
  // ~820 px page area by ~210 px — visitors had to scroll to see the
  // bottom block. Compressed to ~787 px by:
  //   · Capping the desktop cards row at 1112 (was 1276) → each card
  //     200 px wide instead of 232.8 → height 321 instead of 374
  //     (cqw interior — orb, title, blurb, arrow — auto-scales down).
  //   · Capping the bottom block at 1112 (was 1276) → height 248
  //     instead of 285. All `CQW(...)` interior positions are computed
  //     against the unchanged `BB_W = 1276` reference, so block
  //     interior layout is unaffected — only the rendered scale shrinks.
  //   · Reducing inter-section spacing: divider 64→40, H2-top 56→32,
  //     cards-top 64→32, block-top 56→32, bottom-pad 80→40.
  //   · H2 font cap 56→48 px (saves ~8 px of stack height; remains
  //     dominant on the page).
  // Net: ~242 px reclaimed. The whole factory now sits inside a single
  // 1440×900 viewport, and is only ~87 px tall-of-fold on 1366×768
  // (vs. ~330 today).
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

          <h2
            className="mt-[32px] text-center font-display text-white"
            style={{
              fontSize: "clamp(28px, 3.4vw, 48px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            The CleanStart Factory
          </h2>

          {/* Tablet + desktop: 4 cards LOCKED in a single horizontal row,
              md → xl. CSS Grid with 4 equal columns (`minmax(0, 1fr)` so a
              column can shrink below its content's intrinsic min-width
              instead of forcing the row to overflow). Gap is fluid: scales
              from the Figma 28 px at ≥1280 down to 8 px on the narrowest
              tablet.
                Wrapper `maxWidth: 884` (= 4 cards × 200 px + 3 gaps × 28).
                Cards stay at 200 px max (preserving the viewport-fit
                pass — at 232.8 each card would climb back to 374 px tall
                and break the 1440×900 budget). The 884-wide row sits
                centered above the 1112-wide bottom block — a deliberate
                "5 → 4 → 2" funnel asymmetry where the cards row is
                narrower than the engine/factory block below.
              Below `md` (the mobile factory below takes over). All
              interior dimensions use `cqw`, so orb, title, blurb, arrow
              shrink together with the column width. Never wraps;
              never overflows. */}
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

          {/* Mobile: 5 horizontal cards stacked vertically. Shown below md.
              Top margin matches the desktop value above so the section's
              internal rhythm stays constant across breakpoints. */}
          <div className="mt-[64px] md:hidden">
            <CleanStartFactoryMobile />
          </div>

          {/* Bottom factory block (Figma node 810:1503). Pure DOM/CSS,
              the only assets are diagonal-lines.png + factory-arrow.svg +
              the shared flare.webp. Sized in cqw via its own container query
              so every interior layer scales as one with the block width.
              Width capped at 1112 (matches the cards row cap above) — the
              `BB_W = 1276` reference inside `FactoryBottomBlock` stays
              the same, so every `CQW(x)` interior position is unchanged;
              only the rendered scale shrinks. */}
          <div
            className="mx-auto mt-[32px] hidden md:block"
            style={{ width: "100%", maxWidth: 1112 }}
          >
            <FactoryBottomBlock />
          </div>

          {/* Bottom pad reserves room for the rocket-exhaust flares that
              extend below the block. At the 1112-px block scale the flare
              image is ≈ 279 × 374 px and anchored with `marginTop: -180cqw`,
              so the bright cores extend ~67 px below the block and the
              tapered halo trails to ~217 px below. 96 px shows the full
              bright cores + most of the halo without re-inflating the
              section past the 1440×900 budget. */}
          <div className="pb-[96px]" />

        </div>
      </Container>
    </Section>
  );
}
