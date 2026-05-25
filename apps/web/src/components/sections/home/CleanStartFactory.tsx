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
      {/* Card background — the cropped image is the card body, 1:1 alignment.
          `borderRadius: 10.3cqw` (= 24 px at desktop card width, matching
          Figma `Rectangle 1000001822` borderRadius:24) clips any partial-alpha
          pixels at the bottom-left flare-halo leak so all four corners read as
          a true, constant rounded-rect on the shared background. */}
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
