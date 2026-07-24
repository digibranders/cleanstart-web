import { Suspense } from "react";
import { SearchBar } from "@/components/sections/_shared/SearchBar";
import { HeroReveal } from "@/components/ui/Reveal";

// Own hero gradient — value mirrors the listing-hero purple but is defined
// locally so the guides hero never imports from sections/blogs.
const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 45%, #131e8f 61%, #471ec0 75%, #471fc3 84%, rgba(70,30,191,0.85) 88%, rgba(66,30,188,0.40) 95%, rgba(66,30,188,0) 99%)";

interface GuidesHeroProps {
  searchQuery: string;
}

export function GuidesHero({
  searchQuery,
}: GuidesHeroProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: HERO_GRADIENT }}
      aria-labelledby="guides-hero-title"
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden sm:block"
        style={{
          left: "-119px",
          top: "120px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/guides/hero-glow-left.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-[clamp(56px,7vw,96px)]">
        <div
          className="flex flex-col items-center gap-10 mx-auto"
          style={{ paddingTop: "calc(clamp(72px, 9vw, 122px) + var(--cs-header-extra))", maxWidth: "702px" }}
        >
          <div className="flex flex-col items-center gap-8 w-full">
            <HeroReveal y={50} duration={1.0} lcp>
              <h1
                id="guides-hero-title"
                className="font-display font-semibold text-white text-center w-full"
                style={{
                  fontSize: "var(--fs-h1)",
                  lineHeight: "var(--text-hero-lh)",
                  letterSpacing: "var(--text-hero-utility-ls)",
                }}
              >
                Guide
              </h1>
            </HeroReveal>
            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <p
                className="font-sans font-normal text-white text-center"
                style={{
                  fontSize: "var(--fs-lead)",
                  lineHeight: "1.4",
                  letterSpacing: "-0.04em",
                  opacity: 0.8,
                }}
              >
                A Curated Collection of Writings, Research, and Solutions
              </p>
            </HeroReveal>
          </div>

          <Suspense
            fallback={
              <div
                className="flex items-center"
                style={{ height: "44px", width: "100%", maxWidth: "674px" }}
              />
            }
          >
            <SearchBar
              initialQuery={searchQuery}
              placeholder="Search guides of your interest..."
              ariaLabel="Search guides"
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
