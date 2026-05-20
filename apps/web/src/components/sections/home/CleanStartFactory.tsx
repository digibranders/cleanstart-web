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
    <section className="relative overflow-hidden pb-20 pt-4 sm:pb-24 lg:pb-32">
      {/* Title block — H2 + supporting line. Gives the "Factory" metaphor
          immediate context: the 5 cards aren't a feature grid, they're a
          pipeline. Subtitle is intentionally short (one line at desktop). */}
      <div className="mx-auto max-w-[820px] px-6 text-center">
        <h2
          id="cleanstart-factory-title"
          className="font-display text-[clamp(2rem,5.2vw,3.875rem)] font-bold tracking-[-0.05em] text-white"
          style={{ lineHeight: "100%" }}
        >
          The CleanStart Factory
        </h2>
        <p
          className="mx-auto mt-5 max-w-[640px] font-sans text-white/75"
          style={{
            fontSize: "clamp(1rem,1.4vw,1.25rem)",
            fontWeight: 400,
            lineHeight: "150%",
            letterSpacing: "-0.02em",
          }}
        >
          A continuous, AI-orchestrated pipeline that turns open-source software
          into hardened, signed, deterministic container images — every build,
          end-to-end.
        </p>
      </div>

      <ul
        aria-labelledby="cleanstart-factory-title"
        className="mx-auto mt-10 grid w-full max-w-[1276px] grid-cols-1 gap-3 px-6 sm:mt-12 sm:grid-cols-3 sm:gap-5 lg:mt-14 lg:grid-cols-5 lg:gap-7 list-none p-0"
      >
        {CARDS.map((card) => (
          <li key={card.title}>
            <FactoryCard {...card} />
          </li>
        ))}
      </ul>

      {/* Engine panel + flames */}
      <div className="relative mx-auto mt-12 max-w-[1276px] px-6">
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
