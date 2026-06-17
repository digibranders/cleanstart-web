import Image from "next/image";
import Link from "next/link";
import { Section, Container } from "@/components/layout";
import { FlowBeam } from "@/components/ui/FlowBeam";
import { Reveal } from "@/components/ui/Reveal";
import { ScaleToFit } from "@/components/ui/ScaleToFit";

// Natural desktop width of the enclosure; ScaleToFit renders at this width and
// scales the whole block down to fit narrower viewports (never stacks).
const ENCLOSURE_DESIGN_WIDTH = 1058;

type CardData = {
  /** Two-line title, split on the newline. */
  title: string;
  blurb: string;
  /** Original iridescent orb art (designed to sit on the blue card surface). */
  icon: string;
  href: string;
};

const CARDS: CardData[] = [
  {
    title: "CleanStart\nImages",
    blurb: "Verified zero-CVE container foundations for modern software delivery.",
    icon: "/images/cleanstart-factory/factory-images.webp",
    href: "/cleanstart-images",
  },
  {
    title: "CleanStart\nLibraries",
    blurb: "Trusted open-source dependencies built from verified sources.",
    icon: "/images/cleanstart-factory/factory-libraries.webp",
    href: "/cleanstart-platform",
  },
  {
    title: "Clean\nSight",
    blurb: "Continuous visibility into inherited software supply chain risk.",
    icon: "/images/cleanstart-factory/factory-models.webp",
    href: "/cleansight",
  },
];

/** Repeating diagonal-line texture, matching the original factory family. */
function DiagonalHatch({ opacity = 0.6 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: "url(/images/cleanstart-factory/diagonal-lines.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "22px 22px",
        mixBlendMode: "luminosity",
        opacity,
      }}
    />
  );
}

// Original blue glass card: every interior dimension is in container-query
// units (cqw = 1% of card width), so orb, type, arrow and the rocket-exhaust
// flare all scale 1:1 with whatever width the grid hands the card.
function FactoryCard({ data, isFirst }: { data: CardData; isFirst: boolean }) {
  const plainTitle = data.title.replace("\n", " ");
  return (
    <figure
      className="factory-card relative flex h-full min-w-0 flex-col"
      style={{ containerType: "inline-size" }}
    >
      {/* Blue glass card body (designed art, with baked top/bottom glows). */}
      <Image
        src="/images/cleanstart-factory/factory-card-bg.webp"
        alt=""
        aria-hidden
        width={232}
        height={374}
        sizes="(min-width: 1024px) 320px, 42vw"
        priority={isFirst}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ borderRadius: "9cqw" }}
      />

      {/* Content layer — drives the card height (no fixed aspect ratio), so the
          card is only as tall as its content; the grid equalises the three. */}
      <div className="relative flex flex-1 flex-col items-center px-[8cqw] pb-[9cqw] pt-[11cqw] text-center">
        <Image
          src={data.icon}
          alt=""
          aria-hidden
          width={200}
          height={210}
          sizes="(min-width: 1024px) 140px, 22vw"
          priority={isFirst}
          className="pointer-events-none select-none"
          style={{ width: "44cqw", height: "auto" }}
        />

        <h3
          className="mt-[7cqw] whitespace-pre-line font-display font-normal text-white"
          style={{
            fontSize: "clamp(18px, 11.2cqw, 30px)",
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
          }}
        >
          {data.title}
        </h3>

        <p
          className="mt-[5cqw] whitespace-pre-line text-white/80"
          style={{
            fontFamily: "var(--font-sora), Sora, sans-serif",
            fontSize: "var(--fs-body)",
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
          }}
        >
          {data.blurb}
        </p>

        <Link
          href="#"
          aria-label={`Learn more about ${plainTitle}`}
          className="mt-auto inline-flex cursor-pointer items-center justify-center rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ width: "clamp(24px, 11cqw, 30px)", height: "clamp(24px, 11cqw, 30px)" }}
        >
          <svg
            aria-hidden
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block size-full overflow-visible"
          >
            <path
              d="M13.5127 8.24061L18.6556 13.3834C18.8163 13.5442 18.9065 13.7622 18.9065 13.9894C18.9065 14.2167 18.8163 14.4347 18.6556 14.5954L13.5127 19.7383C13.4337 19.8202 13.3391 19.8854 13.2345 19.9304C13.1299 19.9753 13.0175 19.9989 12.9037 19.9999C12.7898 20.0009 12.677 19.9792 12.5716 19.9361C12.4663 19.893 12.3706 19.8294 12.2901 19.7489C12.2096 19.6684 12.146 19.5727 12.1029 19.4674C12.0598 19.362 12.0381 19.2492 12.0391 19.1354C12.0401 19.0216 12.0637 18.9091 12.1087 18.8045C12.1536 18.6999 12.2189 18.6054 12.3007 18.5263L16.8376 13.9894L12.3007 9.45261C12.1446 9.29095 12.0582 9.07443 12.0602 8.84969C12.0621 8.62495 12.1523 8.40997 12.3112 8.25105C12.4701 8.09213 12.6851 8.00199 12.9098 8.00003C13.1346 7.99808 13.3511 8.08447 13.5127 8.24061Z"
              fill="white"
            />
            <rect
              x="0.875"
              y="0.875"
              width="26.25"
              height="26.25"
              rx="13.125"
              stroke="white"
              strokeWidth="1.75"
            />
          </svg>
        </Link>
      </div>

      <figcaption className="sr-only">
        {plainTitle}. {data.blurb}
      </figcaption>
    </figure>
  );
}

// Intelligence Centre bar — the original platform-bar treatment (indigo
// gradient, lavender stroke, diagonal hatch), opaque so it occludes the card
// exhaust-flare tails that bleed up from the gap above it.
function IntelligenceBar() {
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden text-center"
      style={{
        containerType: "inline-size",
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)",
        border: "1px solid #dab6f3",
        borderRadius: 18,
        padding: "clamp(16px, 2.2cqw, 26px) 24px",
        gap: "clamp(8px, 1cqw, 14px)",
        boxShadow:
          "-8px 4px 20px rgba(0,0,0,0.23), -33px 16px 37px rgba(0,0,0,0.2)",
      }}
    >
      <DiagonalHatch opacity={0.6} />
      <h3
        className="relative font-display font-normal text-white"
        style={{
          fontSize: "clamp(20px, 3.05cqw, 30px)",
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
        }}
      >
        CleanStart Intelligence Centre
      </h3>
      <p
        className="relative text-white/80"
        style={{
          fontFamily: "var(--font-sora), Sora, sans-serif",
          fontSize: "var(--fs-body)",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}
      >
        Tricorder Powered analysis engine
      </p>
    </div>
  );
}

// Original factory enclosure (dark-navy → indigo → purple gradient, lavender
// stroke, diagonal hatch, layered drop shadow) wrapping the 3 cards and the
// Intelligence Centre bar.
function FactoryEnclosure() {
  return (
    <div className="relative w-full">
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 32,
          background: "rgba(28, 28, 28, 0.7)",
          border: "1px solid #dab6f3",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        {/* Diagonal blue light-streak glow (Figma "image 2994"), exported at the
            enclosure size and blended `lighten` so it adds light over the dark
            panel without darkening it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-factory/factory-overlay.png"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={{ mixBlendMode: "lighten" }}
        />

        <DiagonalHatch opacity={0.3} />

        <div className="relative flex flex-col p-[30px]">
          {/* Cards — a centered group, narrower than the bar below it. */}
          <div className="relative mx-auto w-full max-w-[732px]">
            <div className="grid grid-cols-3 gap-7">
              {CARDS.map((c, i) => (
                <div key={c.title} className="w-full">
                  <FactoryCard data={c} isFirst={i === 0} />
                </div>
              ))}
            </div>
          </div>

          {/* Connector beams — flush band between the cards and the bar, one
              per card. Mirrors the card grid (same width + gap) so each beam
              stays centred on its card whatever the gap. Each is a flowing
              dashed "current"; `reverse` makes it flow bottom-up (Intelligence
              Centre → cards). Phase-offset per lane for life. Always shown: the
              layout never collapses to a single column. */}
          <div className="relative mx-auto w-full max-w-[732px]">
            <div className="grid h-[38px] grid-cols-3 gap-7">
              {[0, 1, 2].map((i) => (
                <div key={i} aria-hidden className="relative overflow-hidden">
                  <FlowBeam
                    reverse
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2"
                    style={{ ["--beam-delay" as string]: `${i * 0.12}s` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bar — centered and narrower than the full enclosure interior, while
              still wider than the 732px cards group above it. */}
          <div className="mx-auto w-full max-w-[880px]">
            <IntelligenceBar />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformPipeline() {
  // Background is inherited from the parent `bg-cs-hero` wrapper in page.tsx so
  // the Hero and Factory sections share one continuous backdrop.
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
              className="mt-[40px] text-center font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              Trusted Software Delivery Starts Here
            </h2>
          </Reveal>

          <div className="mt-[44px]">
            <ScaleToFit designWidth={ENCLOSURE_DESIGN_WIDTH}>
              <FactoryEnclosure />
            </ScaleToFit>
          </div>

          <div className="pb-[96px]" />
        </div>
      </Container>
    </Section>
  );
}
