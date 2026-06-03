import Image from "next/image";
import { Container } from "@/components/layout";
import { HeroReveal } from "@/components/ui/Reveal";

// Artboard hero gradient (179.99deg dark → indigo → violet → fade), shared with
// the other listing-page heroes.
const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 25.7%, #10123e 37.8%, #131e8f 66.9%, #471ec0 79.7%, #471fc3 92.2%, rgba(70,30,191,0.85) 97.9%, rgba(66,30,188,0.4) 107.7%, rgba(66,30,188,0) 113.5%)";

export function CaseStudiesHero(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(440px, 39vw, 560px)", background: HERO_GRADIENT }}
      aria-labelledby="case-studies-hero-title"
    >
      {/* Decorative grid + glow lines baked from Figma (full-bleed). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/case-studies/hero-grid.svg"
        alt=""
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* 3D "Case Study" illustration — anchored to the right of the hero band,
          with its purple + white glows centred behind it. Hidden below md
          where it would crowd the headline. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "clamp(8px, 4vw, 96px)",
          top: "50%",
          transform: "translateY(-50%)",
          width: "clamp(360px, 36vw, 560px)",
          aspectRatio: "575 / 347",
        }}
      >
        {/* Purple glow (Figma "Ellipse 46691"): #B23EFF, blurred, centred on the
            illustration. Blur scales with the illustration's fluid width. */}
        <div
          className="absolute left-1/2 top-1/2 z-0"
          style={{
            width: "86%",
            aspectRatio: "497 / 502",
            transform: "translate(-50%, -50%)",
            background: "#B23EFF",
            filter: "blur(clamp(105px, 11vw, 172px))",
            borderRadius: "50%",
          }}
        />
        {/* Radially-faded grid glow (Figma "Vector"): a small-square grid that
            fades from white at its centre to transparent, centred on the
            illustration. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/case-studies/hero-glow-grid.svg"
          alt=""
          className="absolute left-1/2 top-1/2 z-0 max-w-none"
          style={{
            width: "127%",
            aspectRatio: "730 / 498",
            transform: "translate(-50%, -50%)",
          }}
          loading="lazy"
          decoding="async"
        />
        <Image
          src="/images/case-studies/hero-illustration.png"
          alt=""
          width={575}
          height={347}
          priority
          sizes="(min-width: 1280px) 560px, 36vw"
          className="relative z-10 w-full h-auto object-contain"
        />
      </div>

      <Container className="relative">
        <div
          className="flex flex-col items-start gap-6 pt-[clamp(96px,11vw,168px)] pb-[clamp(56px,7vw,96px)]"
          style={{ maxWidth: "640px" }}
        >
          <HeroReveal y={50} duration={1.0}>
            <h1
              id="case-studies-hero-title"
              className="font-display font-semibold text-white"
              style={{
                fontSize: "var(--fs-h1)",
                letterSpacing: "var(--text-hero-utility-ls)",
                lineHeight: "var(--text-hero-lh)",
              }}
            >
              Case Studies
            </h1>
          </HeroReveal>
          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              className="font-sans font-normal text-white"
              style={{
                fontSize: "var(--fs-lead)",
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                opacity: 0.8,
                maxWidth: "30ch",
              }}
            >
              Real challenges. Our Solutions measurable impact for our customers.
            </p>
          </HeroReveal>
        </div>
      </Container>
    </section>
  );
}
