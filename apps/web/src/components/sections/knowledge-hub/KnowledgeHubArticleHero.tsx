import { Suspense } from "react";
import { SearchBar } from "@/components/sections/_shared/SearchBar";
import { HeroReveal } from "@/components/ui/Reveal";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 0%, #10123e 38%, #131e8f 67%, #471ec0 80%, #471fc3 100%)";

export function KnowledgeHubArticleHero(): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "418px", background: HERO_GRADIENT }}
      aria-labelledby="knowledge-hub-hero-title"
    >
      {/* Decorative cube — lower-left (Figma image 583141) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          width: "332px",
          height: "313px",
          left: "-95px",
          top: "208px",
          mixBlendMode: "hard-light",
          opacity: 0.4,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Decorative cube — upper-right (Figma image 583137) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          width: "294px",
          height: "298px",
          left: "calc(1647 / 1920 * 100%)",
          top: "-1px",
          mixBlendMode: "color-dodge",
          transform: "rotate(-46.54deg)",
          opacity: 0.4,
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col items-center mx-auto"
          style={{ paddingTop: "120px", paddingBottom: "80px", maxWidth: "864px" }}
        >
          <HeroReveal y={50} duration={1.0}>
            <h1
              id="knowledge-hub-hero-title"
              className="font-display font-semibold text-white text-center"
              style={{
                fontSize: "var(--fs-display)",
                lineHeight: 1.0,
                letterSpacing: "-0.05em",
              }}
            >
              Knowledge <span style={{ color: "#FFFFFF" }}>Hub</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.2} duration={0.8} className="mt-10 w-full flex justify-center">
            <Suspense
              fallback={
                <div
                  className="flex items-center"
                  style={{ height: "42px", width: "674px" }}
                />
              }
            >
              <SearchBar
                initialQuery=""
                placeholder="Search blogs..."
                ariaLabel="Search knowledge hub"
              />
            </Suspense>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
