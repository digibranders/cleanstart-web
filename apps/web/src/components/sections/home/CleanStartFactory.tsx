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
  { title: "Clean\nSight", blurb: "AI-powered insights. Risk,\npolicy & drift detection." },
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
      className="factory-card relative shrink-0"
      style={{
        // Fluid card width — desktop max 232.8, smaller on narrow viewports.
        width: "clamp(180px, 16.2vw, 232.8px)",
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
            fontSize: "13.75cqw",
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
            fontSize: "6.01cqw",
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
          width: "12.03cqw",
          height: "12.03cqw",
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
// Bottom block — Figma `factory-bottom` (node 810:1503). 1276 × 285 at
// frame (30, 860). Implementation strategy: use Figma-exported SVGs for the
// visually complex layers (outer card with gradient + 2 px lavender stroke +
// 4-stop drop shadow; orb glows with noise-blur; arrow with gradient fill +
// radial stroke + drop shadow; small accent path with blur; flare composite),
// and pure CSS for the structural pieces (panels, text, pill buttons). All
// dimensions in cqw via CQW() so the block scales with its container width.
// =============================================================================

const BB_W = 1276;
const BB_H = 285;
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
        // Right panel at bottom-block (714, 48). Left panel at wrapper-local
        // (0, 0) — the caller positions the wrapper at (46, 48).
        left: side === "left" ? 0 : CQW(714),
        top: side === "left" ? 0 : CQW(48),
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
          aspect. Set EXPLICIT pixel height (430 cqw) to force the correct
          viewBox aspect — without it `height: auto` ends up at 739 px and
          pushes the card to ~1.7× its real height. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-factory/factory-card-mask.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: CQW(-190),
          top: CQW(-21),
          width: CQW(1478),
          height: CQW(430),
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
            height: `${(281 / BB_H) * 100}%`,
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

        {/* Left wrapper Frame 2147238459 at (46, 48), 666 × 184.717.
            Figma layer order (bottom → top):
              1. Arrow Vector 1194233950
              2. Left panel Frame 2147238336 (paints over arrow's left half)
              3. Small accent Vector 1194233951 */}
        <div
          className="absolute"
          style={{
            left: CQW(46),
            top: CQW(48),
            width: CQW(666),
            height: CQW(184.717),
          }}
        >
          {/* Arrow — factory-arrow.svg with gradient fill + radial stroke +
              4-stop drop-shadow baked in.
              · Vertical centering: panel is 184.717 tall, arrow body is 70.539
                tall → centered top = (184.717 − 70.539)/2 ≈ 57.09 (was 54.16
                per raw Figma spec; we override to mid-panel for visual balance).
              · Horizontal overlap: spec puts arrow left edge at wrapper x=512
                which is exactly the panel right edge. Pulling left by 8 px so
                the rounded tail merges into the panel right edge instead of
                reading as a separate floating element.
              · SVG canvas (352.536 × 215.539) is positioned around the
                154 × 70.539 path bbox via Figma's own inset technique. */}
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: CQW(512 - 8),
              top: CQW(57.09),
              width: CQW(154),
              height: CQW(70.539),
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
  return (
    <Section padding="none" className="relative overflow-hidden">
      <Container>
        <div className="relative mx-auto" style={{ maxWidth: 1276 }}>
          <div
            aria-hidden
            className="mx-auto mt-[160px]"
            style={{
              width: "100%",
              height: 2,
              borderRadius: 70,
              background:
                "linear-gradient(90deg, rgba(59, 63, 173, 0) 0%, rgba(59, 63, 173, 1) 50%, rgba(59, 63, 173, 0) 100%)",
            }}
          />

          <h2
            className="mt-[80px] text-center font-display text-white"
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            The CleanStart Factory
          </h2>

          <div
            className="relative mx-auto mt-[64px] flex flex-wrap items-start justify-center"
            style={{ gap: 28 }}
          >
            {CARDS.map((c, i) => (
              <FactoryCard key={c.title} data={c} isFirst={i === 0} />
            ))}
          </div>

          {/* Bottom factory block (Figma node 810:1503). Pure DOM/CSS,
              the only assets are diagonal-lines.png + factory-arrow.svg +
              the shared flare.webp. Sized in cqw via its own container query
              so every interior layer scales as one with the block width. */}
          <div className="mt-[56px]">
            <FactoryBottomBlock />
          </div>

          <div className="pb-[180px]" />

        </div>
      </Container>
    </Section>
  );
}
