import Image from "next/image";
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
      {/* Card background — the cropped image is the card body, 1:1 alignment. */}
      <Image
        src="/images/cleanstart-factory/factory-card-bg.webp"
        alt=""
        aria-hidden
        width={232}
        height={374}
        sizes="(min-width: 1280px) 233px, 16vw"
        priority={isFirst}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
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

      {/* Arrow circle. */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full border-white/95"
        style={{
          top: "138.32cqw",
          width: "12.03cqw",
          height: "12.03cqw",
          borderWidth: "0.75cqw",
        }}
      >
        <svg
          viewBox="0 0 28 28"
          fill="none"
          style={{ width: "35%", height: "35%" }}
        >
          <path
            d="M13.5127 8.24061L18.6556 13.3834C18.8163 13.5442 18.9065 13.7621 18.9065 13.9893C18.9065 14.2166 18.8163 14.4345 18.6556 14.5952L13.5127 19.7381"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Light beam — anchored to the card's bottom edge, extending downward.
          Thicker and brighter pass: width bumped to 65 cqw so the beam reads
          as a substantial luminous shaft, pulled up by 18 cqw so the bright
          core sits just below the card's bottom edge. Aspect 267:358 preserved
          via height auto. `mix-blend-mode: screen` lifts the cyan onto the
          dark backdrop without muddying it. */}
      <Image
        src="/images/cleanstart-factory/flare.webp"
        alt=""
        aria-hidden
        width={267}
        height={358}
        sizes="(min-width: 1280px) 160px, 12vw"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none"
        style={{
          width: "65cqw",
          height: "auto",
          top: "100%",
          marginTop: "-18cqw",
          mixBlendMode: "screen",
          filter: "saturate(1.15) brightness(1.1)",
        }}
      />

      <figcaption className="sr-only">
        {data.title.replace("\n", " ")}. {data.blurb.replace("\n", " ")}
      </figcaption>
    </figure>
  );
}

export function CleanStartFactory() {
  // Background is inherited from the parent `bg-cs-hero bg-cs-grid` wrapper
  // in page.tsx so the Hero and Factory sections share one continuous backdrop.
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

          {/* Bottom factory block — will be rebuilt with DOM + the shared flare /
              card-bg assets in the next iteration. The per-card flares above
              already extend below each card via overflow, so no extra beam
              row is needed here. */}

          <div className="pb-[200px]" />

        </div>
      </Container>
    </Section>
  );
}
