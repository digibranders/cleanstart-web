import { Suspense } from "react";
import { SearchBar } from "@/components/sections/_shared/SearchBar";

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
      {/* Background dot grid */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/resource-center/hero-bg-grid.svg"
        alt=""
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* 3D cube — top right */}
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
          src="/images/resource-center/hero-cube.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ transform: "rotate(-46.54deg)", opacity: 0.4 }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Left glow */}
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
          src="/images/resource-center/hero-glow-left.png"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col items-center gap-6 lg:gap-8 mx-auto pt-[clamp(112px,8vw,128px)]"
          style={{ maxWidth: "955px" }}
        >
          <div
            className="flex flex-col items-center gap-6 text-center text-white"
            style={{ maxWidth: "674px" }}
          >
            <h1
              id="careers-hero-title"
              className="font-display font-semibold"
              style={{
                fontSize: "clamp(36px, 4.45vw, 64px)",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              Careers
            </h1>
            <p
              className="font-sans font-normal"
              style={{
                fontSize: "clamp(1rem, 1.25vw, 1.5rem)",
                lineHeight: 1.3,
                letterSpacing: "-0.04em",
                opacity: 0.8,
              }}
            >
              Help us empower the world&rsquo;s largest enterprises to secure their
              applications. Are you ready to join?
            </p>
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
