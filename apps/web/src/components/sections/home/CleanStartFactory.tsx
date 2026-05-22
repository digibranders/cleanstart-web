import { FactoryCard } from "@/components/ui/FactoryCard";
import { FactoryEnginePanel } from "@/components/sections/home/FactoryEnginePanel";
import { RocketFlame } from "@/components/ui/RocketFlame";

const CARDS = [
  { title: "Clean Images", description: "Minimal. Immutable. Zero CVE." },
  { title: "Clean Packages", description: "Curated. Verified. No hidden risk." },
  { title: "Clean AI Models", description: "Scanned. Signed. Safe by design." },
  { title: "Clean Sight", description: "AI-powered insights. Risk, policy & drift detection." },
  { title: "Clean Libraries", description: "Complete. Signed. Continuously verified." },
];

// Flame is 36px wide; subtract 18px to align flame CENTER with target X.
// 5 top flames — one centered under each top card.
// Card spacing at max-width 1276px: (1276 − 4×28) / 5 = 232.8px cards, gap 28px → 260.8px center-to-center.
const TOP_FLAMES = [
  "calc(50% - 539.6px)", // -521.6 - 18 (half flame width)
  "calc(50% - 278.8px)", // -260.8 - 18
  "calc(50% - 18px)",    //   0    - 18
  "calc(50% + 242.8px)", // +260.8 - 18
  "calc(50% + 503.6px)", // +521.6 - 18
];

// 4 bottom flames — evenly distributed under the engine panel, each centered.
const BOTTOM_FLAMES = [
  "calc(50% - 338px)", // -320 - 18
  "calc(50% - 125px)", // -107 - 18
  "calc(50% + 89px)",  // +107 - 18
  "calc(50% + 302px)", // +320 - 18
];

export function CleanStartFactory() {
  return (
    <section className="relative overflow-hidden pb-16 pt-4 sm:pb-20 lg:pb-24">
      {/* Title block — H2 + supporting line. Gives the "Factory" metaphor
          immediate context: the 5 cards aren't a feature grid, they're a
          pipeline. Subtitle is intentionally short (one line at desktop). */}
      <div className="mx-auto max-w-[820px] px-6 text-center">
        <h2
          id="cleanstart-factory-title"
          className="font-display font-bold text-white"
          style={{
            fontSize: "var(--text-t-display-2)",
            letterSpacing: "var(--text-t-display-2-ls)",
            lineHeight: "var(--text-t-display-2-lh)",
          }}
        >
          The CleanStart Factory
        </h2>
      </div>

      {/* Mobile/tablet (< lg) — Figma 403:15302 spec:
          Each card sits to the right of a horizontal cyan flare (216×161 with
          plus-lighter blend) that peeks from behind the card's left edge. At
          the bottom of the card stack, two more flares (225×167, rotated 90°)
          point upward from the engine intake area. Hidden at lg+ where the
          5-card row uses the rocket-flame engine instead. */}
      <div className="relative mx-auto mt-10 w-full max-w-[var(--container-default)] px-6 sm:mt-12 sm:px-10 lg:hidden">
        {/* Group 2085665153 — Bottom flares matching Figma mobile specs, placed before ul to render behind it */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: "231.83px",
            height: "225px",
            left: "calc(50% - 231.83px / 2 + 16.84px)",
            top: "calc(100% - 95px)",
            zIndex: 0,
          }}
          aria-hidden
        >
          <div className="relative w-full h-full">
            {/* Flare 1 (Figma 403:15299) */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: "0px",
                top: "0px",
                width: "167.81px",
                height: "225px",
              }}
            >
              <span
                className="flex-none"
                style={{
                  width: "225px",
                  height: "167.81px",
                  transform: "rotate(90deg)",
                  mixBlendMode: "plus-lighter",
                  background: "radial-gradient(50% 50% at 50% 50%, #FFF7ED 0%, #FFE062 8.33%, #98A809 36.98%, #212D00 100%)",
                  filter: "blur(0.5px)",
                  animation: "cs-pulse-glow-flare 3.6s ease-in-out 0s infinite",
                }}
              />
            </div>
            {/* Flare 2 (Figma 403:15300) */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: "64.03px",
                top: "0px",
                width: "167.81px",
                height: "225px",
              }}
            >
              <span
                className="flex-none"
                style={{
                  width: "225px",
                  height: "167.81px",
                  transform: "rotate(90deg)",
                  mixBlendMode: "plus-lighter",
                  background: "radial-gradient(50% 50% at 50% 50%, #FFF7ED 0%, #FFE062 8.33%, #98A809 36.98%, #212D00 100%)",
                  filter: "blur(0.5px)",
                  animation: "cs-pulse-glow-flare 3.6s ease-in-out 0.6s infinite",
                }}
              />
            </div>
          </div>
        </div>

        <ul
          aria-labelledby="cleanstart-factory-title"
          className="relative z-10 ml-[25px] flex flex-col gap-3 sm:gap-4 list-none p-0"
        >
          {/* Vertical guide-line behind the left flares */}
          <div
            className="absolute w-[1px] bg-white/20 pointer-events-none"
            style={{ left: "-25px", top: "44px", bottom: "44px" }}
          />
          {CARDS.map((card, i) => (
            <li key={card.title} className="relative">
              {/* Lens-flare — Figma 403:15292: a bright cyan-white core with
                  a thin horizontal light beam streaking through it. Built as
                  two stacked CSS layers since the real Figma flare uses a
                  PNG mask we don't have:
                    1. A thin horizontal streak (the beam)
                    2. A small bright radial dot (the lens core)
                  Both composited with plus-lighter so they brighten the dark
                  section without obscuring it. */}
              <FactoryFlare
                left="-25px"
                delay={`${i * 0.45}s`}
                orient="horizontal"
              />
              <FactoryCard {...card} />
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop (lg+): 5-card row that the engine flames anchor to. */}
      <ul
        aria-labelledby="cleanstart-factory-title"
        className="mx-auto mt-10 hidden w-full max-w-[var(--container-default)] grid-cols-5 gap-5 px-6 sm:px-10 lg:mt-14 lg:grid xl:gap-7 list-none p-0"
      >
        {CARDS.map((card) => (
          <li key={card.title}>
            <FactoryCard {...card} />
          </li>
        ))}
      </ul>

      {/* Engine panel + flames */}
      <div className="relative mx-auto mt-12 max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Top 5 flames — bulb sits at the bottom of each card. Container offset = -mt-12 (48px)
             so flame top = card bottom. Flame height 130px = 48 (gap) + 82 (into panel).
             z-0 so panel content sits above the lower portion of the flames.
             Hidden below `lg`: the flame x-offsets (calc(50% ± 539.6px ...)) are
             calibrated to the 5-up Figma layout that only renders at lg+; on
             narrower viewports the cards stack and the flames would point
             nowhere. */}
        <div
          className="pointer-events-none absolute inset-x-0 z-0 mx-auto hidden h-[140px] lg:block"
          style={{ top: "-48px" }}
          aria-hidden
        >
          {TOP_FLAMES.map((left, i) => (
            <RocketFlame key={`top-${left}`} left={left} delay={i * 180} height={130} />
          ))}
        </div>

        <FactoryEnginePanel />

        {/* Bottom 4 flames — emerge from BOTTOM EDGE of engine panel, stream DOWN.
             Top of this container = panel bottom edge. Same lg-only constraint
             as the top flames (x-offsets only align with the 1276 engine panel). */}
        <div
          className="pointer-events-none absolute inset-x-0 top-full z-0 mx-auto hidden h-[180px] lg:block"
          aria-hidden
        >
          {BOTTOM_FLAMES.map((left, i) => (
            <RocketFlame
              key={`bot-${left}`}
              left={left}
              delay={i * 220}
              height={160}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Lens-flare visual that mimics the Figma 403:15292 flare shape using two
 * stacked CSS gradients (Figma uses a PNG mask which we don't have):
 *   1. A thin tall vertical streak — the "beam"
 *   2. A small bright radial — the "lens core"
 * Composited with `plus-lighter` so the bright core punches over the dark
 * factory section background without dominating it.
 */
function FactoryFlare({
  left,
  top = "50%",
  rotate = "0deg",
  delay = "0s",
  orient = "vertical",
}: {
  left: string;
  top?: string;
  rotate?: string;
  delay?: string;
  orient?: "vertical" | "horizontal";
}) {
  const verticalTransform =
    top === "50%" ? "translateY(-50%)" : "";
  const wrapTransform = [
    "translateX(-50%)",
    verticalTransform,
    `rotate(${rotate})`,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left,
        top,
        width: "216px",
        height: "161px",
        transform: wrapTransform,
        animation: `cs-pulse-glow-flare 3.6s ease-in-out ${delay} infinite`,
      }}
    >
      {/* Beam — thin tall light streak */}
      <span
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: orient === "vertical" ? "3px" : "216px",
          height: orient === "vertical" ? "161px" : "3px",
          transform: "translate(-50%, -50%)",
          mixBlendMode: "plus-lighter",
          background:
            orient === "vertical"
              ? "linear-gradient(180deg, rgba(2,17,47,0) 0%, rgba(11,138,227,0.6) 30%, rgb(211,255,248) 50%, rgba(11,138,227,0.6) 70%, rgba(2,17,47,0) 100%)"
              : "linear-gradient(90deg, rgba(2,17,47,0) 0%, rgba(11,138,227,0.6) 30%, rgb(211,255,248) 50%, rgba(11,138,227,0.6) 70%, rgba(2,17,47,0) 100%)",
          filter: "blur(0.5px)",
        }}
      />
      {/* Core — bright cyan lens dot/glow */}
      <span
        className="absolute inset-0"
        style={{
          mixBlendMode: "plus-lighter",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(211,255,248,1) 0%, rgba(164,235,248,1) 2.6%, rgba(116,214,249,1) 5.2%, rgba(68,194,249,1) 7.8%, rgba(45,184,249,1) 9.1%, rgba(21,173,250,1) 10.4%, rgba(11,138,227,1) 29.7%, rgba(1,102,204,1) 49%, rgba(1,81,165,1) 61.7%, rgba(1,60,125,1) 74.5%, rgba(2,38,86,1) 87.2%, rgba(2,17,47,0) 100%)",
          filter: "blur(0.5px)",
        }}
      />
    </span>
  );
}
