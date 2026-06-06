import { Suspense } from "react";
import { SearchBar } from "@/components/sections/_shared/SearchBar";
import { HeroReveal } from "@/components/ui/Reveal";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 25.7%, #10123e 37.8%, #131e8f 66.9%, #471ec0 79.7%, #471fc3 92.2%, rgba(70,30,191,0.85) 97.9%, rgba(66,30,188,0.4) 107.7%, rgba(66,30,188,0) 113.5%)";

interface CareersHeroProps {
  initialQuery: string;
}

export function CareersHero({ initialQuery }: CareersHeroProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(420px, 37vw, 521px)", background: HERO_GRADIENT }}
      aria-labelledby="careers-hero-title"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/resource-center/hero-bg-grid.svg"
        alt=""
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1647px",
          top: "-1px",
          width: "419px",
          height: "419px",
          mixBlendMode: "color-dodge",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/resource-center/hero-cube.webp"
          alt=""
          className="w-full h-full object-cover"
          style={{ transform: "rotate(-46.54deg)", opacity: 0.4 }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-130px",
          top: "286px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/resource-center/hero-glow-left.webp"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col items-center gap-6 lg:gap-8 mx-auto pt-[clamp(112px,8vw,128px)]"
          style={{ maxWidth: "955px" }}
        >
          <div
            className="flex flex-col items-center gap-6 text-center text-white"
            style={{ maxWidth: "674px" }}
          >
            <HeroReveal y={50} duration={1.0}>
              <h1
                id="careers-hero-title"
                className="font-display font-semibold"
                style={{
                  fontSize: "var(--fs-display)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                }}
              >
                Careers
              </h1>
            </HeroReveal>
            <HeroReveal y={30} delay={0.15} duration={0.8}>
              <p
                className="font-sans font-normal"
                style={{
                  fontSize: "var(--fs-lead)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.04em",
                  opacity: 0.8,
                }}
              >
                Trusted software starts at the foundation. Be part of the mission
                redefining security and trust for modern software delivery.
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
              initialQuery={initialQuery}
              placeholder="Enter keyword..."
              ariaLabel="Search open roles"
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
